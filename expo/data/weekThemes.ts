import { PathType } from "@/types";

export interface WeekTheme {
  week: number;
  name: string;
  startDay: number;
  endDay: number;
}

export const WEEK_THEMES: WeekTheme[] = [
  { week: 1, name: "Breaking the Ice", startDay: 1, endDay: 7 },
  { week: 2, name: "Finding Your Voice", startDay: 8, endDay: 14 },
  { week: 3, name: "Small Steps Forward", startDay: 15, endDay: 21 },
  { week: 4, name: "Building Momentum", startDay: 22, endDay: 28 },
  { week: 5, name: "Pushing Boundaries", startDay: 29, endDay: 35 },
  { week: 6, name: "Embracing Discomfort", startDay: 36, endDay: 42 },
  { week: 7, name: "Rising Confidence", startDay: 43, endDay: 49 },
  { week: 8, name: "Mastering the Craft", startDay: 50, endDay: 56 },
  { week: 9, name: "Victory Lap", startDay: 57, endDay: 60 },
];

/** Path-specific week theme names — each path gives the same structure a different narrative flavour. */
export const PATH_WEEK_NAMES: Record<PathType, Record<number, string>> = {
  introvert: {
    1: "First Hello",
    2: "Warming Up",
    3: "Quiet Confidence",
    4: "Deeper Bonds",
    5: "Stepping Out",
    6: "Owning the Room",
    7: "Unshakable Calm",
    8: "Natural Flow",
    9: "The New You",
  },
  speaking: {
    1: "Mic Check",
    2: "Clear & Steady",
    3: "Finding Cadence",
    4: "Own Your Voice",
    5: "Captivate & Hold",
    6: "Speaking with Heart",
    7: "Command the Stage",
    8: "Effortless Presence",
    9: "Voice of Impact",
  },
  assertiveness: {
    1: "Know Your Worth",
    2: "Setting the Line",
    3: "Saying No Freely",
    4: "Unapologetic You",
    5: "Holding Your Ground",
    6: "Leading with Strength",
    7: "Boundaries That Breathe",
    8: "Respected & Heard",
    9: "Iron Compassion",
  },
};

/** Get week themes personalised to a specific path. Falls back to generic names. */
export const getWeekThemesForPath = (path: PathType): WeekTheme[] => {
  const names = PATH_WEEK_NAMES[path];
  return WEEK_THEMES.map((w) => ({
    ...w,
    name: names[w.week] ?? w.name,
  }));
};

export const getWeekForDay = (day: number): WeekTheme | undefined => {
  return WEEK_THEMES.find((w) => day >= w.startDay && day <= w.endDay);
};
