import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PROGRESS,
  DifficultyPreference,
  FREE_DAYS,
  Mood,
  PathType,
  SocialFear,
  SocialGoal,
  TOTAL_DAYS,
  UserProgress,
} from "@/types";
import { getUnlockedAchievements } from "@/data/achievements";
import { useSubscription } from "@/providers/SubscriptionProvider";

const STORAGE_KEY = "boldshift_progress";
const FLAGS_KEY = "boldshift_flags";

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const yesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const [ProgressProvider, useProgress] = createContextHook(() => {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { isPro } = useSubscription();

  // Load persisted progress
  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserProgress>;
          setProgress({
            ...DEFAULT_PROGRESS,
            ...parsed,
            streakFreezes: parsed.streakFreezes ?? 2,
            unlockedAchievements: parsed.unlockedAchievements ?? [],
            completedBonusChallenges: parsed.completedBonusChallenges ?? [],
            reflections: parsed.reflections ?? {},
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

  // Persist on change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch((e) =>
        console.error("Failed to save progress", e),
      );
    }
  }, [progress, isLoaded]);

  // Monthly streak-freeze reset — pro users get advanced protection (5 freezes/mo)
  useEffect(() => {
    if (!isLoaded) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (progress.lastFreezeReset !== currentMonth) {
      const freezeCount = isPro ? 5 : 2;
      setProgress((prev) => ({ ...prev, streakFreezes: freezeCount, lastFreezeReset: currentMonth }));
    }
  }, [isLoaded, progress.lastFreezeReset, isPro]);

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

  const selectPath = useCallback(
    (
      path: PathType,
      preference?: DifficultyPreference | null,
      fear?: SocialFear | null,
      goal?: SocialGoal | null,
    ): void => {
      setProgress((prev) => ({
        ...prev,
        selectedPath: path,
        startDate: new Date().toISOString(),
        difficultyPreference: preference ?? null,
        socialFear: fear ?? null,
        socialGoal: goal ?? null,
      }));
    },
    [],
  );

  const canCompleteMainChallenge = useCallback(
    (): boolean => progress.lastMainChallengeDate !== todayStr(),
    [progress.lastMainChallengeDate],
  );

  const completeDay = useCallback(
    (day: number, reflection?: { text: string; mood: Mood }): void => {
      const maxAllowed = isPro ? TOTAL_DAYS : FREE_DAYS;
      if (day > maxAllowed) return;
      const today = todayStr();
      setProgress((prev) => {
        if (prev.completedDays.includes(day)) return prev;
        const yStr = yesterdayStr();
        let newStreak: number;
        if (prev.lastCompletedDate === yStr || prev.lastCompletedDate === today) {
          newStreak = prev.streak + 1;
        } else {
          newStreak = 1;
        }
        const newCompletedDays = [...prev.completedDays, day].sort((a, b) => a - b);
        const nextIncompleteDay =
          Array.from({ length: maxAllowed }, (_, i) => i + 1).find((d) => !newCompletedDays.includes(d)) ?? maxAllowed;
        const newReflections = reflection
          ? { ...prev.reflections, [day]: { ...reflection, timestamp: new Date().toISOString() } }
          : prev.reflections;
        const updated: UserProgress = {
          ...prev,
          completedDays: newCompletedDays,
          currentDay: Math.max(Math.min(nextIncompleteDay, maxAllowed), prev.currentDay),
          streak: newStreak,
          longestStreak: Math.max(newStreak, prev.longestStreak),
          lastCompletedDate: today,
          lastMainChallengeDate: today,
          reflections: newReflections,
        };
        return { ...updated, unlockedAchievements: checkAchievements(updated) };
      });
    },
    [checkAchievements, isPro],
  );

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
      return { ...prev, completedBonusChallenges: [...prev.completedBonusChallenges, key] };
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

  const switchPath = useCallback((newPath: PathType): void => {
    setProgress((prev) => ({
      ...DEFAULT_PROGRESS,
      streakFreezes: prev.streakFreezes,
      lastFreezeReset: prev.lastFreezeReset,
      selectedPath: newPath,
      startDate: new Date().toISOString(),
    }));
  }, []);

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

  const getTotalXP = useCallback(
    (): number => progress.completedDays.length * 10 + progress.completedBonusChallenges.length * 5,
    [progress.completedDays.length, progress.completedBonusChallenges.length],
  );

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
    const yesterdayDay = getYesterdayDay();
    setProgress((prev) => {
      const newCompletedDays = prev.completedDays.includes(yesterdayDay)
        ? prev.completedDays
        : [...prev.completedDays, yesterdayDay].sort((a, b) => a - b);
      const nextIncompleteDay =
        Array.from({ length: 60 }, (_, i) => i + 1).find((d) => !newCompletedDays.includes(d)) ?? 60;
      const updated: UserProgress = {
        ...prev,
        completedDays: newCompletedDays,
        currentDay: Math.max(nextIncompleteDay, prev.currentDay),
        lastCompletedDate: today,
        checkInDismissedDate: today,
        lastVisitDate: today,
      };
      return { ...updated, unlockedAchievements: checkAchievements(updated) };
    });
  }, [getYesterdayDay, checkAchievements]);

  const dismissCheckIn = useCallback((): void => {
    const today = todayStr();
    setProgress((prev) => ({ ...prev, streak: 0, checkInDismissedDate: today, lastVisitDate: today }));
  }, []);

  return useMemo(
    () => ({
      progress,
      isLoaded,
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
    }),
    [
      progress,
      isLoaded,
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
    ],
  );
});
