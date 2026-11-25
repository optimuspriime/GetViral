"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Creator, ProspectList, ProspectStatus } from "@/lib/model";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  type SubscriptionPlanId,
  type UserRole,
  type UserSubscriptionState,
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
  userEmail: string | null;
  isGuest: boolean;
  isAdmin: boolean;
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
  createWorkspace: (name: string) => Workspace | null;
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
  syncServerQuota: (sub: UserSubscriptionState) => void;
  hasAvailableQuota: () => boolean;
  deductSearch: () => boolean;
  pricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;
  creatorModalOpen: boolean;
  setCreatorModalOpen: (open: boolean) => void;
};

const STORAGE_KEY = "gv-saved-lists-v6";
const CREATOR_STORAGE_KEY = "gv-saved-creators-v6";
const WORKSPACE_STORAGE_KEY = "gv-workspaces-v6";
const StoreContext = createContext<Store | null>(null);

const GUEST_WORKSPACE: Workspace = {
  id: "ws-guest",
  name: "Guest Sandbox",
  role: "Preview Mode",
};

function getInitialUserWorkspace(email?: string | null, admin = false): Workspace {
  const prefix = email ? email.split("@")[0] : "Personal";
  return {
    id: "ws-personal",
    name: `${prefix}'s Workspace`,
    role: admin ? "Admin" : "Member",
  };
}

const INITIAL_DEFAULT_LIST: ProspectList = {
  id: "list-default-shortlist",
  name: "Default Shortlist",
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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([GUEST_WORKSPACE]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(GUEST_WORKSPACE);
  const [hydrated, setHydrated] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Deterministic SSR default matching guest preview (5 searches) until auth/server quota syncs
  const [subscription, setSubscription] = useState<UserSubscriptionState>(() =>
    getDefaultSubscription("free", true),
  );
  const [userRole, setUserRoleState] = useState<UserRole>("viewer");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  const listSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatorsRef = useRef<Creator[]>([]);
  creatorsRef.current = creators;

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

  // Resolve verified identity from Supabase Auth
  useEffect(() => {
    let active = true;
    const client = getSupabaseBrowserClient();

    async function resolveIdentity() {
      if (!client) {
        if (active) {
          setOwnerId("guest@getviral.io");
          setUserEmail(null);
          setIsAdmin(false);
        }
        return;
      }

      try {
        const { data, error } = await client.auth.getUser();
        if (!active) return;
        if (!error && data?.user?.id) {
          setOwnerId(data.user.id);
          setUserEmail(data.user.email ?? null);
        } else {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("mosaic_user_session");
          }
          setOwnerId("guest@getviral.io");
          setUserEmail(null);
          setIsAdmin(false);
        }
      } catch {
        if (active) {
          setOwnerId("guest@getviral.io");
          setUserEmail(null);
          setIsAdmin(false);
        }
      }
    }

    void resolveIdentity();

    if (client) {
      const { data: authSub } = client.auth.onAuthStateChange(
        (_event: string, session: { user?: { id?: string; email?: string | null } } | null) => {
          if (!active) return;
          if (session?.user?.id) {
            setOwnerId(session.user.id);
            setUserEmail(session.user.email ?? null);
          } else {
            setOwnerId("guest@getviral.io");
            setUserEmail(null);
            setIsAdmin(false);
          }
        },
      );

      return () => {
        active = false;
        authSub?.subscription?.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, []);

  // Hydrate account-scoped state + authoritative server quota
  useEffect(() => {
    if (!ownerId) return;
    let active = true;

    async function hydrateAccount() {
      try {
        if (isGuest) {
          setWorkspaces([GUEST_WORKSPACE]);
          setActiveWorkspaceState(GUEST_WORKSPACE);
          setCreators([]);
          setLists([INITIAL_DEFAULT_LIST]);
          setIsAdmin(false);
        } else {
          const defaultWs = getInitialUserWorkspace(userEmail, false);
          const savedWs = window.localStorage.getItem(`${WORKSPACE_STORAGE_KEY}:${ownerId}`);
          if (savedWs) {
            try {
              const parsed = JSON.parse(savedWs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setWorkspaces(parsed);
                setActiveWorkspaceState(parsed[0]);
              } else {
                setWorkspaces([defaultWs]);
                setActiveWorkspaceState(defaultWs);
              }
            } catch {
              setWorkspaces([defaultWs]);
              setActiveWorkspaceState(defaultWs);
            }
          } else {
            setWorkspaces([defaultWs]);
            setActiveWorkspaceState(defaultWs);
          }

          const savedLists = window.localStorage.getItem(`${STORAGE_KEY}:${ownerId}`);
          if (savedLists) {
            try {
              const parsed = JSON.parse(savedLists);
              if (isValidLists(parsed) && parsed.length > 0) {
                setLists(parsed);
              } else {
                setLists([INITIAL_DEFAULT_LIST]);
              }
            } catch {
              setLists([INITIAL_DEFAULT_LIST]);
            }
          } else {
            setLists([INITIAL_DEFAULT_LIST]);
          }

          const savedCreators = window.localStorage.getItem(`${CREATOR_STORAGE_KEY}:${ownerId}`);
          let localSaved: Creator[] = [];
          if (savedCreators) {
            try {
              const parsed = JSON.parse(savedCreators);
              if (Array.isArray(parsed) && parsed.every(isValidCreator)) {
                localSaved = parsed;
              }
            } catch {}
          }
          setCreators(localSaved);

          fetch("/api/lists")
            .then((res) => res.json())
            .then((data) => {
              if (!active || data?.isGuest) return;
              if (Array.isArray(data?.lists) && data.lists.length > 0) {
                setLists(data.lists);
              }
              if (Array.isArray(data?.creators)) {
                const dbMap = new Map<string, Creator>();
                data.creators.forEach((c: Creator) => dbMap.set(c.id, c));
                const referencedIds = new Set<string>(
                  (data.lists || []).flatMap((l: ProspectList) => l.creatorIds),
                );
                localSaved.forEach((c) => {
                  if (referencedIds.has(c.id) && !dbMap.has(c.id)) {
                    dbMap.set(c.id, c);
                  }
                });
                setCreators(Array.from(dbMap.values()));
              }
            })
            .catch(() => {});
        }

        setUserRoleState(loadUserRole(ownerId));
        setSubscription(loadUserSubscription(ownerId, isGuest));

        fetch("/api/quota")
          .then((res) => res.json())
          .then((qData) => {
            if (!active) return;
            if (typeof qData?.isAdmin === "boolean") {
              setIsAdmin(qData.isAdmin);
              if (!isGuest && qData.isAdmin) {
                setActiveWorkspaceState((curr) => ({ ...curr, role: "Admin" }));
              }
            }
            if (qData?.subscription && typeof qData.subscription.searchesRemaining === "number") {
              setSubscription(qData.subscription);
              saveUserSubscription(qData.subscription, ownerId);
            }
          })
          .catch(() => {});
      } catch (e) {
        console.warn("Could not hydrate account state:", e);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void hydrateAccount();
    return () => {
      active = false;
    };
  }, [ownerId, isGuest, userEmail]);

  const scheduleServerListSync = useCallback(
    (nextLists: ProspectList[], extraCreators?: Creator[]) => {
      if (isGuest || !ownerId) return;
      if (listSyncTimeoutRef.current) clearTimeout(listSyncTimeoutRef.current);
      listSyncTimeoutRef.current = setTimeout(() => {
        const allAvailable = [...(extraCreators || []), ...creatorsRef.current];
        const neededIds = new Set(nextLists.flatMap((l) => l.creatorIds));
        const referencedCreators = Array.from(
          new Map(allAvailable.filter((c) => neededIds.has(c.id)).map((c) => [c.id, c])).values(),
        );
        fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lists: nextLists,
            creators: referencedCreators,
          }),
        }).catch(() => {});
      }, 300);
    },
    [isGuest, ownerId],
  );

  useEffect(() => {
    if (!hydrated || !ownerId || isGuest) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${ownerId}`, JSON.stringify(lists));
    } catch {
      setStorageError("Unable to persist changes in browser storage.");
    }
  }, [hydrated, lists, ownerId, isGuest]);

  useEffect(() => {
    if (!hydrated || !ownerId || isGuest) return;
    try {
      window.localStorage.setItem(`${WORKSPACE_STORAGE_KEY}:${ownerId}`, JSON.stringify(workspaces));
    } catch {}
  }, [hydrated, workspaces, ownerId, isGuest]);

  useEffect(() => {
    if (!hydrated || !ownerId || isGuest) return;
    try {
      const key = `${CREATOR_STORAGE_KEY}:${ownerId}`;
      if (creators.length > 0) {
        window.localStorage.setItem(key, JSON.stringify(creators));
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }, [hydrated, creators, ownerId, isGuest]);

  const addCreator = useCallback(
    (listId: string, creatorId: string, explicitCreator?: Creator) => {
      if (isGuest) {
        showToast("Sign in required to save creators to your workspace.", "error");
        return;
      }
      setLists((current) => {
        const target = current.find((l) => l.id === listId) ?? current[0];
        if (!target) return current;
        if (target.creatorIds.includes(creatorId)) {
          showToast("Creator is already in this shortlist", "info");
          return current;
        }
        const updated = current.map((list) =>
          list.id === target.id
            ? {
                ...list,
                creatorIds: [...list.creatorIds, creatorId],
                statuses: { ...list.statuses, [creatorId]: "To review" as ProspectStatus },
              }
            : list,
        );
        scheduleServerListSync(updated, explicitCreator ? [explicitCreator] : undefined);
        showToast("Creator saved!", "success");
        return updated;
      });
    },
    [isGuest, showToast, scheduleServerListSync],
  );

  const removeCreator = useCallback(
    (listId: string, creatorId: string) => {
      if (isGuest) {
        showToast("Sign in required to modify saved creators.", "error");
        return;
      }
      setLists((current) => {
        const updated = current.map((list) =>
          list.id === listId
            ? {
                ...list,
                creatorIds: list.creatorIds.filter((id) => id !== creatorId),
              }
            : list,
        );
        scheduleServerListSync(updated);
        return updated;
      });
      showToast("Creator removed from list", "info");
    },
    [isGuest, showToast, scheduleServerListSync],
  );

  const createList = useCallback(
    (name: string) => {
      if (isGuest) {
        showToast("Sign in required to create shortlist folders.", "error");
        return "";
      }
      const id = `list-${ownerId || "user"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setLists((current) => {
        const updated = [
          ...current,
          { id, name: name.trim() || "Untitled List", creatorIds: [], notes: {}, tags: {}, statuses: {} },
        ];
        scheduleServerListSync(updated);
        return updated;
      });
      showToast(`Created shortlist "${name}"`, "success");
      return id;
    },
    [isGuest, ownerId, showToast, scheduleServerListSync],
  );

  const deleteList = useCallback(
    (listId: string) => {
      if (isGuest) {
        showToast("Sign in required to delete shortlists.", "error");
        return;
      }
      setLists((current) => {
        if (current.length <= 1) {
          showToast("Cannot delete the only remaining list", "error");
          return current;
        }
        const target = current.find((l) => l.id === listId);
        const updated = current.filter((l) => l.id !== listId);
        scheduleServerListSync(updated);
        showToast(`Deleted shortlist "${target?.name ?? ""}"`, "info");
        return updated;
      });
    },
    [isGuest, showToast, scheduleServerListSync],
  );

  const renameList = useCallback(
    (listId: string, newName: string) => {
      if (isGuest) {
        showToast("Sign in required to rename shortlists.", "error");
        return;
      }
      setLists((current) => {
        const updated = current.map((list) =>
          list.id === listId ? { ...list, name: newName.trim() || list.name } : list,
        );
        scheduleServerListSync(updated);
        return updated;
      });
      showToast("Shortlist renamed successfully", "success");
    },
    [isGuest, showToast, scheduleServerListSync],
  );

  const updateNote = useCallback(
    (listId: string, creatorId: string, note: string) => {
      if (isGuest) return;
      setLists((current) => {
        const updated = current.map((list) =>
          list.id === listId ? { ...list, notes: { ...list.notes, [creatorId]: note } } : list,
        );
        scheduleServerListSync(updated);
        return updated;
      });
    },
    [isGuest, scheduleServerListSync],
  );

  const updateStatus = useCallback(
    (listId: string, creatorId: string, status: ProspectStatus) => {
      if (isGuest) return;
      setLists((current) => {
        const updated = current.map((list) =>
          list.id === listId
            ? { ...list, statuses: { ...list.statuses, [creatorId]: status } }
            : list,
        );
        scheduleServerListSync(updated);
        return updated;
      });
      showToast(`Status updated to "${status}"`, "info");
    },
    [isGuest, showToast, scheduleServerListSync],
  );

  const updateTags = useCallback(
    (listId: string, creatorId: string, tags: string[]) => {
      if (isGuest) return;
      setLists((current) => {
        const updated = current.map((list) =>
          list.id === listId ? { ...list, tags: { ...list.tags, [creatorId]: tags } } : list,
        );
        scheduleServerListSync(updated);
        return updated;
      });
    },
    [isGuest, scheduleServerListSync],
  );

  const setActiveWorkspace = useCallback(
    (ws: Workspace) => {
      if (isGuest) return;
      setActiveWorkspaceState(ws);
      showToast(`Switched to workspace "${ws.name}"`, "info");
    },
    [isGuest, showToast],
  );

  const createWorkspace = useCallback(
    (name: string) => {
      if (isGuest) {
        showToast("Sign in required to create custom workspaces.", "error");
        return null;
      }
      const newWs: Workspace = {
        id: `ws-${Date.now()}`,
        name: name.trim() || "New Workspace",
        role: isAdmin ? "Admin" : "Member",
      };
      setWorkspaces((prev) => [...prev, newWs]);
      setActiveWorkspaceState(newWs);
      showToast(`Created workspace "${newWs.name}"`, "success");
      return newWs;
    },
    [isGuest, isAdmin, showToast],
  );

  const renameWorkspace = useCallback(
    (id: string, name: string) => {
      if (isGuest) return;
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name: name.trim() || w.name } : w)),
      );
      setActiveWorkspaceState((curr) => (curr.id === id ? { ...curr, name } : curr));
      showToast("Workspace renamed", "success");
    },
    [isGuest, showToast],
  );

  const addCustomCreator = useCallback(
    (creator: Creator) => {
      if (isGuest) {
        showToast("Sign in required to save creators to workspace.", "error");
        return;
      }

      setCreators((prev) => {
        const exists = prev.some((c) => c.id === creator.id);
        if (exists) return prev.map((c) => (c.id === creator.id ? creator : c));
        return [creator, ...prev];
      });

      fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creator, listId: lists[0]?.id }),
      }).catch(() => {});

      showToast(`Saved ${creator.name} to Saved Creators!`, "success");
    },
    [isGuest, lists, showToast],
  );

  const syncAllPlatforms = useCallback(async () => {
    if (isGuest) {
      showToast("Sign in required to refresh saved creator metrics.", "error");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        showToast(data?.error || "Refresh requires valid authentication.", "error");
        return;
      }

      if (Array.isArray(data.creators) && data.creators.length > 0) {
        setCreators((prev) => {
          const map = new Map<string, Creator>(prev.map((c) => [c.id, c]));
          data.creators.forEach((c: Creator) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }

      showToast(data.message || "Refresh completed.", data.stats?.totalSynced > 0 ? "success" : "info");
      setLastSyncedAt(new Date());
    } catch {
      showToast("Refresh request failed.", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [isGuest, showToast]);

  const setUserRole = useCallback(
    (role: UserRole) => {
      setUserRoleState(role);
      saveUserRole(role, ownerId);
      if (isAuthenticated) {
        fetch("/api/quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }).catch(() => {});
      }
      showToast(
        `Role set to ${role === "creator" ? "Creator (Talent)" : "Brand / Marketer"}`,
        "info",
      );
    },
    [ownerId, isAuthenticated, showToast],
  );

  const syncServerQuota = useCallback(
    (sub: UserSubscriptionState) => {
      if (!sub || typeof sub.searchesRemaining !== "number") return;
      setSubscription(sub);
      saveUserSubscription(sub, ownerId);
    },
    [ownerId],
  );

  const upgradeSubscription = useCallback(
    async (planId: SubscriptionPlanId) => {
      if (isGuest) {
        showToast("Sign in required: Please create an account to change plans.", "error");
        return;
      }

      try {
        const res = await fetch("/api/quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(
            data?.error || "Billing provider required before upgrading above the 50-search quota.",
            "info",
          );
          return;
        }
        if (data?.subscription) {
          syncServerQuota(data.subscription);
          setPricingModalOpen(false);
          showToast("Workspace plan updated.", "success");
        }
      } catch {
        showToast("Unable to update plan right now.", "error");
      }
    },
    [isGuest, syncServerQuota, showToast],
  );

  const hasAvailableQuota = useCallback((): boolean => {
    if (subscription.totalQuota === -1) return true;
    if (subscription.searchesRemaining <= 0) {
      setPricingModalOpen(true);
      showToast(
        isGuest
          ? "Guest preview limit reached (5 searches). Create a free account for 50 monthly searches."
          : "Monthly search limit reached. Upgrade your plan to continue searching.",
        "error",
      );
      return false;
    }
    return true;
  }, [subscription.totalQuota, subscription.searchesRemaining, isGuest, showToast]);

  const deductSearch = useCallback((): boolean => {
    if (subscription.totalQuota === -1) return true;
    if (subscription.searchesRemaining <= 0) {
      setPricingModalOpen(true);
      return false;
    }
    const updated: UserSubscriptionState = {
      ...subscription,
      searchesRemaining: Math.max(0, subscription.searchesRemaining - 1),
      updatedAt: new Date().toISOString(),
    };
    saveUserSubscription(updated, ownerId);
    setSubscription(updated);
    return true;
  }, [subscription, ownerId]);

  const value = useMemo(
    () => ({
      creators,
      lists,
      workspaces,
      activeWorkspace,
      hydrated,
      storageError,
      ownerId,
      userEmail,
      isGuest,
      isAdmin,
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
      syncServerQuota,
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
      userEmail,
      isGuest,
      isAdmin,
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
      syncServerQuota,
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
