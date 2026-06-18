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

export const getWeekForDay = (day: number): WeekTheme | undefined => {
  return WEEK_THEMES.find((w) => day >= w.startDay && day <= w.endDay);
};
