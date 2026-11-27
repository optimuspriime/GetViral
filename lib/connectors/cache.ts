import type { ConnectorResponse } from "./types";

interface CacheEntry {
  data: ConnectorResponse;
  expiresAt: number;
  cachedAt: number;
}

class SearchCache {
  private store = new Map<string, CacheEntry>();
  private defaultTtlMs = 3 * 60 * 1000; // 3 minutes

  private makeKey(platform: string, operation: string, query: string): string {
    return `${platform.toLowerCase()}:${operation.toLowerCase()}:${query.trim().toLowerCase()}`;
  }

  get(platform: string, operation: string, query: string): ConnectorResponse | null {
    const key = this.makeKey(platform, operation, query);
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    const ageSec = Math.round((Date.now() - entry.cachedAt) / 1000);
    const freshnessStr = `Server Cache (${ageSec < 60 ? `${ageSec}s ago` : `${Math.round(ageSec / 60)}m ago`})`;

    return {
      ...entry.data,
      isLive: false,
      cached: true,
      items: entry.data.items.map((item) => ({
        ...item,
        isLive: false,
        freshness: freshnessStr,
      })),
    };
  }

  set(platform: string, operation: string, query: string, data: ConnectorResponse, ttlMs?: number): void {
    const key = this.makeKey(platform, operation, query);
    const now = Date.now();
    this.store.set(key, {
      data,
      expiresAt: now + (ttlMs ?? this.defaultTtlMs),
      cachedAt: now,
    });
  }

  getCachedNames(): string[] {
    const names = new Set<string>();
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      for (const item of entry.data.items) {
        if (item.name?.trim()) names.add(item.name.trim());
        const cleanHandle = item.handle?.trim().replace(/^@+/, "");
        if (cleanHandle && cleanHandle.length >= 2) names.add(cleanHandle);
      }
    }
    return Array.from(names);
  }

  clear(): void {
    this.store.clear();
  }
}

export const searchCache = new SearchCache();
