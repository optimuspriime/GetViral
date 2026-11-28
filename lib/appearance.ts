export type SignalThemeId = "emerald" | "mint" | "lime" | "coral" | "violet" | "custom";
export type SurfaceMode = "light" | "dark";

export interface SignalThemeOption {
  id: Exclude<SignalThemeId, "custom">;
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
  surfaceMode: SurfaceMode;
  signalTheme: SignalThemeId;
  customColor: string;
  reduceMotion: boolean;
}

const APPEARANCE_STORAGE_KEY = "gv-appearance-v2";
const LEGACY_APPEARANCE_KEY = "gv-appearance-v1";

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  surfaceMode: "light",
  signalTheme: "emerald",
  customColor: "#16834B",
  reduceMotion: false,
};

export function isValidSurfaceMode(value: unknown): value is SurfaceMode {
  return value === "light" || value === "dark";
}

export function isValidSignalTheme(value: unknown): value is SignalThemeId {
  return (
    value === "emerald" ||
    value === "mint" ||
    value === "lime" ||
    value === "coral" ||
    value === "violet" ||
    value === "custom"
  );
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((ch) => ch + ch)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHexColor(hex) ?? "#16834B";
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;

  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

const CUSTOM_STYLE_KEYS = [
  "--accent-primary",
  "--accent-soft",
  "--accent-dark",
  "--accent-highlight",
  "--accent-pulse-start",
  "--accent-pulse-end",
  "--accent-border",
  "--accent-ring",
  "--canvas-top",
  "--canvas-bottom",
  "--bloom-1",
  "--bloom-2",
  "--bloom-3",
  "--bloom-4",
] as const;

export function deriveCustomThemeTokens(hex: string, mode: SurfaceMode): Record<string, string> {
  const clean = normalizeHexColor(hex) ?? "#16834B";
  const { h, s, l } = hexToHsl(clean);
  const safeS = Math.max(24, s);

  if (mode === "dark") {
    const primaryHex = hslToHex(h, safeS, Math.min(62, Math.max(46, l)));
    const { r, g, b } = hexToRgb(primaryHex);
    const compHue = (h + 42) % 360;
    const compRgb = hexToRgb(hslToHex(compHue, Math.max(35, safeS - 10), 58));

    return {
      "--accent-primary": primaryHex,
      "--accent-soft": hslToHex(h, Math.min(100, safeS + 8), 64),
      "--accent-dark": hslToHex(h, safeS, 38),
      "--accent-highlight": hslToHex(h, Math.min(100, safeS + 10), 74),
      "--accent-pulse-start": hslToHex(h, safeS, 68),
      "--accent-pulse-end": hslToHex(compHue, safeS, 84),
      "--accent-border": `rgba(${r}, ${g}, ${b}, 0.34)`,
      "--accent-ring": `rgba(${r}, ${g}, ${b}, 0.38)`,
      "--canvas-top": hslToHex(h, Math.min(28, safeS), 6),
      "--canvas-bottom": hslToHex(h, Math.min(30, safeS), 9),
      "--bloom-1": `rgba(${r}, ${g}, ${b}, 0.22)`,
      "--bloom-2": `rgba(${compRgb.r}, ${compRgb.g}, ${compRgb.b}, 0.14)`,
      "--bloom-3": `rgba(${r}, ${g}, ${b}, 0.08)`,
      "--bloom-4": `rgba(${compRgb.r}, ${compRgb.g}, ${compRgb.b}, 0.08)`,
    };
  }

  // Light mode: ensure strong readable accent saturation/contrast on pale tinted glass
  const primaryHex = hslToHex(h, Math.max(38, safeS), Math.min(48, Math.max(32, l)));
  const { r, g, b } = hexToRgb(primaryHex);
  const compHue = (h + 38) % 360;
  const compRgb = hexToRgb(hslToHex(compHue, Math.max(42, safeS - 5), 55));

  return {
    "--accent-primary": primaryHex,
    "--accent-soft": hslToHex(h, Math.min(100, safeS + 8), Math.min(54, Math.max(40, l + 6))),
    "--accent-dark": hslToHex(h, Math.max(40, safeS), 26),
    "--accent-highlight": hslToHex(h, Math.min(100, safeS + 12), 72),
    "--accent-pulse-start": hslToHex(h, safeS, 70),
    "--accent-pulse-end": hslToHex(compHue, safeS, 88),
    "--accent-border": `rgba(${r}, ${g}, ${b}, 0.24)`,
    "--accent-ring": `rgba(${r}, ${g}, ${b}, 0.26)`,
    "--canvas-top": hslToHex(h, Math.min(38, safeS), 96),
    "--canvas-bottom": hslToHex(h, Math.min(40, safeS), 92),
    "--bloom-1": `rgba(${r}, ${g}, ${b}, 0.22)`,
    "--bloom-2": `rgba(${compRgb.r}, ${compRgb.g}, ${compRgb.b}, 0.16)`,
    "--bloom-3": `rgba(240, 100, 120, 0.08)`,
    "--bloom-4": `rgba(${r}, ${g}, ${b}, 0.1)`,
  };
}

export function loadAppearancePreferences(): AppearancePreferences {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw =
      window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_APPEARANCE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearancePreferences>;
    return {
      surfaceMode: isValidSurfaceMode(parsed.surfaceMode) ? parsed.surfaceMode : "light",
      signalTheme: isValidSignalTheme(parsed.signalTheme) ? parsed.signalTheme : "emerald",
      customColor: normalizeHexColor(parsed.customColor || "") ?? "#16834B",
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
  root.dataset.surfaceMode = prefs.surfaceMode;
  root.dataset.signalTheme = prefs.signalTheme;
  root.dataset.reduceMotion = prefs.reduceMotion ? "true" : "false";
  root.style.colorScheme = prefs.surfaceMode;

  if (prefs.signalTheme === "custom") {
    const tokens = deriveCustomThemeTokens(prefs.customColor, prefs.surfaceMode);
    for (const [key, val] of Object.entries(tokens)) {
      root.style.setProperty(key, val);
    }
  } else {
    for (const key of CUSTOM_STYLE_KEYS) {
      root.style.removeProperty(key);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gv-appearance-change", { detail: prefs }));
  }
}
