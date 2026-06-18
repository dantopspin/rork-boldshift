import { ACCENT } from "@/constants/theme";

export type XpIcon = "star" | "zap" | "trending-up" | "award" | "crown" | "sparkles";

export interface XpLevel {
  level: number;
  name: string;
  minXP: number;
  icon: XpIcon;
  color: string;
}

export const XP_LEVELS: XpLevel[] = [
  { level: 1, name: "Beginner", minXP: 0, icon: "star", color: ACCENT.introvert },
  { level: 2, name: "Starter", minXP: 100, icon: "zap", color: ACCENT.introvert },
  { level: 3, name: "Committed", minXP: 250, icon: "trending-up", color: ACCENT.success },
  { level: 4, name: "Determined", minXP: 500, icon: "award", color: ACCENT.milestone },
  { level: 5, name: "Champion", minXP: 750, icon: "crown", color: ACCENT.milestone },
  { level: 6, name: "Legend", minXP: 1000, icon: "sparkles", color: ACCENT.milestone },
];

export const getCurrentLevel = (xp: number): XpLevel => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
};

export const getNextLevel = (xp: number): XpLevel | null => {
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp < XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return null;
};

export const getProgressToNextLevel = (xp: number): number => {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const into = xp - current.minXP;
  const needed = next.minXP - current.minXP;
  return (into / needed) * 100;
};
