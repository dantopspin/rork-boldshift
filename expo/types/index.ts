export type PathType = "introvert" | "speaking" | "assertiveness";
export type DifficultyPreference = "gentle" | "steady" | "push";
export type SocialFear = "judged" | "ignored" | "rejected" | "no_words" | "wrong_thing";
export type SocialGoal =
  | "less_anxious"
  | "speak_confidently"
  | "set_boundaries"
  | "stop_overthinking"
  | "improve_relationships";

export type Mood = "great" | "good" | "okay" | "hard";

export interface Challenge {
  id: number;
  day: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  category: string;
  path: PathType;
}

export interface Reflection {
  text: string;
  mood: Mood;
  timestamp: string;
}

export interface UserProgress {
  selectedPath: PathType | null;
  currentDay: number;
  completedDays: number[];
  streak: number;
  longestStreak: number;
  startDate: string | null;
  lastCompletedDate: string | null;
  streakFreezes: number;
  lastFreezeReset: string | null;
  unlockedAchievements: string[];
  completedBonusChallenges: string[];
  lastMainChallengeDate: string | null;
  reflections: Record<number, Reflection>;
  lastVisitDate: string | null;
  checkInDismissedDate: string | null;
  difficultyPreference: DifficultyPreference | null;
  socialFear: SocialFear | null;
  socialGoal: SocialGoal | null;
}

export type NodeStatus = "completed" | "current" | "locked" | "pro-locked";

export const MILESTONES = [15, 30, 45, 60] as const;
export const TOTAL_DAYS = 60;
export const FREE_DAYS = 15;

export const DEFAULT_PROGRESS: UserProgress = {
  selectedPath: null,
  currentDay: 1,
  completedDays: [],
  streak: 0,
  longestStreak: 0,
  startDate: null,
  lastCompletedDate: null,
  streakFreezes: 2,
  lastFreezeReset: null,
  unlockedAchievements: [],
  completedBonusChallenges: [],
  lastMainChallengeDate: null,
  reflections: {},
  lastVisitDate: null,
  checkInDismissedDate: null,
  difficultyPreference: null,
  socialFear: null,
  socialGoal: null,
};
