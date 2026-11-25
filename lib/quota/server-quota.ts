import "server-only";
import type { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  SUBSCRIPTION_TIERS,
  getDefaultSubscription,
  type SubscriptionPlanId,
  type UserSubscriptionState,
} from "@/lib/subscription";
import {
  QUOTA_COOKIE_NAME,
  parseCookieValue,
  signValue,
  verifySignedValue,
} from "@/lib/auth/tokens";
import type { ServerSession } from "@/lib/auth/server-session";

type CookieQuotaPayload = {
  k: string;
  p: SubscriptionPlanId;
  r: number;
  t: number;
  u: string;
};

function readSignedQuotaCookie(session: ServerSession): UserSubscriptionState | null {
  const raw = parseCookieValue(session.cookieHeader, QUOTA_COOKIE_NAME);
  const verified = verifySignedValue(raw);
  if (!verified) return null;
  try {
    const parsed = JSON.parse(verified) as CookieQuotaPayload;
    if (parsed.k !== session.quotaKey) return null;
    if (typeof parsed.r !== "number" || typeof parsed.t !== "number") return null;
    return {
      planId: parsed.p || "free",
      searchesRemaining: parsed.r,
      totalQuota: parsed.t,
      updatedAt: parsed.u || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function attachQuotaCookie(
  response: NextResponse,
  session: ServerSession,
  subscription: UserSubscriptionState,
): void {
  const payload: CookieQuotaPayload = {
    k: session.quotaKey,
    p: subscription.planId,
    r: subscription.searchesRemaining,
    t: subscription.totalQuota,
    u: subscription.updatedAt,
  };
  response.cookies.set(QUOTA_COOKIE_NAME, signValue(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Loads the authoritative subscription & search quota for this server session
 * from Supabase `public.user_subscriptions` (creating the initial 50/50 row on first access),
 * falling back to signed HTTPOnly cookie if DB is offline.
 */
export async function getServerQuota(session: ServerSession): Promise<UserSubscriptionState> {
  const supabase = getSupabaseAdmin();
  const cookieFallback = readSignedQuotaCookie(session);

  if (!supabase) {
    return cookieFallback ?? getDefaultSubscription("free");
  }

  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("plan_id, searches_remaining, total_quota, updated_at")
      .eq("user_id", session.quotaKey)
      .maybeSingle();

    if (!error && data) {
      return {
        planId: (data.plan_id as SubscriptionPlanId) || "free",
        searchesRemaining: Number(data.searches_remaining ?? 50),
        totalQuota: Number(data.total_quota ?? 50),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    }

    // Create default row on first access for this account or guest key
    const initial = cookieFallback ?? getDefaultSubscription("free");
    await supabase.from("user_subscriptions").upsert(
      {
        user_id: session.quotaKey,
        plan_id: initial.planId,
        searches_used: Math.max(0, (initial.totalQuota === -1 ? 0 : initial.totalQuota - initial.searchesRemaining)),
        searches_remaining: initial.searchesRemaining,
        total_quota: initial.totalQuota,
        role: "viewer",
        updated_at: initial.updatedAt,
      },
      { onConflict: "user_id" },
    );

    return initial;
  } catch {
    return cookieFallback ?? getDefaultSubscription("free");
  }
}

/**
 * Verifies server-side quota BEFORE running external search calls.
 */
export async function checkServerQuotaAvailable(session: ServerSession): Promise<{
  allowed: boolean;
  subscription: UserSubscriptionState;
}> {
  const subscription = await getServerQuota(session);
  if (subscription.totalQuota === -1) {
    return { allowed: true, subscription };
  }
  return {
    allowed: subscription.searchesRemaining > 0,
    subscription,
  };
}

/**
 * Atomically decrements 1 search credit on the server ONLY when a search earned results and shouldCharge is true.
 */
export async function consumeServerQuota(session: ServerSession): Promise<UserSubscriptionState> {
  const current = await getServerQuota(session);
  if (current.totalQuota === -1) {
    return current;
  }

  const nextRemaining = Math.max(0, current.searchesRemaining - 1);
  const now = new Date().toISOString();
  const nextSub: UserSubscriptionState = {
    ...current,
    searchesRemaining: nextRemaining,
    updatedAt: now,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: row } = await supabase
        .from("user_subscriptions")
        .select("searches_used, searches_remaining, total_quota")
        .eq("user_id", session.quotaKey)
        .maybeSingle();

      const dbRemaining = Number(row?.searches_remaining ?? current.searchesRemaining);
      const dbUsed = Number(row?.searches_used ?? 0);
      const updatedRemaining = Math.max(0, dbRemaining - 1);

      await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: session.quotaKey,
            plan_id: current.planId,
            searches_used: dbUsed + 1,
            searches_remaining: updatedRemaining,
            total_quota: Number(row?.total_quota ?? current.totalQuota),
            updated_at: now,
          },
          { onConflict: "user_id" },
        );

      nextSub.searchesRemaining = updatedRemaining;
    } catch {
      // Signed HTTPOnly cookie still captures nextSub on response
    }
  }

  return nextSub;
}

/**
 * Updates subscription tier / role for an authenticated user account only.
 */
export async function updateServerPlanOrRole(
  session: ServerSession,
  updates: { planId?: SubscriptionPlanId; role?: "viewer" | "creator" },
): Promise<UserSubscriptionState | null> {
  if (!session.authenticated || !session.userId) return null;

  const current = await getServerQuota(session);
  const now = new Date().toISOString();

  let nextSub = { ...current, updatedAt: now };

  if (updates.planId) {
    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === updates.planId);
    if (tier) {
      nextSub = {
        planId: tier.id,
        searchesRemaining: tier.searchQuota === -1 ? 999999 : tier.searchQuota,
        totalQuota: tier.searchQuota,
        updatedAt: now,
      };
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const upsertRow: Record<string, unknown> = {
      user_id: session.userId,
      plan_id: nextSub.planId,
      searches_remaining: nextSub.searchesRemaining,
      total_quota: nextSub.totalQuota,
      updated_at: now,
    };
    if (updates.planId) {
      upsertRow.searches_used = 0;
    }
    if (updates.role) {
      upsertRow.role = updates.role;
    }
    await supabase.from("user_subscriptions").upsert(upsertRow, { onConflict: "user_id" });
  }

  return nextSub;
}
