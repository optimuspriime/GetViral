export type SignalThemeId = "emerald" | "mint" | "lime" | "coral" | "violet";

export interface SignalThemeOption {
  id: SignalThemeId;
  label: string;
  mood: string;
  primary: string;
  highlight: string;
  bloom: string;
}

export const SIGNAL_THEMES: SignalThemeOption[] = [
  {
    id: "emerald",
    label: "Studio Emerald",
    mood: "Balanced & Focused",
    primary: "#16834B",
    highlight: "#B9F36A",
    bloom: "#E8F3E5",
  },
  {
    id: "mint",
    label: "Crisp Mint",
    mood: "Fresh & Calm",
    primary: "#0D9488",
    highlight: "#6EE7B7",
    bloom: "#E0F5F0",
  },
  {
    id: "lime",
    label: "Electric Lime",
    mood: "Bright & Energetic",
    primary: "#4D7C0F",
    highlight: "#C4F85E",
    bloom: "#EAF5D6",
  },
  {
    id: "coral",
    label: "Warm Coral",
    mood: "Creative & Vibrant",
    primary: "#D9465F",
    highlight: "#FDA4AF",
    bloom: "#FCECEF",
  },
  {
    id: "violet",
    label: "Studio Violet",
    mood: "Deep & Reflective",
    primary: "#7C3AED",
    highlight: "#C4B5FD",
    bloom: "#EFEBFB",
  },
];

export interface AppearancePreferences {
  signalTheme: SignalThemeId;
  reduceMotion: boolean;
}

const APPEARANCE_STORAGE_KEY = "gv-appearance-v1";

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  signalTheme: "emerald",
  reduceMotion: false,
};

export function isValidSignalTheme(value: unknown): value is SignalThemeId {
  return (
    value === "emerald" ||
    value === "mint" ||
    value === "lime" ||
    value === "coral" ||
    value === "violet"
  );
}

export function loadAppearancePreferences(): AppearancePreferences {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearancePreferences>;
    return {
      signalTheme: isValidSignalTheme(parsed.signalTheme) ? parsed.signalTheme : "emerald",
      reduceMotion: typeof parsed.reduceMotion === "boolean" ? parsed.reduceMotion : false,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearancePreferences(prefs: AppearancePreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function applyAppearanceToDocument(prefs: AppearancePreferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.signalTheme = prefs.signalTheme;
  root.dataset.reduceMotion = prefs.reduceMotion ? "true" : "false";
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gv-appearance-change", { detail: prefs }));
  }
}
