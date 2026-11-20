"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_CREATORS } from "@/lib/demo-data";
import type { Creator, ProspectList, ProspectStatus } from "@/lib/model";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Store = {
  creators: Creator[];
  lists: ProspectList[];
  hydrated: boolean;
  storageError: string | null;
  addCreator: (listId: string, creatorId: string) => void;
  removeCreator: (listId: string, creatorId: string) => void;
  createList: (name: string) => string;
  updateNote: (listId: string, creatorId: string, note: string) => void;
  updateTags: (listId: string, creatorId: string, tags: string[]) => void;
  updateStatus: (listId: string, creatorId: string, status: ProspectStatus) => void;
};

const STORAGE_KEY = "signal-prospect-lists-v1";
const CREATOR_STORAGE_KEY = "signal-demo-creators-v1";
const StoreContext = createContext<Store | null>(null);

function isValidLists(value: unknown): value is ProspectList[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string" &&
    Array.isArray(item.creatorIds) && item.notes && typeof item.notes === "object" &&
    item.statuses && typeof item.statuses === "object"
  );
}

function mergeSavedCreators(savedCreators: Creator[]) {
  const savedById = new Map(savedCreators.map((creator) => [creator.id, creator]));
  const seededCreatorIds = new Set(DEMO_CREATORS.map((creator) => creator.id));
  const mergedSeeds = DEMO_CREATORS.map((seed) => {
    const saved = savedById.get(seed.id);
    if (!saved) return seed;

    const seededAccountIds = new Set(seed.accounts.map((account) => account.id));
    const savedAccountsById = new Map(saved.accounts.map((account) => [account.id, account]));
    const accounts = seed.accounts.map((seedAccount) => {
      const savedAccount = savedAccountsById.get(seedAccount.id);
      if (!savedAccount) return seedAccount;

      const snapshotsById = new Map(seedAccount.snapshots.map((snapshot) => [snapshot.id, snapshot]));
      savedAccount.snapshots.forEach((snapshot) => snapshotsById.set(snapshot.id, snapshot));
      const snapshots = [...snapshotsById.values()].sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
      return { ...seedAccount, ...savedAccount, snapshots };
    });

    accounts.push(...saved.accounts.filter((account) => !seededAccountIds.has(account.id)));
    return { ...seed, ...saved, accounts };
  });

  return [...mergedSeeds, ...savedCreators.filter((creator) => !seededCreatorIds.has(creator.id))];
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>(DEMO_CREATORS);
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hydratedOwnerId, setHydratedOwnerId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function resolveOwner() {
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) setOwnerId("demo");
        return;
      }
      const { data, error } = await client.auth.getUser();
      if (error) console.error("Could not resolve the local prospect-list owner.", error);
      if (active) setOwnerId(data.user?.id ?? "demo");
    }
    void resolveOwner().catch((error: unknown) => {
      console.error("Could not resolve the local prospect-list owner.", error);
      if (active) setOwnerId("demo");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ownerId) return;
    setHydrated(false);
    setHydratedOwnerId(null);
    setStorageError(null);
    setLists([]);
    try {
      const saved = window.localStorage.getItem(`${STORAGE_KEY}:${ownerId}`);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isValidLists(parsed)) setLists(parsed);
      }
      const savedCreators = window.localStorage.getItem(CREATOR_STORAGE_KEY);
      if (savedCreators) {
        const parsed: unknown = JSON.parse(savedCreators);
        if (Array.isArray(parsed) && parsed.every(isValidCreator)) {
          setCreators(mergeSavedCreators(parsed));
        }
      }
    } catch (error) {
      console.error("Could not load saved prospect lists from this browser.", error);
      setStorageError("Saved browser data could not be loaded. Changes may not persist.");
    } finally {
      setHydrated(true);
      setHydratedOwnerId(ownerId);
    }
  }, [ownerId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(creators));
      setStorageError(null);
    } catch (error) {
      console.error("Could not save demo creator snapshots in this browser.", error);
      setStorageError("Browser storage is unavailable. Changes may not persist.");
    }
  }, [creators, hydrated]);

  useEffect(() => {
    if (!hydrated || !ownerId || hydratedOwnerId !== ownerId) return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${ownerId}`, JSON.stringify(lists));
      setStorageError(null);
    } catch (error) {
      console.error("Could not save prospect lists in this browser.", error);
      setStorageError("Browser storage is unavailable. Changes may not persist.");
    }
  }, [hydrated, hydratedOwnerId, lists, ownerId]);

  const addCreator = useCallback((listId: string, creatorId: string) => {
    setLists((current) => current.map((list) => list.id !== listId || list.creatorIds.includes(creatorId)
      ? list
      : { ...list, creatorIds: [...list.creatorIds, creatorId], statuses: { ...list.statuses, [creatorId]: "To review" } }));
  }, []);

  const removeCreator = useCallback((listId: string, creatorId: string) => {
    setLists((current) => current.map((list) => list.id === listId
      ? { ...list, creatorIds: list.creatorIds.filter((id) => id !== creatorId) }
      : list));
  }, []);

  const createList = useCallback((name: string) => {
    const id = `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLists((current) => [...current, { id, name, creatorIds: [], notes: {}, tags: {}, statuses: {} }]);
    return id;
  }, []);

  const updateNote = useCallback((listId: string, creatorId: string, note: string) => {
    setLists((current) => current.map((list) => list.id === listId
      ? { ...list, notes: { ...list.notes, [creatorId]: note } }
      : list));
  }, []);

  const updateStatus = useCallback((listId: string, creatorId: string, status: ProspectStatus) => {
    setLists((current) => current.map((list) => list.id === listId
      ? { ...list, statuses: { ...list.statuses, [creatorId]: status } }
      : list));
  }, []);

  const updateTags = useCallback((listId: string, creatorId: string, tags: string[]) => {
    setLists((current) => current.map((list) => list.id === listId
      ? { ...list, tags: { ...list.tags, [creatorId]: tags } }
      : list));
  }, []);

  const value = useMemo(() => ({ creators, lists, hydrated, storageError, addCreator, removeCreator, createList, updateNote, updateTags, updateStatus }),
    [creators, lists, hydrated, storageError, addCreator, removeCreator, createList, updateNote, updateTags, updateStatus]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function isValidCreator(value: unknown): value is Creator {
  if (!value || typeof value !== "object") return false;
  const creator = value as Partial<Creator>;
  return typeof creator.id === "string" &&
    typeof creator.name === "string" &&
    Array.isArray(creator.accounts) &&
    Array.isArray(creator.audienceInsights) &&
    creator.accounts.every((account) =>
      account &&
      typeof account.id === "string" &&
      typeof account.platform === "string" &&
      Array.isArray(account.snapshots) &&
      account.snapshots.every((snapshot) =>
        snapshot &&
        typeof snapshot.id === "string" &&
        typeof snapshot.metricName === "string" &&
        (snapshot.value === null || typeof snapshot.value === "number") &&
        typeof snapshot.collectedAt === "string"
      )
    );
}

export function useProspects() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useProspects must be used within DataProvider");
  return context;
}
