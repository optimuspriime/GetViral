export type SubscriptionPlanId = "free" | "basic" | "premium" | "unlimited";

export const GUEST_PREVIEW_QUOTA = 5;

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
    name: "Free Account",
    priceMonthly: 0,
    priceAnnual: 0,
    currency: "$",
    searchQuota: 50,
    description: "Create a free account to unlock 50 monthly creator searches and private shortlists.",
    features: [
      "50 live creator searches per account / month",
      "Real-time search across active platforms",
      "Private saved creators & shortlist folders",
      "Multi-platform analytics profiles",
      "CSV export & campaign notes CRM",
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
      "150 live creator searches / month",
      "Public business contact emails (when available)",
      "Unlimited shortlist folders & tagging",
      "CSV export & campaign notes CRM",
      "On-demand creator metric refreshes",
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
      "300 live creator searches / month",
      "Public contact emails with outreach tools",
      "Concurrent live viewer & video analytics",
      "Live metric refresh across saved creators",
      "Comparison charts & historical snapshots",
      "Priority email support",
    ],
  },
  {
    id: "unlimited",
    name: "Enterprise (Unlimited)",
    badge: "Enterprise",
    priceMonthly: 99,
    priceAnnual: 990,
    currency: "$",
    searchQuota: -1, // Unlimited
    description: "Full unconstrained intelligence with unlimited searches for agencies.",
    features: [
      "Unlimited searches & handle lookups (∞)",
      "Support for all connected platform tiers",
      "Team workspace collaboration",
      "Full historical snapshot exports",
      "Dedicated account manager",
    ],
  },
];

export interface UserSubscriptionState {
  planId: SubscriptionPlanId;
  searchesRemaining: number;
  totalQuota: number; // -1 for unlimited
  isGuestPreview?: boolean;
  updatedAt: string;
}

export type UserRole = "viewer" | "creator";

const SUBSCRIPTION_STORAGE_PREFIX = "gv_subscription_v4";
const ROLE_STORAGE_PREFIX = "gv_user_role_v2";

export function getDefaultSubscription(
  planId: SubscriptionPlanId = "free",
  isGuest = false,
): UserSubscriptionState {
  if (isGuest) {
    return {
      planId: "free",
      searchesRemaining: GUEST_PREVIEW_QUOTA,
      totalQuota: GUEST_PREVIEW_QUOTA,
      isGuestPreview: true,
      updatedAt: new Date().toISOString(),
    };
  }
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planId) ?? SUBSCRIPTION_TIERS[0];
  return {
    planId: tier.id,
    searchesRemaining: tier.searchQuota === -1 ? 999999 : tier.searchQuota,
    totalQuota: tier.searchQuota,
    isGuestPreview: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserSubscription(
  ownerId?: string | null,
  isGuest = false,
): UserSubscriptionState {
  if (typeof window === "undefined") return getDefaultSubscription("free", isGuest);
  const scopedKey = `${SUBSCRIPTION_STORAGE_PREFIX}:${ownerId || "guest"}`;
  try {
    const raw = window.localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw) as UserSubscriptionState;
      if (parsed && typeof parsed.searchesRemaining === "number") {
        if (isGuest) {
          return {
            ...parsed,
            totalQuota: GUEST_PREVIEW_QUOTA,
            searchesRemaining: Math.min(GUEST_PREVIEW_QUOTA, Math.max(0, parsed.searchesRemaining)),
            isGuestPreview: true,
          };
        }
        return parsed;
      }
    }
  } catch {}
  return getDefaultSubscription("free", isGuest);
}

export function saveUserSubscription(subscription: UserSubscriptionState, ownerId?: string | null): void {
  if (typeof window === "undefined") return;
  const scopedKey = `${SUBSCRIPTION_STORAGE_PREFIX}:${ownerId || "guest"}`;
  try {
    window.localStorage.setItem(scopedKey, JSON.stringify(subscription));
  } catch {}
}

export function loadUserRole(ownerId?: string | null): UserRole {
  if (typeof window === "undefined") return "viewer";
  const key = `${ROLE_STORAGE_PREFIX}:${ownerId ?? "guest"}`;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === "creator" || saved === "viewer") return saved;
  } catch {}
  return "viewer";
}

export function saveUserRole(role: UserRole, ownerId?: string | null): void {
  if (typeof window === "undefined") return;
  const key = `${ROLE_STORAGE_PREFIX}:${ownerId ?? "guest"}`;
  try {
    window.localStorage.setItem(key, role);
  } catch {}
}
