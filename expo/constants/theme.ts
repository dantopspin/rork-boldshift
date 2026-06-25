import { PathType } from "@/types";

/**
 * BoldShift color system, ported from the source web app's HSL tokens to
 * concrete hex values for React Native. Two palettes: dark (default) and light.
 */
export interface Palette {
  background: string;
  backgroundGradient: [string, string, string];
  card: string;
  cardSolid: string;
  glassBg: string;
  glassBorder: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  secondary: string;
  border: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
}

export const DARK: Palette = {
  background: "#0D0F12",
  backgroundGradient: ["#0D0F12", "#1B1F26", "#0D0F12"],
  card: "rgba(28,33,41,0.7)",
  cardSolid: "#171A1F",
  glassBg: "rgba(26,31,40,0.72)",
  glassBorder: "rgba(255,255,255,0.08)",
  foreground: "#F7F8FA",
  muted: "#2A2F38",
  mutedForeground: "#8A8F99",
  secondary: "#242932",
  border: "#2D323B",
  // `primary` matches the Introvert path color; use PATH_THEME[path].color for journey-related UI.
  primary: "#1A8CFF",
  primaryForeground: "#08111C",
  destructive: "#E0483D",
};

export const LIGHT: Palette = {
  background: "#F4F6F9",
  backgroundGradient: ["#F4F6F9", "#EAEDF2", "#F4F6F9"],
  card: "rgba(255,255,255,0.85)",
  cardSolid: "#FFFFFF",
  glassBg: "rgba(255,255,255,0.82)",
  glassBorder: "rgba(0,0,0,0.15)",
  foreground: "#161A21",
  muted: "#E6E9EF",
  mutedForeground: "#6B7280",
  secondary: "#E6E9EF",
  border: "#DDE1E8",
  primary: "#0A84FF",
  primaryForeground: "#FFFFFF",
  destructive: "#E0483D",
};

/** Brand accent colors that stay consistent across light/dark. */
export const ACCENT = {
  introvert: "#1A8CFF",
  introvertGlow: "#4DA6FF",
  speaking: "#FA7918",
  speakingGlow: "#FB9447",
  assertiveness: "#9B49E8",
  assertivenessGlow: "#B26BF0",
  success: "#34C9A3",
  milestone: "#F5A623",
  streak: "#FB5436",
  cyan: "#22D3EE",
} as const;

export interface PathTheme {
  color: string;
  glow: string;
  gradient: [string, string];
  label: string;
  emoji: string;
  tagline: string;
}

export const PATH_THEME: Record<PathType, PathTheme> = {
  introvert: {
    color: ACCENT.introvert,
    glow: ACCENT.introvertGlow,
    gradient: ["#1A8CFF", "#0A66CC"],
    label: "Social Confidence",
    emoji: "💬",
    tagline: "Feel calmer and more natural around people",
  },
  speaking: {
    color: ACCENT.speaking,
    glow: ACCENT.speakingGlow,
    gradient: ["#FA7918", "#E0530E"],
    label: "Public Speaking",
    emoji: "🎤",
    tagline: "Build speaking confidence step by step",
  },
  assertiveness: {
    color: ACCENT.assertiveness,
    glow: ACCENT.assertivenessGlow,
    gradient: ["#9B49E8", "#7A28C9"],
    label: "Assertiveness",
    emoji: "🛡️",
    tagline: "Say what you mean, without the guilt",
  },
};

export const GOLD_GRADIENT: [string, string] = ["#F5A623", "#E0820E"];

export const FONT = {
  regular: "Nunito_400Regular",
  medium: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extrabold: "Nunito_800ExtraBold",
} as const;

export const RADIUS = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;
