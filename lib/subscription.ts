export type SubscriptionPlanId = "free" | "basic" | "premium" | "unlimited";

export interface SubscriptionTier {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  searchQuota: number; // -1 represents unlimited
  description: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free Trial",
    priceMonthly: 0,
    priceAnnual: 0,
    currency: "$",
    searchQuota: 50,
    description: "Start exploring verified creators with 50 complimentary searches.",
    features: [
      "50 verified creator searches per account",
      "Full access to 1,035+ creator directory",
      "Multi-platform reach metrics (YouTube, Twitch, Kick)",
      "Standard creator profile viewing",
      "1 Campaign Shortlist (up to 10 creators)",
    ],
  },
  {
    id: "basic",
    name: "Basic Plan",
    priceMonthly: 19,
    priceAnnual: 190,
    currency: "$",
    searchQuota: 150,
    description: "Ideal for growing marketing teams and scout agencies.",
    features: [
      "150 verified creator searches / month",
      "Direct verified business contact emails",
      "Unlimited campaign shortlists & tagging",
      "CSV export & campaign notes CRM",
      "Weekly platform data refreshes",
    ],
  },
  {
    id: "premium",
    name: "Premium Plan",
    badge: "Most Popular",
    priceMonthly: 49,
    priceAnnual: 490,
    currency: "$",
    searchQuota: 300,
    popular: true,
    description: "For active talent managers & high-volume brand campaigns.",
    features: [
      "300 verified creator searches / month",
      "Direct business emails with copy & outreach tools",
      "Average live viewer concurrency & engagement analytics",
      "On-demand platform sync button (Live APIs)",
      "Multi-platform comparison charts & audience geography",
      "Priority customer & outreach support",
    ],
  },
  {
    id: "unlimited",
    name: "Most Premium (Unlimited)",
    badge: "Enterprise",
    priceMonthly: 99,
    priceAnnual: 990,
    currency: "$",
    searchQuota: -1, // Unlimited
    description: "Full unconstrained intelligence with infinite searches for enterprise agencies.",
    features: [
      "Unlimited searches & query lookups (∞)",
      "Unrestricted access to all 5 platforms",
      "Custom creator onboarding & profile verification",
      "Team workspace sharing & multi-seat collaboration",
      "Full API access & historical snapshot exports",
      "Dedicated account manager",
    ],
  },
];

export interface UserSubscriptionState {
  planId: SubscriptionPlanId;
  searchesRemaining: number;
  totalQuota: number; // -1 for unlimited
  updatedAt: string;
}

export type UserRole = "viewer" | "creator";

const GLOBAL_SUBSCRIPTION_KEY = "mosaic_active_subscription_v2";
const SUBSCRIPTION_STORAGE_PREFIX = "mosaic_subscription_v2";
const ROLE_STORAGE_PREFIX = "mosaic_user_role_v1";

export function getDefaultSubscription(planId: SubscriptionPlanId = "free"): UserSubscriptionState {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planId) ?? SUBSCRIPTION_TIERS[0];
  return {
    planId: tier.id,
    searchesRemaining: tier.searchQuota === -1 ? 999999 : tier.searchQuota,
    totalQuota: tier.searchQuota,
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserSubscription(userEmail?: string | null): UserSubscriptionState {
  if (typeof window === "undefined") return getDefaultSubscription("free");
  try {
    const isSpecial = !userEmail || userEmail === "guest" || userEmail === "primary" || userEmail.includes("guest@");
    
    // 1. Check user-specific key if provided and not a generic guest
    if (!isSpecial && userEmail) {
      const userRaw = window.localStorage.getItem(`${SUBSCRIPTION_STORAGE_PREFIX}:${userEmail}`);
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (parsed && typeof parsed.searchesRemaining === "number") {
          return parsed;
        }
      }
    }

    // 2. Check global active key
    const globalRaw = window.localStorage.getItem(GLOBAL_SUBSCRIPTION_KEY);
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (parsed && typeof parsed.searchesRemaining === "number") {
        return parsed;
      }
    }
  } catch {}

  const initial = getDefaultSubscription("free");
  try {
    window.localStorage.setItem(GLOBAL_SUBSCRIPTION_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function saveUserSubscription(subscription: UserSubscriptionState, userEmail?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    // Always persist globally
    window.localStorage.setItem(GLOBAL_SUBSCRIPTION_KEY, JSON.stringify(subscription));

    // Also persist for specific user if logged in
    if (userEmail && userEmail !== "guest" && userEmail !== "primary") {
      window.localStorage.setItem(`${SUBSCRIPTION_STORAGE_PREFIX}:${userEmail}`, JSON.stringify(subscription));
    }
  } catch {}
}

export function loadUserRole(userEmail?: string | null): UserRole {
  if (typeof window === "undefined") return "viewer";
  const key = `${ROLE_STORAGE_PREFIX}:${userEmail ?? "guest"}`;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === "creator" || saved === "viewer") return saved;
  } catch {}
  return "viewer";
}

export function saveUserRole(role: UserRole, userEmail?: string | null): void {
  if (typeof window === "undefined") return;
  const key = `${ROLE_STORAGE_PREFIX}:${userEmail ?? "guest"}`;
  try {
    window.localStorage.setItem(key, role);
  } catch {}
}
