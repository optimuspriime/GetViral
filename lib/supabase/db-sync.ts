import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import type { Creator, PlatformAccount, MetricSnapshot, AudienceInsight, ProspectList, ProspectStatus } from "@/lib/model";

export type SupabaseConfigOverride = { url?: string; key?: string };

function resolveSupabaseClient(override?: SupabaseConfigOverride) {
  if (override?.url && override?.key) {
    return createClient(override.url, override.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return getSupabaseAdmin();
}

/**
 * Save an array of creators and their platform accounts to Supabase.
 * Resolves actual account row IDs on conflict to keep snapshot foreign keys valid.
 */
export async function saveCreatorsToSupabase(
  creators: Creator[],
  override?: SupabaseConfigOverride,
): Promise<{
  success: boolean;
  inserted: number;
  error?: string;
}> {
  const supabase = resolveSupabaseClient(override);
  if (!supabase) {
    return { success: false, inserted: 0, error: "Supabase credentials are not configured on the server." };
  }

  let count = 0;

  for (const creator of creators) {
    try {
      const { error: creatorErr } = await supabase.from("creators").upsert(
        {
          id: creator.id,
          name: creator.name,
          category: creator.category,
          language: creator.language,
          creator_country: creator.creatorCountry,
          creator_country_source: creator.creatorCountrySource,
          bio: creator.bio,
          avatar: creator.avatar,
          business_contact_email: creator.businessContact?.email ?? null,
          business_contact_source: creator.businessContact?.sourceUrl ?? null,
          business_contact_last_checked: creator.businessContact?.lastChecked ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (creatorErr) {
        console.error("Supabase creator upsert error:", creatorErr);
        continue;
      }

      for (const account of creator.accounts) {
        // Resolve if an account row already exists for (platform, handle)
        const { data: existingAcc } = await supabase
          .from("creator_platform_accounts")
          .select("id")
          .eq("platform", account.platform)
          .eq("handle", account.handle)
          .maybeSingle();

        const targetAccountId = existingAcc?.id || account.id;

        const { error: accErr } = await supabase.from("creator_platform_accounts").upsert(
          {
            id: targetAccountId,
            creator_id: creator.id,
            platform: account.platform,
            handle: account.handle,
            profile_url: account.profileUrl,
            activity: account.activity,
          },
          { onConflict: "id" },
        );

        if (accErr) {
          console.error("Supabase account upsert error:", accErr);
          continue;
        }

        const recentSnapshots = account.snapshots.slice(0, 15).map((s) => ({
          id: s.id,
          account_id: targetAccountId,
          metric_name: s.metricName,
          value: s.value,
          unit: s.unit,
          collected_at: s.collectedAt,
          window_start: s.windowStart ?? null,
          window_end: s.windowEnd ?? null,
          period_label: s.periodLabel ?? null,
          sample_size: s.sampleSize ?? null,
          source: s.source,
          status: s.status,
        }));

        if (recentSnapshots.length > 0) {
          await supabase.from("metric_snapshots").upsert(recentSnapshots, { onConflict: "id" });
        }
      }

      if (creator.audienceInsights && creator.audienceInsights.length > 0) {
        const insightsData = creator.audienceInsights.map((insight) => ({
          creator_id: creator.id,
          dimension: insight.dimension,
          value: insight.value,
          amount: insight.amount,
          unit: insight.unit,
          confidence: insight.confidence,
          source: insight.source,
          status: insight.status,
          collected_at: insight.collectedAt,
        }));
        await supabase.from("audience_insights").upsert(insightsData, { onConflict: "id" });
      }

      count++;
    } catch (err) {
      console.error("Error saving creator to Supabase:", err);
    }
  }

  return { success: count > 0, inserted: count };
}

/**
 * Loads specific creators by ID (or all if creatorIdsFilter is omitted) with accounts and snapshots.
 */
export async function loadCreatorsFromSupabase(
  override?: SupabaseConfigOverride,
  creatorIdsFilter?: string[],
): Promise<Creator[]> {
  const supabase = resolveSupabaseClient(override);
  if (!supabase) return [];

  if (creatorIdsFilter && creatorIdsFilter.length === 0) {
    return [];
  }

  try {
    let creatorsQuery = supabase.from("creators").select("*").order("name", { ascending: true });
    if (creatorIdsFilter && creatorIdsFilter.length > 0) {
      creatorsQuery = creatorsQuery.in("id", creatorIdsFilter);
    }

    const { data: creatorRows, error: cErr } = await creatorsQuery;
    if (cErr || !creatorRows || creatorRows.length === 0) return [];

    const fetchedCreatorIds = creatorRows.map((c) => c.id);

    let accountsQuery = supabase.from("creator_platform_accounts").select("*");
    if (creatorIdsFilter) {
      accountsQuery = accountsQuery.in("creator_id", fetchedCreatorIds);
    }
    const { data: accountRows } = await accountsQuery;

    const accountIds = (accountRows || []).map((a) => a.id);
    let snapshotRows: Array<Record<string, unknown>> = [];
    if (accountIds.length > 0) {
      let snapQuery = supabase
        .from("metric_snapshots")
        .select("*")
        .order("collected_at", { ascending: false });
      if (creatorIdsFilter) {
        snapQuery = snapQuery.in("account_id", accountIds);
      }
      const { data: snaps } = await snapQuery;
      snapshotRows = snaps || [];
    }

    let insightQuery = supabase.from("audience_insights").select("*");
    if (creatorIdsFilter) {
      insightQuery = insightQuery.in("creator_id", fetchedCreatorIds);
    }
    const { data: insightRows } = await insightQuery;

    const snapshotsByAccount = new Map<string, MetricSnapshot[]>();
    snapshotRows.forEach((row) => {
      const accountId = String(row.account_id);
      const list = snapshotsByAccount.get(accountId) || [];
      list.push({
        id: String(row.id),
        metricName: String(row.metric_name),
        value: row.value !== null && row.value !== undefined ? Number(row.value) : null,
        unit: (row.unit as MetricSnapshot["unit"]) || "count",
        collectedAt: String(row.collected_at),
        windowStart: row.window_start ? String(row.window_start) : null,
        windowEnd: row.window_end ? String(row.window_end) : null,
        periodLabel: row.period_label ? String(row.period_label) : null,
        sampleSize: row.sample_size !== null && row.sample_size !== undefined ? Number(row.sample_size) : null,
        source: String(row.source || "Platform API"),
        status: (row.status as MetricSnapshot["status"]) || "public",
      });
      snapshotsByAccount.set(accountId, list);
    });

    const accountsByCreator = new Map<string, PlatformAccount[]>();
    (accountRows || []).forEach((row) => {
      const list = accountsByCreator.get(row.creator_id) || [];
      list.push({
        id: row.id,
        platform: row.platform,
        handle: row.handle,
        profileUrl: row.profile_url,
        activity: row.activity,
        snapshots: snapshotsByAccount.get(row.id) || [],
      });
      accountsByCreator.set(row.creator_id, list);
    });

    const insightsByCreator = new Map<string, AudienceInsight[]>();
    (insightRows || []).forEach((row) => {
      const list = insightsByCreator.get(row.creator_id) || [];
      list.push({
        dimension: row.dimension,
        value: row.value,
        amount: row.amount !== null ? Number(row.amount) : null,
        unit: row.unit,
        collectedAt: row.collected_at,
        source: row.source,
        status: row.status,
        confidence: row.confidence !== null ? Number(row.confidence) : null,
      });
      insightsByCreator.set(row.creator_id, list);
    });

    return creatorRows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      language: row.language,
      creatorCountry: row.creator_country,
      creatorCountrySource: row.creator_country_source,
      bio: row.bio || "",
      avatar: row.avatar || "",
      accounts: accountsByCreator.get(row.id) || [],
      audienceInsights: insightsByCreator.get(row.id) || [],
      businessContact: row.business_contact_email
        ? {
            email: row.business_contact_email,
            sourceUrl: row.business_contact_source || "",
            lastChecked: row.business_contact_last_checked || row.created_at,
          }
        : null,
    }));
  } catch (err) {
    console.error("Error loading creators from Supabase:", err);
    return [];
  }
}

export function getDefaultUserListId(userId: string): string {
  return `list-${userId}-default`;
}

/**
 * Loads ONLY the shortlists and creators owned by this authenticated userId.
 * Completely isolates accounts from each other and from legacy shared rows.
 */
export async function loadUserAccountData(userId: string): Promise<{
  lists: ProspectList[];
  creators: Creator[];
}> {
  const supabase = getSupabaseAdmin();
  const defaultList: ProspectList = {
    id: getDefaultUserListId(userId),
    name: "Campaign Prospects Shortlist",
    creatorIds: [],
    notes: {},
    tags: {},
    statuses: {},
  };

  if (!supabase) {
    return { lists: [defaultList], creators: [] };
  }

  try {
    const { data: listRows, error: listErr } = await supabase
      .from("saved_lists")
      .select("id, name, created_at")
      .eq("created_by", userId)
      .order("created_at", { ascending: true });

    if (listErr || !listRows || listRows.length === 0) {
      return { lists: [defaultList], creators: [] };
    }

    const listIds = listRows.map((l) => l.id);
    const { data: membershipRows } = await supabase
      .from("list_memberships")
      .select("list_id, creator_id, status, notes, tags")
      .in("list_id", listIds);

    const memberships = membershipRows || [];
    const ownedCreatorIds = Array.from(new Set(memberships.map((m) => m.creator_id)));

    const lists: ProspectList[] = listRows.map((row) => {
      const items = memberships.filter((m) => m.list_id === row.id);
      const notes: Record<string, string> = {};
      const tags: Record<string, string[]> = {};
      const statuses: Record<string, ProspectStatus> = {};

      items.forEach((m) => {
        if (m.notes) notes[m.creator_id] = m.notes;
        if (Array.isArray(m.tags) && m.tags.length > 0) tags[m.creator_id] = m.tags;
        statuses[m.creator_id] = (m.status as ProspectStatus) || "To review";
      });

      return {
        id: row.id,
        name: row.name,
        creatorIds: items.map((m) => m.creator_id),
        notes,
        tags,
        statuses,
      };
    });

    const creators = await loadCreatorsFromSupabase(undefined, ownedCreatorIds);
    return { lists, creators };
  } catch (err) {
    console.error("Error loading user account data:", err);
    return { lists: [defaultList], creators: [] };
  }
}

/**
 * Checks whether a creator belongs to any shortlist owned by userId.
 */
export async function isCreatorOwnedByUser(userId: string, creatorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: listRows } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("created_by", userId);

  if (!listRows || listRows.length === 0) return false;

  const { data: membership } = await supabase
    .from("list_memberships")
    .select("creator_id")
    .in("list_id", listRows.map((l) => l.id))
    .eq("creator_id", creatorId)
    .limit(1)
    .maybeSingle();

  return Boolean(membership);
}

/**
 * Ensures any creators referenced by the user's lists are persisted,
 * and replaces/syncs ONLY the lists owned by `userId`.
 */
export async function syncUserListsToSupabase(
  userId: string,
  lists: ProspectList[],
  creatorsToSave?: Creator[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: "Supabase credentials are not configured on server." };
  }

  try {
    if (creatorsToSave && creatorsToSave.length > 0) {
      await saveCreatorsToSupabase(creatorsToSave);
    }

    // Namespace default legacy ID per user so two users never collide on "list-default-shortlist"
    const normalizedLists = lists.map((list) => ({
      ...list,
      id:
        list.id === "list-default-shortlist" || !list.id
          ? getDefaultUserListId(userId)
          : list.id.startsWith(`list-${userId}-`)
          ? list.id
          : `list-${userId}-${list.id.replace(/^list-/, "")}`,
    }));

    // Fetch current DB lists owned strictly by this user
    const { data: existingRows } = await supabase
      .from("saved_lists")
      .select("id")
      .eq("created_by", userId);

    const existingIds = new Set((existingRows || []).map((r) => r.id));
    const keepIds = new Set(normalizedLists.map((l) => l.id));

    // Delete lists that the user deleted (scoped strictly by created_by = userId)
    for (const oldId of existingIds) {
      if (!keepIds.has(oldId)) {
        await supabase.from("saved_lists").delete().eq("id", oldId).eq("created_by", userId);
      }
    }

    // Upsert user's lists & memberships
    for (const list of normalizedLists) {
      const { error: upErr } = await supabase.from("saved_lists").upsert(
        {
          id: list.id,
          name: list.name || "Untitled Shortlist",
          created_by: userId,
        },
        { onConflict: "id" },
      );

      if (upErr) {
        console.error("Failed to upsert saved_list:", upErr);
        continue;
      }

      // Sync memberships for this user's list
      await supabase.from("list_memberships").delete().eq("list_id", list.id);

      if (list.creatorIds.length > 0) {
        const rows = list.creatorIds.map((creatorId) => ({
          list_id: list.id,
          creator_id: creatorId,
          status: list.statuses?.[creatorId] || "To review",
          notes: list.notes?.[creatorId] || "",
          tags: list.tags?.[creatorId] || [],
        }));
        const { error: memErr } = await supabase
          .from("list_memberships")
          .upsert(rows, { onConflict: "list_id,creator_id" });
        if (memErr) {
          console.error("Failed to upsert list_memberships:", memErr);
        }
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sync user lists.",
    };
  }
}

/**
 * Test Supabase connectivity and schema existence
 */
export async function testSupabaseConnection(override?: SupabaseConfigOverride): Promise<{
  connected: boolean;
  tableExists: boolean;
  creatorCount: number;
  message: string;
}> {
  const supabase = resolveSupabaseClient(override);
  if (!supabase) {
    return {
      connected: false,
      tableExists: false,
      creatorCount: 0,
      message: "Supabase URL and Anon/Service-Role Key are not configured in environment or settings.",
    };
  }

  try {
    const { count, error } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205" || error.message?.includes("schema cache")) {
        return {
          connected: true,
          tableExists: false,
          creatorCount: 0,
          message: "Supabase connected successfully! However, the 'creators' table has not been created yet. Run the SQL schema in Supabase SQL Editor to create tables.",
        };
      }
      return {
        connected: false,
        tableExists: false,
        creatorCount: 0,
        message: `Supabase error: ${error.message}`,
      };
    }

    return {
      connected: true,
      tableExists: true,
      creatorCount: count || 0,
      message: `Supabase is connected and operational with ${count || 0} creators stored.`,
    };
  } catch (err) {
    return {
      connected: false,
      tableExists: false,
      creatorCount: 0,
      message: err instanceof Error ? err.message : "Connection failed.",
    };
  }
}
