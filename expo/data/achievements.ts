export type AchievementIcon =
  | "trophy"
  | "flame"
  | "star"
  | "zap"
  | "target"
  | "crown"
  | "rocket"
  | "heart";

export interface AchievementProgress {
  completedDays: number[];
  streak: number;
  longestStreak: number;
  totalDaysCompleted: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: AchievementIcon;
  category: "streak" | "milestone" | "special";
  condition: (p: AchievementProgress) => boolean;
  /** The target value the user needs to hit to unlock this achievement. */
  target: number;
  /** Which stat to measure progress against: 'days' (totalDaysCompleted) or 'streak' (longestStreak). */
  progressMetric: "days" | "streak" | "compound";
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_step", name: "First Step", description: "Complete your first day", icon: "rocket", category: "milestone", condition: (p) => p.totalDaysCompleted >= 1, target: 1, progressMetric: "days" },
  { id: "week_one", name: "Week Warrior", description: "Complete 7 days", icon: "star", category: "milestone", condition: (p) => p.totalDaysCompleted >= 7, target: 7, progressMetric: "days" },
  { id: "two_weeks", name: "Fortnight Fighter", description: "Complete 14 days", icon: "zap", category: "milestone", condition: (p) => p.totalDaysCompleted >= 14, target: 14, progressMetric: "days" },
  { id: "month_one", name: "Monthly Master", description: "Complete 30 days", icon: "target", category: "milestone", condition: (p) => p.totalDaysCompleted >= 30, target: 30, progressMetric: "days" },
  { id: "halfway", name: "Halfway Hero", description: "Complete 50 days", icon: "trophy", category: "milestone", condition: (p) => p.totalDaysCompleted >= 50, target: 50, progressMetric: "days" },
  { id: "champion", name: "Champion", description: "Complete all 60 days", icon: "crown", category: "milestone", condition: (p) => p.totalDaysCompleted >= 60, target: 60, progressMetric: "days" },
  { id: "streak_3", name: "Getting Started", description: "3-day streak", icon: "flame", category: "streak", condition: (p) => p.longestStreak >= 3, target: 3, progressMetric: "streak" },
  { id: "streak_7", name: "Week Streak", description: "7-day streak", icon: "flame", category: "streak", condition: (p) => p.longestStreak >= 7, target: 7, progressMetric: "streak" },
  { id: "streak_14", name: "Two Week Fire", description: "14-day streak", icon: "flame", category: "streak", condition: (p) => p.longestStreak >= 14, target: 14, progressMetric: "streak" },
  { id: "streak_30", name: "Monthly Blaze", description: "30-day streak", icon: "flame", category: "streak", condition: (p) => p.longestStreak >= 30, target: 30, progressMetric: "streak" },
  { id: "perfect_streak", name: "Perfect Run", description: "60-day streak - no breaks!", icon: "crown", category: "streak", condition: (p) => p.longestStreak >= 60, target: 60, progressMetric: "streak" },
  { id: "dedicated", name: "Dedicated", description: "Maintain a 21-day streak", icon: "heart", category: "special", condition: (p) => p.longestStreak >= 21, target: 21, progressMetric: "streak" },
  { id: "consistency_king", name: "Consistency King", description: "Complete 25 days with 20+ streak", icon: "crown", category: "special", condition: (p) => p.totalDaysCompleted >= 25 && p.longestStreak >= 20, target: 25, progressMetric: "compound" },
];

export const getUnlockedAchievements = (p: AchievementProgress): Achievement[] =>
  ACHIEVEMENTS.filter((a) => a.condition(p));

export const getLockedAchievements = (p: AchievementProgress): Achievement[] =>
  ACHIEVEMENTS.filter((a) => !a.condition(p));
