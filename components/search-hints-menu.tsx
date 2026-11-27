"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

const LOCAL_SEED_HINTS = [
  "CarryMinati",
  "CaseOh",
  "Casey Neistat",
  "CarterPCS",
  "Camila",
  "Caylus",
  "MrBeast",
  "MrBeast Gaming",
  "Mrwhosetheboss",
  "Marques Brownlee",
  "Kai Cenat",
  "Adin Ross",
  "xQc",
  "PewDiePie",
  "IShowSpeed",
  "Pokimane",
  "Techno Gamerz",
  "Total Gaming",
  "Triggered Insaan",
  "Sourav Joshi Vlogs",
  "Technical Guruji",
  "Dude Perfect",
  "Linus Tech Tips",
  "Mark Rober",
  "Ryan Trahan",
  "Gaming streamers",
  "Tech reviews",
  "Comedy creators",
  "Music artists",
  "Podcast hosts",
];

function filterHintList(pool: string[], query: string, limit = 7): string[] {
  const cleanQ = query.trim().toLowerCase().replace(/^@+/, "");
  if (!cleanQ) return [];
  const isHandle = query.trim().startsWith("@");
  const seen = new Set<string>();
  const prefix: string[] = [];
  const partial: string[] = [];

  for (const item of pool) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const formatted = isHandle && !trimmed.includes(" ") ? `@${trimmed.replace(/^@+/, "")}` : trimmed;
    const key = formatted.toLowerCase().replace(/^@+/, "");
    if (seen.has(key)) continue;

    // Exclude exact match if it adds nothing new and only show similar/continuing hints
    if (key.startsWith(cleanQ)) {
      seen.add(key);
      prefix.push(formatted);
    } else if (key.includes(cleanQ)) {
      seen.add(key);
      partial.push(formatted);
    }
  }

  return [...prefix, ...partial].slice(0, limit);
}

export function useSearchHints(query: string, extraNames: string[] = []) {
  const [remoteHints, setRemoteHints] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const localHints = useMemo(
    () => filterHintList([...extraNames, ...LOCAL_SEED_HINTS], query, 7),
    [extraNames, query],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setRemoteHints([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: string[] };
        if (Array.isArray(data.suggestions)) {
          setRemoteHints(data.suggestions);
        }
      } catch {
        // Ignore aborted or network timeouts quietly; local hints still show immediately
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const hints = useMemo(() => {
    const cleanQ = query.trim();
    if (!cleanQ) return [];
    const merged = filterHintList([...localHints, ...remoteHints], cleanQ, 7);
    // Avoid showing single identical exact suggestion with nothing else helpful
    if (merged.length === 1 && merged[0].toLowerCase() === cleanQ.toLowerCase()) {
      return [];
    }
    return merged;
  }, [localHints, remoteHints, query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  return {
    hints,
    isOpen: open && hints.length > 0 && query.trim().length > 0,
    setOpen,
    activeIndex,
    setActiveIndex,
  };
}

export function SearchHintsDropdown({
  query,
  hints,
  isOpen,
  activeIndex,
  onSelect,
  onClose,
}: {
  query: string;
  hints: string[];
  isOpen: boolean;
  activeIndex: number;
  onSelect: (hint: string) => void;
  onClose: () => void;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.closest("form")?.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, onClose]);

  if (!isOpen || hints.length === 0) return null;

  const normalizedQ = query.trim().toLowerCase();

  return (
    <div
      ref={containerRef}
      id={listId}
      className="search-hints-dropdown"
      role="listbox"
      aria-label="Search suggestions"
    >
      {hints.map((hint, idx) => {
        const lowerHint = hint.toLowerCase();
        const matchStart = lowerHint.indexOf(normalizedQ);
        return (
          <button
            key={hint}
            type="button"
            role="option"
            aria-selected={idx === activeIndex}
            className={`search-hint-item ${idx === activeIndex ? "active" : ""}`}
            onMouseDown={(e) => {
              // Select before input blur closes the list
              e.preventDefault();
              onSelect(hint);
            }}
          >
            <Search size={13} className="search-hint-icon" />
            <span className="search-hint-text">
              {matchStart >= 0 ? (
                <>
                  {hint.slice(0, matchStart)}
                  <strong>{hint.slice(matchStart, matchStart + normalizedQ.length)}</strong>
                  {hint.slice(matchStart + normalizedQ.length)}
                </>
              ) : (
                hint
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
