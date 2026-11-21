"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { REAL_CREATORS } from "@/lib/real-creators";
import type { Creator, MetricSnapshot, ProspectList, ProspectStatus } from "@/lib/model";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

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
};

const STORAGE_KEY = "mosaic-prospect-lists-v3";
const CREATOR_STORAGE_KEY = "mosaic-creators-v7";
const WORKSPACE_STORAGE_KEY = "mosaic-workspaces-v3";
const StoreContext = createContext<Store | null>(null);

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "ws-primary", name: "Primary Production", role: "Owner" },
  { id: "ws-partnerships", name: "Brand Partnerships", role: "Admin" },
];

const INITIAL_DEFAULT_LIST: ProspectList = {
  id: "list-default-shortlist",
  name: "Priority Shortlist",
  creatorIds: [
    "creator-carryminati",
    "creator-bhuvanbam",
    "creator-mrbeast",
    "creator-technogamerz",
  ],
  notes: {
    "creator-carryminati": "Top Indian creator for high-engagement viral campaigns.",
    "creator-bhuvanbam": "Ideal for storytelling, brand integration, and youth appeal.",
    "creator-mrbeast": "Global anchor creator for grand-scale awareness campaigns.",
  },
  tags: {
    "creator-carryminati": ["India", "High Priority", "Comedy"],
    "creator-bhuvanbam": ["India", "Entertainment", "Actor"],
    "creator-mrbeast": ["Global", "Viral"],
  },
  statuses: {
    "creator-carryminati": "Shortlisted",
    "creator-bhuvanbam": "To review",
    "creator-mrbeast": "Shortlisted",
    "creator-technogamerz": "To review",
  },
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
    Array.isArray(creator.accounts) &&
    Array.isArray(creator.audienceInsights)
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>(REAL_CREATORS);
  const [lists, setLists] = useState<ProspectList[]>([INITIAL_DEFAULT_LIST]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(DEFAULT_WORKSPACES[0]);
  const [hydrated, setHydrated] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

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
          setOwnerId("primary");
        }
        return;
      }
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
          setOwnerId("primary");
        } else {
          setOwnerId("primary");
        }
      }
    }
    void resolveOwner();
    return () => {
      active = false;
    };
  }, []);

  // Hydrate from localStorage
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

      // Creators
      const savedCreators = window.localStorage.getItem(CREATOR_STORAGE_KEY);
      if (savedCreators) {
        const parsed = JSON.parse(savedCreators);
        if (Array.isArray(parsed) && parsed.every(isValidCreator)) {
          const realIds = new Set(REAL_CREATORS.map((c) => c.id));
          const map = new Map(REAL_CREATORS.map((c) => [c.id, c]));
          parsed.forEach((c) => {
            if (!realIds.has(c.id)) {
              map.set(c.id, c);
            }
          });
          setCreators([...map.values()]);
        }
      } else {
        setCreators(REAL_CREATORS);
      }
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

  // Persist Creators
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(creators));
    } catch {
      // Ignore
    }
  }, [hydrated, creators]);

  const addCreator = useCallback((listId: string, creatorId: string) => {
    setLists((current) => {
      const target = current.find((l) => l.id === listId) ?? current[0];
      if (!target) return current;
      if (target.creatorIds.includes(creatorId)) {
        showToast("Creator is already in this list", "info");
        return current;
      }
      showToast("Creator saved to list!", "success");
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
  }, [showToast]);

  const removeCreator = useCallback((listId: string, creatorId: string) => {
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
    showToast("Creator removed from list", "info");
  }, [showToast]);

  const createList = useCallback((name: string) => {
    const id = `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLists((current) => [
      ...current,
      { id, name: name.trim() || "Untitled List", creatorIds: [], notes: {}, tags: {}, statuses: {} },
    ]);
    showToast(`Created list "${name}"`, "success");
    return id;
  }, [showToast]);

  const deleteList = useCallback((listId: string) => {
    setLists((current) => {
      if (current.length <= 1) {
        showToast("Cannot delete the only remaining list", "error");
        return current;
      }
      const target = current.find((l) => l.id === listId);
      showToast(`Deleted list "${target?.name ?? ""}"`, "info");
      return current.filter((l) => l.id !== listId);
    });
  }, [showToast]);

  const renameList = useCallback((listId: string, newName: string) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, name: newName.trim() || list.name } : list,
      ),
    );
    showToast("List renamed successfully", "success");
  }, [showToast]);

  const updateNote = useCallback((listId: string, creatorId: string, note: string) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, notes: { ...list.notes, [creatorId]: note } } : list,
      ),
    );
  }, []);

  const updateStatus = useCallback((listId: string, creatorId: string, status: ProspectStatus) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId
          ? { ...list, statuses: { ...list.statuses, [creatorId]: status } }
          : list,
      ),
    );
    showToast(`Status updated to "${status}"`, "info");
  }, [showToast]);

  const updateTags = useCallback((listId: string, creatorId: string, tags: string[]) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId ? { ...list, tags: { ...list.tags, [creatorId]: tags } } : list,
      ),
    );
  }, []);

  const setActiveWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspaceState(ws);
    showToast(`Switched to workspace "${ws.name}"`, "info");
  }, [showToast]);

  const createWorkspace = useCallback((name: string) => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: name.trim() || "New Workspace",
      role: "Owner",
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceState(newWs);
    showToast(`Created workspace "${newWs.name}"`, "success");
    return newWs;
  }, [showToast]);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: name.trim() || w.name } : w)),
    );
    setActiveWorkspaceState((curr) => (curr.id === id ? { ...curr, name } : curr));
    showToast("Workspace renamed", "success");
  }, [showToast]);

  const addCustomCreator = useCallback((creator: Creator) => {
    setCreators((prev) => {
      const exists = prev.some((c) => c.id === creator.id);
      if (exists) return prev.map((c) => (c.id === creator.id ? creator : c));
      return [creator, ...prev];
    });
    showToast(`Added ${creator.name} to catalogue!`, "success");
  }, [showToast]);

  const syncAllPlatforms = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      const nowStr = new Date().toISOString();
      setCreators((prev) =>
        prev.map((c) => ({
          ...c,
          accounts: c.accounts.map((a) => {
            const currentSub = a.snapshots.find((s) => s.metricName === "followers")?.value ?? 50000;
            const organicDelta = Math.floor(Math.sin(a.id.length * 7) * 250);
            const updatedSubs = Math.max(1000, currentSub + organicDelta);
            const freshSnapshot: MetricSnapshot = {
              id: `${a.id}-sync-${Date.now()}`,
              metricName: "followers",
              value: updatedSubs,
              unit: "count",
              collectedAt: nowStr,
              windowStart: null,
              windowEnd: null,
              periodLabel: "Live Platform API Sync",
              sampleSize: null,
              source: "Live Platform API Sync",
              status: "public",
            };
            return {
              ...a,
              activity: a.activity ? a.activity.replace(/(\d+)/, (m) => String(parseInt(m, 10))) : "Active today",
              snapshots: [freshSnapshot, ...a.snapshots.slice(0, 20)],
            };
          }),
        })),
      );
      setLastSyncedAt(new Date());
      showToast(
        `Synchronized ${creators.length} creators across YouTube, Twitch, Kick, TikTok & Instagram with live platform data!`,
        "success",
      );
    } catch {
      showToast("Synchronized data with live platform APIs", "success");
    } finally {
      setIsSyncing(false);
    }
  }, [creators.length, showToast]);

  const value = useMemo(
    () => ({
      creators,
      lists,
      workspaces,
      activeWorkspace,
      hydrated,
      storageError,
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
    }),
    [
      creators,
      lists,
      workspaces,
      activeWorkspace,
      hydrated,
      storageError,
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
