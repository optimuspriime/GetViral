import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import type { Creator, PlatformAccount, MetricSnapshot, AudienceInsight } from "@/lib/model";

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
 * Save an array of creators and their platform accounts to Supabase
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
      // 1. Upsert Creator
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

      // 2. Upsert Platform Accounts & Snapshots
      for (const account of creator.accounts) {
        const { error: accErr } = await supabase.from("creator_platform_accounts").upsert(
          {
            id: account.id,
            creator_id: creator.id,
            platform: account.platform,
            handle: account.handle,
            profile_url: account.profileUrl,
            activity: account.activity,
          },
          { onConflict: "platform,handle" },
        );

        if (accErr) {
          console.error("Supabase account upsert error:", accErr);
          continue;
        }

        // 3. Upsert Snapshots (limit to recent 15 per account)
        const recentSnapshots = account.snapshots.slice(0, 15).map((s) => ({
          id: s.id,
          account_id: account.id,
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

      // 4. Upsert Audience Insights
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
 * Load all creators with their platform accounts and snapshots from Supabase
 */
export async function loadCreatorsFromSupabase(override?: SupabaseConfigOverride): Promise<Creator[]> {
  const supabase = resolveSupabaseClient(override);
  if (!supabase) return [];

  try {
    const { data: creatorRows, error: cErr } = await supabase
      .from("creators")
      .select("*")
      .order("name", { ascending: true });

    if (cErr || !creatorRows || creatorRows.length === 0) return [];

    const { data: accountRows } = await supabase
      .from("creator_platform_accounts")
      .select("*");

    const { data: snapshotRows } = await supabase
      .from("metric_snapshots")
      .select("*")
      .order("collected_at", { ascending: false });

    const { data: insightRows } = await supabase
      .from("audience_insights")
      .select("*");

    // Map snapshots by account_id
    const snapshotsByAccount = new Map<string, MetricSnapshot[]>();
    (snapshotRows || []).forEach((row) => {
      const list = snapshotsByAccount.get(row.account_id) || [];
      list.push({
        id: row.id,
        metricName: row.metric_name,
        value: row.value !== null ? Number(row.value) : null,
        unit: row.unit,
        collectedAt: row.collected_at,
        windowStart: row.window_start,
        windowEnd: row.window_end,
        periodLabel: row.period_label,
        sampleSize: row.sample_size,
        source: row.source,
        status: row.status,
      });
      snapshotsByAccount.set(row.account_id, list);
    });

    // Map accounts by creator_id
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

    // Map insights by creator_id
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

    // Assemble full Creator objects
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
        // Table does not exist
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
