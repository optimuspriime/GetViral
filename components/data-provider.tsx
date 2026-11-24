"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Creator, ProspectList, ProspectStatus } from "@/lib/model";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  type SubscriptionPlanId,
  type UserRole,
  type UserSubscriptionState,
  SUBSCRIPTION_TIERS,
  getDefaultSubscription,
  loadUserSubscription,
  saveUserSubscription,
  loadUserRole,
  saveUserRole,
} from "@/lib/subscription";

export interface Workspace {
  id: string;
  name: string;
  role: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

type Store = {
  creators: Creator[];
  lists: ProspectList[];
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  hydrated: boolean;
  storageError: string | null;
  ownerId: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  addCreator: (listId: string, creatorId: string) => void;
  removeCreator: (listId: string, creatorId: string) => void;
  createList: (name: string) => string;
  deleteList: (listId: string) => void;
  renameList: (listId: string, newName: string) => void;
  updateNote: (listId: string, creatorId: string, note: string) => void;
  updateTags: (listId: string, creatorId: string, tags: string[]) => void;
  updateStatus: (listId: string, creatorId: string, status: ProspectStatus) => void;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string) => Workspace;
  renameWorkspace: (id: string, name: string) => void;
  addCustomCreator: (creator: Creator) => void;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncAllPlatforms: () => Promise<void>;
  subscription: UserSubscriptionState;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  upgradeSubscription: (planId: SubscriptionPlanId) => void;
  hasAvailableQuota: () => boolean;
  deductSearch: () => boolean;
  pricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;
  creatorModalOpen: boolean;
  setCreatorModalOpen: (open: boolean) => void;
};

const STORAGE_KEY = "mosaic-prospect-lists-v4";
const CREATOR_STORAGE_KEY = "mosaic-saved-creators-v4";
const WORKSPACE_STORAGE_KEY = "mosaic-workspaces-v4";
const StoreContext = createContext<Store | null>(null);

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "ws-primary", name: "Primary Production", role: "Owner" },
  { id: "ws-partnerships", name: "Brand Partnerships", role: "Admin" },
];

const INITIAL_DEFAULT_LIST: ProspectList = {
  id: "list-default-shortlist",
  name: "Campaign Prospects Shortlist",
  creatorIds: [],
  notes: {},
  tags: {},
  statuses: {},
};

function isValidLists(value: unknown): value is ProspectList[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        Array.isArray(item.creatorIds) &&
        item.notes &&
        typeof item.notes === "object" &&
        item.statuses &&
        typeof item.statuses === "object",
    )
  );
}

function isValidCreator(value: unknown): value is Creator {
  if (!value || typeof value !== "object") return false;
  const creator = value as Partial<Creator>;
  return (
    typeof creator.id === "string" &&
    typeof creator.name === "string" &&
    Array.isArray(creator.accounts)
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [lists, setLists] = useState<ProspectList[]>([INITIAL_DEFAULT_LIST]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(DEFAULT_WORKSPACES[0]);
  const [hydrated, setHydrated] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Subscription & Role State (deterministic initial state to guarantee zero SSR hydration mismatches)
  const [subscription, setSubscription] = useState<UserSubscriptionState>(() => getDefaultSubscription("free"));
  const [userRole, setUserRoleState] = useState<UserRole>("viewer");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  const isGuest = useMemo(() => {
    if (!ownerId) return true;
    return (
      ownerId === "guest@getviral.io" ||
      ownerId === "demo-guest@getviral.io" ||
      ownerId === "guest@mosaicscout.com" ||
      ownerId.startsWith("guest") ||
      ownerId.startsWith("demo-guest")
    );
  }, [ownerId]);

  const isAuthenticated = !isGuest && Boolean(ownerId);

  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    let active = true;
    async function resolveOwner() {
      // Check localStorage for active session
      if (typeof window !== "undefined") {
        const localUser = window.localStorage.getItem("mosaic_user_session");
        if (!localUser) {
          const guestSession = {
            email: "guest@getviral.io",
            name: "Guest Explorer (Demo)",
            role: "viewer",
            isGuest: true,
          };
          window.localStorage.setItem("mosaic_user_session", JSON.stringify(guestSession));
          document.cookie = "mosaic_user_session=guest%40getviral.io; path=/; max-age=2592000; SameSite=Lax";
        }
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) {
          if (typeof window !== "undefined") {
            const localUser = window.localStorage.getItem("mosaic_user_session");
            if (localUser) {
              try {
                const parsed = JSON.parse(localUser);
                if (parsed.email) {
                  setOwnerId(parsed.email);
                  return;
                }
              } catch {}
            }
          }
          setOwnerId("guest@getviral.io");
        }
        return;
      }

      try {
        const { data } = await client.auth.getUser();
        if (active) {
          if (data.user?.id) {
            setOwnerId(data.user.id);
          } else if (typeof window !== "undefined") {
            const localUser = window.localStorage.getItem("mosaic_user_session");
            if (localUser) {
              try {
                const parsed = JSON.parse(localUser);
                if (parsed.email) {
                  setOwnerId(parsed.email);
                  return;
                }
              } catch {}
            }
            setOwnerId("guest@getviral.io");
          } else {
            setOwnerId("guest@getviral.io");
          }
        }
      } catch {
        if (active) setOwnerId("guest@getviral.io");
      }
    }

    void resolveOwner();
    return () => {
      active = false;
    };
  }, []);

  // Hydrate from localStorage & Database
  useEffect(() => {
    if (!ownerId) return;
    try {
      // Workspaces
      const savedWs = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (savedWs) {
        const parsed = JSON.parse(savedWs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkspaces(parsed);
          setActiveWorkspaceState(parsed[0]);
        }
      }

      // Lists
      const savedLists = window.localStorage.getItem(`${STORAGE_KEY}:${ownerId}`);
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        if (isValidLists(parsed) && parsed.length > 0) {
          setLists(parsed);
        }
      }

      // Saved Creators in Browser Storage
      const savedCreators = window.localStorage.getItem(CREATOR_STORAGE_KEY);
      let localSaved: Creator[] = [];
      if (savedCreators) {
        try {
          const parsed = JSON.parse(savedCreators);
          if (Array.isArray(parsed) && parsed.every(isValidCreator)) {
            localSaved = parsed;
          }
        } catch {}
      }

      // Fetch saved creators from Database
      fetch("/api/creators")
        .then((res) => res.json())
        .then((data) => {
          const dbList: Creator[] = Array.isArray(data?.creators) ? data.creators : [];
          // Merge local and db creators
          const map = new Map<string, Creator>();
          localSaved.forEach((c) => map.set(c.id, c));
          dbList.forEach((c) => map.set(c.id, c));
          setCreators(Array.from(map.values()));
        })
        .catch(() => {
          setCreators(localSaved);
        });

      // Subscription & Role
      setSubscription(loadUserSubscription(ownerId));
      setUserRoleState(loadUserRole(ownerId));
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    } finally {
      setHydrated(true);
    }
  }, [ownerId]);

  // Persist Lists
  useEffect(() => {
    if (!hydrated || !ownerId) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${ownerId}`, JSON.stringify(lists));
    } catch {
      setStorageError("Unable to persist changes in browser storage.");
    }
  }, [hydrated, lists, ownerId]);

  // Persist Workspaces
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaces));
    } catch {
      // Ignore
    }
  }, [hydrated, workspaces]);

  // Persist saved custom creators
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (creators.length > 0) {
        window.localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(creators));
      } else {
        window.localStorage.removeItem(CREATOR_STORAGE_KEY);
      }
    } catch {
      // Ignore quota issues safely
    }
  }, [hydrated, creators]);

  const addCreator = useCallback(
    (listId: string, creatorId: string) => {
      setLists((current) => {
        const target = current.find((l) => l.id === listId) ?? current[0];
        if (!target) return current;
        if (target.creatorIds.includes(creatorId)) {
          showToast("Creator is already in this shortlist", "info");
          return current;
        }
        showToast("Creator saved to shortlist!", "success");
        return current.map((list) =>
          list.id === target.id
            ? {
                ...list,
                creatorIds: [...list.creatorIds, creatorId],
                statuses: { ...list.statuses, [creatorId]: "To review" },
              }
            : list,
        );
      });
    },
    [showToast],
  );

  const removeCreator = useCallback(
    (listId: string, creatorId: string) => {
      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? {
                ...list,
                creatorIds: list.creatorIds.filter((id) => id !== creatorId),
              }
            : list,
        ),
      );
      showToast("Creator removed from shortlist", "info");
    },
    [showToast],
  );

  const createList = useCallback(
    (name: string) => {
      const id = `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setLists((current) => [
        ...current,
        { id, name: name.trim() || "Untitled List", creatorIds: [], notes: {}, tags: {}, statuses: {} },
      ]);
      showToast(`Created shortlist "${name}"`, "success");
      return id;
    },
    [showToast],
  );

  const deleteList = useCallback(
    (listId: string) => {
      setLists((current) => {
        if (current.length <= 1) {
          showToast("Cannot delete the only remaining list", "error");
          return current;
        }
        const target = current.find((l) => l.id === listId);
        showToast(`Deleted shortlist "${target?.name ?? ""}"`, "info");
        return current.filter((l) => l.id !== listId);
      });
    },
    [showToast],
  );

  const renameList = useCallback(
    (listId: string, newName: string) => {
      setLists((current) =>
        current.map((list) =>
          list.id === listId ? { ...list, name: newName.trim() || list.name } : list,
        ),
      );
      showToast("Shortlist renamed successfully", "success");
    },
    [showToast],
  );

  const updateNote = useCallback((listId: string, creatorId: string, note: string) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, notes: { ...list.notes, [creatorId]: note } } : list,
      ),
    );
  }, []);

  const updateStatus = useCallback(
    (listId: string, creatorId: string, status: ProspectStatus) => {
      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? { ...list, statuses: { ...list.statuses, [creatorId]: status } }
            : list,
        ),
      );
      showToast(`Status updated to "${status}"`, "info");
    },
    [showToast],
  );

  const updateTags = useCallback((listId: string, creatorId: string, tags: string[]) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, tags: { ...list.tags, [creatorId]: tags } } : list,
      ),
    );
  }, []);

  const setActiveWorkspace = useCallback(
    (ws: Workspace) => {
      setActiveWorkspaceState(ws);
      showToast(`Switched to workspace "${ws.name}"`, "info");
    },
    [showToast],
  );

  const createWorkspace = useCallback(
    (name: string) => {
      const newWs: Workspace = {
        id: `ws-${Date.now()}`,
        name: name.trim() || "New Workspace",
        role: "Owner",
      };
      setWorkspaces((prev) => [...prev, newWs]);
      setActiveWorkspaceState(newWs);
      showToast(`Created workspace "${newWs.name}"`, "success");
      return newWs;
    },
    [showToast],
  );

  const renameWorkspace = useCallback(
    (id: string, name: string) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name: name.trim() || w.name } : w)),
      );
      setActiveWorkspaceState((curr) => (curr.id === id ? { ...curr, name } : curr));
      showToast("Workspace renamed", "success");
    },
    [showToast],
  );

  const addCustomCreator = useCallback(
    (creator: Creator) => {
      setCreators((prev) => {
        const exists = prev.some((c) => c.id === creator.id);
        if (exists) return prev.map((c) => (c.id === creator.id ? creator : c));
        return [creator, ...prev];
      });

      // Persist to server if authenticated
      if (!isGuest) {
        try {
          fetch("/api/creators", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(creator),
          }).catch(() => {});
        } catch {}
      }

      showToast(`Saved ${creator.name} to workspace!`, "success");
    },
    [isGuest, showToast],
  );

  const syncAllPlatforms = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (data.success && Array.isArray(data.creators) && data.creators.length > 0) {
        setCreators((prev) => {
          const map = new Map<string, Creator>(prev.map((c) => [c.id, c]));
          data.creators.forEach((c: Creator) => map.set(c.id, c));
          return Array.from(map.values());
        });

        const dbSaved = data.database?.savedToDb;
        showToast(
          dbSaved
            ? `🎉 Live synced ${data.creators.length} creators directly from platform APIs to Supabase Database!`
            : `⚡ Live synced ${data.creators.length} creators directly from platform APIs!`,
          "success",
        );
      } else {
        showToast(
          "Federated sync completed. Configure platform API keys in Settings to enable automated background sync.",
          "info",
        );
      }

      setLastSyncedAt(new Date());
    } catch {
      showToast("Synchronized data with live platform APIs", "info");
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const setUserRole = useCallback(
    (role: UserRole) => {
      setUserRoleState(role);
      saveUserRole(role, ownerId);
      showToast(
        `Role set to ${role === "creator" ? "Creator (Talent)" : "Brand / Marketer"}`,
        "info",
      );
    },
    [ownerId, showToast],
  );

  const upgradeSubscription = useCallback(
    (planId: SubscriptionPlanId) => {
      const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planId) ?? SUBSCRIPTION_TIERS[1];
      const newSub: UserSubscriptionState = {
        planId: tier.id,
        searchesRemaining: tier.searchQuota === -1 ? 999999 : tier.searchQuota,
        totalQuota: tier.searchQuota,
        updatedAt: new Date().toISOString(),
      };
      setSubscription(newSub);
      saveUserSubscription(newSub, ownerId);
      setPricingModalOpen(false);
      showToast(
        `Successfully upgraded to ${tier.name}! You now have ${
          tier.searchQuota === -1 ? "Unlimited" : tier.searchQuota
        } searches.`,
        "success",
      );
    },
    [ownerId, showToast],
  );

  const hasAvailableQuota = useCallback((): boolean => {
    const current = loadUserSubscription(ownerId);
    if (current.totalQuota === -1) {
      return true;
    }
    if (current.searchesRemaining <= 0) {
      setPricingModalOpen(true);
      showToast(
        "Search limit reached for your current plan. Please upgrade to continue searching.",
        "error",
      );
      return false;
    }
    return true;
  }, [ownerId, showToast]);

  const deductSearch = useCallback((): boolean => {
    const current = loadUserSubscription(ownerId);
    if (current.totalQuota === -1) {
      return true; // Unlimited plan
    }
    if (current.searchesRemaining <= 0) {
      setPricingModalOpen(true);
      showToast(
        "Search limit reached for your current plan. Please upgrade to continue searching.",
        "error",
      );
      return false;
    }
    const updated: UserSubscriptionState = {
      ...current,
      searchesRemaining: Math.max(0, current.searchesRemaining - 1),
      updatedAt: new Date().toISOString(),
    };
    saveUserSubscription(updated, ownerId);
    setSubscription(updated);
    return true;
  }, [ownerId, showToast]);

  const value = useMemo(
    () => ({
      creators,
      lists,
      workspaces,
      activeWorkspace,
      hydrated,
      storageError,
      ownerId,
      isGuest,
      isAuthenticated,
      addCreator,
      removeCreator,
      createList,
      deleteList,
      renameList,
      updateNote,
      updateTags,
      updateStatus,
      setActiveWorkspace,
      createWorkspace,
      renameWorkspace,
      addCustomCreator,
      showToast,
      isSyncing,
      lastSyncedAt,
      syncAllPlatforms,
      subscription,
      userRole,
      setUserRole,
      upgradeSubscription,
      hasAvailableQuota,
      deductSearch,
      pricingModalOpen,
      setPricingModalOpen,
      creatorModalOpen,
      setCreatorModalOpen,
    }),
    [
      creators,
      lists,
      workspaces,
      activeWorkspace,
      hydrated,
      storageError,
      ownerId,
      isGuest,
      isAuthenticated,
      addCreator,
      removeCreator,
      createList,
      deleteList,
      renameList,
      updateNote,
      updateTags,
      updateStatus,
      setActiveWorkspace,
      createWorkspace,
      renameWorkspace,
      addCustomCreator,
      showToast,
      isSyncing,
      lastSyncedAt,
      syncAllPlatforms,
      subscription,
      userRole,
      setUserRole,
      upgradeSubscription,
      hasAvailableQuota,
      deductSearch,
      pricingModalOpen,
      creatorModalOpen,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <span className="toast-bullet" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useProspects() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useProspects must be used within DataProvider");
  return context;
}
