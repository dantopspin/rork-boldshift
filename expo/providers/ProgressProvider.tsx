import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PROGRESS,
  DifficultyPreference,
  DIFFICULTY_MULTIPLIER,
  Mood,
  PathType,
  SocialFear,
  SocialGoal,
  UserProgress,
} from "@/types";
import { getUnlockedAchievements } from "@/data/achievements";
import { getChallengesForPath } from "@/data/challenges";
import { getCurrentLevel } from "@/data/xpLevels";

const STORAGE_KEY = "boldshift_progress";
const FLAGS_KEY = "boldshift_flags";
const CHECKSUM_SALT = 0x5a1d_b0e7; // arbitrary salt to deter casual tampering

/** Fast, non-cryptographic 32-bit hash (djb2a variant) for data integrity checks. */
function hash32(str: string): number {
  let h = 5381 ^ CHECKSUM_SALT;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

const todayStr = (): string => new Date().toISOString().split("T")[0];
const yesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

/** Returns the absolute difference in calendar days between two ISO date strings. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round(Math.abs(da - db) / 86400000);
}

export const [ProgressProvider, useProgress] = createContextHook(() => {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);

  // Load persisted progress
  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const storedRaw = await AsyncStorage.getItem(STORAGE_KEY);
        const storedHash = await AsyncStorage.getItem(`${STORAGE_KEY}_hash`);
        if (storedRaw && storedHash) {
          const expectedHash = hash32(storedRaw).toString(16);
          if (storedHash !== expectedHash) {
            // Checksum mismatch — data was tampered with; reset to defaults
            console.warn("Progress data integrity check failed — resetting");
            await AsyncStorage.multiRemove([STORAGE_KEY, `${STORAGE_KEY}_hash`, FLAGS_KEY]).catch(() => {});
            setIsLoaded(true);
            return;
          }
          const parsed = JSON.parse(storedRaw) as Partial<UserProgress>;

          // Prune bonus challenge entries older than 7 days to keep the array bounded
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          const cutoffStr = cutoff.toISOString().split("T")[0];
          const originalBonuses = parsed.completedBonusChallenges ?? [];
          const prunedBonuses = originalBonuses.filter((key) => {
            const datePart = key.split("_").pop();
            return datePart !== undefined && datePart >= cutoffStr;
          });
          const prunedCount = originalBonuses.length - prunedBonuses.length;
          // Carry over XP from pruned bonus challenges so total XP never drops
          const prunedXP = prunedCount * 5;

          // Auto-freeze: silently protect the streak if the user missed yesterday
          const today = todayStr();
          const yStr = yesterdayStr();
          let streakFreezes = parsed.streakFreezes ?? 2;
          let lastCompDate = parsed.lastCompletedDate ?? null;
          if (
            (parsed.streak ?? 0) > 0 &&
            streakFreezes > 0 &&
            lastCompDate &&
            lastCompDate < yStr &&
            lastCompDate !== today
          ) {
            streakFreezes -= 1;
            lastCompDate = yStr;
          }

          setProgress({
            ...DEFAULT_PROGRESS,
            ...parsed,
            streakFreezes,
            lastCompletedDate: lastCompDate,
            unlockedAchievements: parsed.unlockedAchievements ?? [],
            completedBonusChallenges: prunedBonuses,
            reflections: parsed.reflections ?? {},
            totalXP: (parsed.totalXP ?? 0) + prunedXP,
          });
        }
      } catch (e) {
        console.error("Failed to load progress", e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Persist on change (with integrity hash)
  useEffect(() => {
    if (isLoaded) {
      const raw = JSON.stringify(progress);
      const hash = hash32(raw).toString(16);
      Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, raw),
        AsyncStorage.setItem(`${STORAGE_KEY}_hash`, hash),
      ]).catch((e) => console.error("Failed to save progress", e));
    }
  }, [progress, isLoaded]);

  // Monthly streak-freeze reset
  useEffect(() => {
    if (!isLoaded) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (progress.lastFreezeReset !== currentMonth) {
      setProgress((prev) => ({ ...prev, streakFreezes: 2, lastFreezeReset: currentMonth }));
    }
  }, [isLoaded, progress.lastFreezeReset]);

  const checkAchievements = useCallback((updated: UserProgress): string[] => {
    const newUnlocked = getUnlockedAchievements({
      completedDays: updated.completedDays,
      streak: updated.streak,
      longestStreak: updated.longestStreak,
      totalDaysCompleted: updated.completedDays.length,
    })
      .map((a) => a.id)
      .filter((id) => !updated.unlockedAchievements.includes(id));
    return newUnlocked.length > 0
      ? [...updated.unlockedAchievements, ...newUnlocked]
      : updated.unlockedAchievements;
  }, []);

  /** Compute the effective XP reward from baseXP using the user's difficulty preference multiplier. */
  const computeXPReward = useCallback(
    (baseXP: number): number => {
      const multiplier = progress.difficultyPreference
        ? DIFFICULTY_MULTIPLIER[progress.difficultyPreference]
        : 1.0;
      return Math.round(baseXP * multiplier);
    },
    [progress.difficultyPreference],
  );

  const selectPath = useCallback(
    (
      path: PathType,
      preference?: DifficultyPreference | null,
      fears?: SocialFear[],
      goals?: SocialGoal[],
    ): void => {
      setProgress((prev) => ({
        ...prev,
        selectedPath: path,
        startDate: new Date().toISOString(),
        difficultyPreference: preference ?? null,
        socialFear: fears ?? [],
        socialGoal: goals ?? [],
      }));
    },
    [],
  );

  const canCompleteMainChallenge = useCallback(
    (): boolean => progress.lastMainChallengeDate !== todayStr(),
    [progress.lastMainChallengeDate],
  );

  const completeDay = useCallback(
    (day: number, reflection?: { text: string; mood: Mood; photoUri?: string }): void => {
      const today = todayStr();
      setProgress((prev) => {
        if (prev.completedDays.includes(day)) return prev;
        const lastDate = prev.lastCompletedDate;
        let newStreak: number;
        if (lastDate && daysBetween(today, lastDate) === 1) {
          newStreak = prev.streak + 1;
        } else if (lastDate && daysBetween(today, lastDate) === 0) {
          newStreak = prev.streak; // same day — keep streak, don't increment
        } else {
          newStreak = 1;
        }
        const newCompletedDays = [...prev.completedDays, day].sort((a, b) => a - b);
        const newCompletedDates = prev.completedDates.includes(today)
          ? prev.completedDates
          : [...prev.completedDates, today];
        const nextIncompleteDay =
          Array.from({ length: 60 }, (_, i) => i + 1).find((d) => !newCompletedDays.includes(d)) ?? 60;
        const newReflections = reflection
          ? {
              ...prev.reflections,
              [day]: {
                text: reflection.text,
                mood: reflection.mood,
                timestamp: new Date().toISOString(),
                ...(reflection.photoUri ? { photoUri: reflection.photoUri } : {}),
              },
            }
          : prev.reflections;

        // Compute XP earned for this day (baseXP * difficulty multiplier)
        const challenges = prev.selectedPath ? getChallengesForPath(prev.selectedPath) : [];
        const challenge = challenges.find((c) => c.day === day);
        const multiplier = prev.difficultyPreference
          ? DIFFICULTY_MULTIPLIER[prev.difficultyPreference]
          : 1.0;
        const earnedXP = Math.round((challenge?.baseXP ?? 10) * multiplier);

        const prevXP = prev.totalXP ?? 0;
        const newXP = prevXP + earnedXP;
        const prevLevel = getCurrentLevel(prevXP);
        const newLevel = getCurrentLevel(newXP);
        if (newLevel.level > prevLevel.level && prevLevel.level >= 1) {
          setShowLevelUp(true);
        }

        const updated: UserProgress = {
          ...prev,
          completedDays: newCompletedDays,
          completedDates: newCompletedDates,
          currentDay: Math.max(nextIncompleteDay, prev.currentDay),
          streak: newStreak,
          longestStreak: Math.max(newStreak, prev.longestStreak),
          lastCompletedDate: today,
          lastMainChallengeDate: today,
          reflections: newReflections,
          totalXP: newXP,
        };
        return { ...updated, unlockedAchievements: checkAchievements(updated) };
      });
    },
    [checkAchievements],
  );

  const dismissLevelUp = useCallback((): void => {
    setShowLevelUp(false);
  }, []);

  const useStreakFreeze = useCallback((): void => {
    setProgress((prev) => {
      if (prev.streakFreezes <= 0) return prev;
      return {
        ...prev,
        streakFreezes: prev.streakFreezes - 1,
        lastCompletedDate: yesterdayStr(),
        checkInDismissedDate: todayStr(),
        lastVisitDate: todayStr(),
      };
    });
  }, []);

  const completeBonusChallenge = useCallback((challengeId: string): void => {
    const key = `${challengeId}_${todayStr()}`;
    setProgress((prev) => {
      if (prev.completedBonusChallenges.includes(key)) return prev;
      const bonusXP = 5;
      const multiplier = prev.difficultyPreference
        ? DIFFICULTY_MULTIPLIER[prev.difficultyPreference]
        : 1.0;
      const earnedBonus = Math.round(bonusXP * multiplier);
      return {
        ...prev,
        completedBonusChallenges: [...prev.completedBonusChallenges, key],
        totalXP: (prev.totalXP ?? 0) + earnedBonus,
      };
    });
  }, []);

  const isBonusChallengeCompleted = useCallback(
    (challengeId: string): boolean =>
      progress.completedBonusChallenges.includes(`${challengeId}_${todayStr()}`),
    [progress.completedBonusChallenges],
  );

  const resetProgress = useCallback(async (): Promise<void> => {
    setProgress(DEFAULT_PROGRESS);
    await AsyncStorage.multiRemove([STORAGE_KEY, FLAGS_KEY]).catch(() => {});
  }, []);

  const switchPath = useCallback(
    (newPath: PathType): void => {
      setProgress((prev) => {
        // Compute current XP to carry over
        const oldChallenges = prev.selectedPath ? getChallengesForPath(prev.selectedPath) : [];
        const multiplier = prev.difficultyPreference
          ? DIFFICULTY_MULTIPLIER[prev.difficultyPreference]
          : 1.0;
        const mainXP = prev.completedDays.reduce((acc, day) => {
          const challenge = oldChallenges.find((c) => c.day === day);
          return acc + Math.round((challenge?.baseXP ?? 10) * multiplier);
        }, 0);
        const bonusXP = prev.completedBonusChallenges.length * 5;
        const carryoverXP = (prev.totalXP ?? 0) + mainXP + bonusXP;

        return {
          ...prev,
          selectedPath: newPath,
          currentDay: 1,
          completedDays: [],
          startDate: new Date().toISOString(),
          totalXP: carryoverXP,
        };
      });
    },
    [],
  );

  const importProgress = useCallback((next: UserProgress): void => {
    setProgress({ ...DEFAULT_PROGRESS, ...next });
  }, []);

  const updateReflection = useCallback((day: number, text: string): void => {
    setProgress((prev) => {
      const existing = prev.reflections[day];
      if (!existing) return prev;
      return {
        ...prev,
        reflections: { ...prev.reflections, [day]: { ...existing, text } },
      };
    });
  }, []);

  const deleteReflection = useCallback((day: number): void => {
    setProgress((prev) => {
      if (!prev.reflections[day]) return prev;
      const updated = { ...prev.reflections };
      delete updated[day];
      return { ...prev, reflections: updated };
    });
  }, []);

  /**
   * Sum XP from completedDays and completedBonusChallenges.
   * progress.totalXP is already updated by completeDay / completeBonusChallenge,
   * so we compute from the raw arrays to avoid double-counting.
   */
  const getTotalXP = useCallback((): number => {
    const challenges = progress.selectedPath ? getChallengesForPath(progress.selectedPath) : [];
    const multiplier = progress.difficultyPreference
      ? DIFFICULTY_MULTIPLIER[progress.difficultyPreference]
      : 1.0;
    const mainXP = progress.completedDays.reduce((acc, day) => {
      const challenge = challenges.find((c) => c.day === day);
      return acc + Math.round((challenge?.baseXP ?? 10) * multiplier);
    }, 0);
    const bonusXP = progress.completedBonusChallenges.length * 5;
    return mainXP + bonusXP;
  }, [progress.selectedPath, progress.completedDays, progress.completedBonusChallenges.length, progress.difficultyPreference]);

  const shouldShowCheckIn = useCallback((): boolean => {
    if (!progress.selectedPath || !progress.lastCompletedDate) return false;
    const today = todayStr();
    const yStr = yesterdayStr();
    if (progress.checkInDismissedDate === today) return false;
    if (progress.lastCompletedDate === today) return false;
    return progress.lastCompletedDate < yStr && progress.streak > 0;
  }, [progress.selectedPath, progress.lastCompletedDate, progress.checkInDismissedDate, progress.streak]);

  const getYesterdayDay = useCallback(
    (): number => (progress.currentDay > 1 ? progress.currentDay - 1 : 1),
    [progress.currentDay],
  );

  const confirmYesterdayComplete = useCallback((): void => {
    const today = todayStr();
    const yStr = yesterdayStr();
    const yesterdayDay = getYesterdayDay();
    setProgress((prev) => {
      const newCompletedDays = prev.completedDays.includes(yesterdayDay)
        ? prev.completedDays
        : [...prev.completedDays, yesterdayDay].sort((a, b) => a - b);
      const newCompletedDates = prev.completedDates.includes(yStr)
        ? prev.completedDates
        : [...prev.completedDates, yStr];
      const nextIncompleteDay =
        Array.from({ length: 60 }, (_, i) => i + 1).find((d) => !newCompletedDays.includes(d)) ?? 60;
      // Recalculate streak using robust day-difference check
      const lastDate = prev.lastCompletedDate;
      let newStreak: number;
      if (lastDate && daysBetween(today, lastDate) === 1) {
        newStreak = prev.streak + 1;
      } else if (lastDate && daysBetween(today, lastDate) === 0) {
        newStreak = prev.streak;
      } else {
        newStreak = 1;
      }
      const updated: UserProgress = {
        ...prev,
        completedDays: newCompletedDays,
        completedDates: newCompletedDates,
        currentDay: Math.max(nextIncompleteDay, prev.currentDay),
        streak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        lastCompletedDate: today,
        checkInDismissedDate: today,
        lastVisitDate: today,
      };
      return { ...updated, unlockedAchievements: checkAchievements(updated) };
    });
  }, [getYesterdayDay, checkAchievements]);

  const dismissCheckIn = useCallback((): void => {
    const today = todayStr();
    setProgress((prev) => ({ ...prev, checkInDismissedDate: today, lastVisitDate: today }));
  }, []);



  return useMemo(
    () => ({
      progress,
      isLoaded,
      showLevelUp,
      selectPath,
      completeDay,
      resetProgress,
      switchPath,
      importProgress,
      useStreakFreeze,
      completeBonusChallenge,
      isBonusChallengeCompleted,
      getTotalXP,
      canCompleteMainChallenge,
      shouldShowCheckIn,
      getYesterdayDay,
      confirmYesterdayComplete,
      dismissCheckIn,
      updateReflection,
      deleteReflection,
      computeXPReward,
      dismissLevelUp,
    }),
    [
      progress,
      isLoaded,
      showLevelUp,
      selectPath,
      completeDay,
      resetProgress,
      switchPath,
      importProgress,
      useStreakFreeze,
      completeBonusChallenge,
      isBonusChallengeCompleted,
      getTotalXP,
      canCompleteMainChallenge,
      shouldShowCheckIn,
      getYesterdayDay,
      confirmYesterdayComplete,
      dismissCheckIn,
      updateReflection,
      deleteReflection,
      computeXPReward,
      dismissLevelUp,
    ],
  );
});
