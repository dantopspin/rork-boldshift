import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PROGRESS,
  DifficultyPreference,
  Mood,
  PathType,
  SocialFear,
  SocialGoal,
  UserProgress,
} from "@/types";
import { getUnlockedAchievements } from "@/data/achievements";
import { getChallengesForPath } from "@/data/challenges";

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

export const [ProgressProvider, useProgress] = createContextHook(() => {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

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
          const prunedBonuses = (parsed.completedBonusChallenges ?? []).filter((key) => {
            const datePart = key.split("_").pop();
            return datePart !== undefined && datePart >= cutoffStr;
          });
          setProgress({
            ...DEFAULT_PROGRESS,
            ...parsed,
            streakFreezes: parsed.streakFreezes ?? 2,
            unlockedAchievements: parsed.unlockedAchievements ?? [],
            completedBonusChallenges: prunedBonuses,
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
      const today = todayStr();
      setProgress((prev) => {
        if (prev.completedDays.includes(day)) return prev;
        const yStr = yesterdayStr();
        let newStreak: number;
        if (prev.lastCompletedDate === yStr) {
          newStreak = prev.streak + 1;
        } else if (prev.lastCompletedDate === today) {
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
          ? { ...prev.reflections, [day]: { ...reflection, timestamp: new Date().toISOString() } }
          : prev.reflections;
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
        };
        return { ...updated, unlockedAchievements: checkAchievements(updated) };
      });
    },
    [checkAchievements],
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

  const getTotalXP = useCallback((): number => {
    const challenges = progress.selectedPath ? getChallengesForPath(progress.selectedPath) : [];
    const mainXP = progress.completedDays.reduce((acc, day) => {
      const challenge = challenges.find((c) => c.day === day);
      return acc + (challenge?.xpReward ?? 10);
    }, 0);
    const bonusXP = progress.completedBonusChallenges.length * 5;
    return mainXP + bonusXP;
  }, [progress.selectedPath, progress.completedDays, progress.completedBonusChallenges.length]);

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
      // Recalculate streak: yesterday was completed, today is now the continuation point
      const newStreak = prev.lastCompletedDate === yStr
        ? prev.streak + 1
        : 1;
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