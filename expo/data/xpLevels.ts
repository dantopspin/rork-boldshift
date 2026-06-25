import { ACCENT } from "@/constants/theme";

export type XpIcon = "star" | "zap" | "trending-up" | "award" | "crown" | "sparkles" | "shield" | "flame";

export interface XpLevel {
  level: number;
  name: string;
  minXP: number;
  icon: XpIcon;
  color: string;
}

export const XP_LEVELS: XpLevel[] = [
  { level: 1, name: "Aspirant", minXP: 0, icon: "star", color: ACCENT.introvert },
  { level: 2, name: "Sparks", minXP: 100, icon: "zap", color: ACCENT.introvert },
  { level: 3, name: "Rising", minXP: 250, icon: "trending-up", color: ACCENT.introvert },
  { level: 4, name: "Steady", minXP: 400, icon: "shield", color: ACCENT.speaking },
  { level: 5, name: "Dauntless", minXP: 600, icon: "flame", color: ACCENT.speaking },
  { level: 6, name: "Resilient", minXP: 850, icon: "shield", color: ACCENT.speaking },
  { level: 7, name: "Forged", minXP: 1100, icon: "award", color: ACCENT.success },
  { level: 8, name: "Driven", minXP: 1400, icon: "trending-up", color: ACCENT.success },
  { level: 9, name: "Tenacious", minXP: 1750, icon: "flame", color: ACCENT.success },
  { level: 10, name: "Valiant", minXP: 2100, icon: "crown", color: ACCENT.milestone },
  { level: 11, name: "Fearless", minXP: 2500, icon: "shield", color: ACCENT.assertiveness },
  { level: 12, name: "Boldheart", minXP: 3000, icon: "flame", color: ACCENT.assertiveness },
  { level: 13, name: "Unbroken", minXP: 3500, icon: "award", color: ACCENT.assertiveness },
  { level: 14, name: "Radiant", minXP: 4100, icon: "sparkles", color: ACCENT.milestone },
  { level: 15, name: "Ironclad", minXP: 4700, icon: "shield", color: ACCENT.milestone },
  { level: 16, name: "Unstoppable", minXP: 5300, icon: "flame", color: ACCENT.speaking },
  { level: 17, name: "Apex", minXP: 5900, icon: "trending-up", color: ACCENT.speaking },
  { level: 18, name: "Vanguard", minXP: 6500, icon: "crown", color: ACCENT.assertiveness },
  { level: 19, name: "Luminous", minXP: 7000, icon: "sparkles", color: ACCENT.milestone },
  { level: 20, name: "Transcendent", minXP: 7500, icon: "crown", color: ACCENT.milestone },
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
