import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Crown,
  Flame,
  Lock,
  Play,
  Quote as QuoteIcon,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import BonusChallengeCard from "@/components/BonusChallengeCard";
import ConfettiOverlay from "@/components/ConfettiOverlay";
import GlassCard from "@/components/GlassCard";
import PathNode from "@/components/PathNode";
import PressableScale from "@/components/PressableScale";
import TaskModal from "@/components/TaskModal";
import { ACCENT, FONT, GOLD_GRADIENT, PATH_THEME } from "@/constants/theme";
import { getChallengesForPath } from "@/data/challenges";
import { getDailyBonusChallenge } from "@/data/bonusChallenges";
import { getDailyQuote } from "@/data/quotes";
import { getWeekForDay, getWeekThemesForPath } from "@/data/weekThemes";
import { triggerHaptic } from "@/lib/haptics";
import { useProgress } from "@/providers/ProgressProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Challenge, FREE_DAYS, MILESTONES, Mood, NodeStatus } from "@/types";

const GREETINGS = ["Let's grow today", "Keep the momentum", "One step further", "You've got this"];
const getDailyGreeting = () => GREETINGS[new Date().getDay() % GREETINGS.length];

/** Days that trigger a confetti celebration when completed. */
const CELEBRATION_DAYS = new Set([1, 7, 14, 21, 30, 45, 60]);

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    progress,
    isLoaded,
    completeDay,
    completeBonusChallenge,
    isBonusChallengeCompleted,
    getTotalXP,
    canCompleteMainChallenge,
    useStreakFreeze,
    shouldShowCheckIn,
    confirmYesterdayComplete,
    dismissCheckIn,
  } = useProgress();
  const { isPro, maxDays } = useSubscription();

  const [selected, setSelected] = useState<Challenge | null>(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Track whether we should celebrate after the task modal finishes closing
  const pendingCelebration = useRef<boolean>(false);

  const path = progress.selectedPath;
  const theme = path ? PATH_THEME[path] : PATH_THEME.introvert;

  const challenges = useMemo(() => (path ? getChallengesForPath(path) : []), [path]);
  const currentChallenge = useMemo(
    () => challenges.find((c) => c.day === progress.currentDay) ?? null,
    [challenges, progress.currentDay],
  );
  const currentCompleted = currentChallenge ? progress.completedDays.includes(currentChallenge.day) : false;
  const totalXP = getTotalXP();
  const dailyQuote = useMemo(() => getDailyQuote(path), [path]);
  const dailyBonus = useMemo(() => getDailyBonusChallenge(path ?? undefined), [path]);
  const bonusDone = isBonusChallengeCompleted(dailyBonus.id);

  const nextMilestone = MILESTONES.find((m) => m > progress.completedDays.length) ?? 60;
  const progressPercent = progress.completedDays.length / nextMilestone;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const streakAtRisk = progress.lastCompletedDate === yesterdayStr && progress.streak > 0;

  const getNodeStatus = useCallback(
    (day: number): NodeStatus => {
      if (progress.completedDays.includes(day)) return "completed";
      if (day === progress.currentDay) return "current";
      if (!isPro && day > FREE_DAYS) return "pro-locked";
      return "locked";
    },
    [progress.completedDays, progress.currentDay, isPro],
  );

  const toggleWeek = (week: number): void => {
    triggerHaptic("light");
    setCollapsedWeeks((prev) => (prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]));
  };

  const challengesByWeek = useMemo(
    () =>
      getWeekThemesForPath(path ?? "introvert").map((w) => {
        const wChallenges = challenges.filter((c) => c.day >= w.startDay && c.day <= w.endDay);
        const completedCount = wChallenges.filter((c) => progress.completedDays.includes(c.day)).length;
        const isCompleted = wChallenges.length > 0 && completedCount === wChallenges.length;
        return { ...w, challenges: wChallenges, isCompleted, completedCount };
      }),
    [challenges, progress.completedDays],
  );

  // Stable callbacks
  const handleConfettiFinish = useCallback((): void => {
    setShowConfetti(false);
  }, []);

  /** Called from TaskModal after the dismiss animation finishes. */
  const handleModalClose = useCallback((): void => {
    const shouldCelebrate = pendingCelebration.current;
    pendingCelebration.current = false;
    setSelected(null);

    if (shouldCelebrate) {
      triggerHaptic("success");
      // Tiny delay so the sheet is fully gone before confetti fires
      setTimeout(() => {
        setShowConfetti(true);
      }, 100);
    }
  }, []);

  /** Called when the user completes a challenge from inside TaskModal. */
  const handleComplete = useCallback(
    (reflection: { text: string; mood: Mood }): void => {
      if (!selected) return;
      const day = selected.day;
      completeDay(day, reflection);

      if (CELEBRATION_DAYS.has(day)) {
        pendingCelebration.current = true;
      }
      // Note: we do NOT call setSelected(null) here.
      // TaskModal's handleComplete calls dismiss() which animates the sheet down,
      // then calls handleModalClose which sets selected to null and triggers confetti.
    },
    [selected, completeDay],
  );

  /** Called when the user completes the bonus challenge. */
  const handleBonusComplete = useCallback((): void => {
    completeBonusChallenge(dailyBonus.id);
    triggerHaptic("success");
    setShowConfetti(true);
  }, [completeBonusChallenge, dailyBonus.id]);

  if (!isLoaded || !path) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const currentWeek = getWeekForDay(progress.currentDay);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />

      {/* ── Header ── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left: greeting + path */}
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 13, marginBottom: 2 }}>
                {getDailyGreeting()}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 24 }}>
                  Day {progress.currentDay}
                </Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.color + "22" }}>
                  <Text style={{ color: theme.color, fontFamily: FONT.bold, fontSize: 11 }}>
                    {theme.label}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 1 }}>
                {progress.completedDays.length}/{maxDays} completed{!isPro ? " · Free" : ""}
              </Text>
            </View>

            {/* Right: XP + streak */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <LinearGradient
                colors={GOLD_GRADIENT}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 }}
              >
                <Zap size={13} color="#FFF" />
                <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>{totalXP}</Text>
              </LinearGradient>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: ACCENT.streak + "1A", borderWidth: 1, borderColor: ACCENT.streak + "44" }}>
                <Flame size={15} color={ACCENT.streak} />
                <Text style={{ color: ACCENT.streak, fontFamily: FONT.bold, fontSize: 13 }}>{progress.streak}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, gap: 10 }}>

          {/* ── Streak warning ── */}
          {streakAtRisk && (
            <GlassCard style={{ padding: 14 }} borderColor={ACCENT.streak + "44"}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT.streak + "1A", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={18} color={ACCENT.streak} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13 }}>
                    {progress.streak}-day streak at risk 🔥
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 1 }}>
                    Complete today's challenge to keep it alive
                  </Text>
                </View>
                {progress.streakFreezes > 0 && (
                  <PressableScale
                    onPress={() => useStreakFreeze()}
                    haptic="medium"
                    innerStyle={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: ACCENT.cyan + "66", backgroundColor: ACCENT.cyan + "11" }}
                  >
                    <Text style={{ color: ACCENT.cyan, fontFamily: FONT.bold, fontSize: 12 }}>❄ Freeze</Text>
                  </PressableScale>
                )}
              </View>
            </GlassCard>
          )}

          {/* ── Yesterday check-in ── */}
          {shouldShowCheckIn() && (
            <GlassCard style={{ padding: 14 }} borderColor={ACCENT.success + "44"}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT.success + "1A", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={18} color={ACCENT.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13 }}>
                    Did you do yesterday's challenge?
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 1 }}>
                    Confirm to keep your streak alive
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <PressableScale
                    onPress={() => { triggerHaptic("success"); confirmYesterdayComplete(); }}
                    haptic={false}
                    innerStyle={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: ACCENT.success + "22", borderWidth: 1, borderColor: ACCENT.success + "55" }}
                  >
                    <Text style={{ color: ACCENT.success, fontFamily: FONT.bold, fontSize: 12 }}>Yes</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={() => { triggerHaptic("light"); dismissCheckIn(); }}
                    haptic={false}
                    innerStyle={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.bold, fontSize: 12 }}>No</Text>
                  </PressableScale>
                </View>
              </View>
            </GlassCard>
          )}

          {/* ── Today's challenge card ── */}
          {progress.completedDays.length >= 60 ? (
            <GlassCard style={{ padding: 16 }} borderColor={ACCENT.milestone + "4D"}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <LinearGradient colors={GOLD_GRADIENT} style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                  <Trophy size={20} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>
                    Transformation Complete!
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                    You've conquered all 60 days. Legendary.
                  </Text>
                </View>
              </View>
            </GlassCard>
          ) : currentChallenge ? (
            <GlassCard style={{ padding: 16 }} borderColor={currentCompleted ? ACCENT.success + "4D" : theme.color + "3D"}>
              <PressableScale
                onPress={() => {
                  if (currentCompleted || !canCompleteMainChallenge()) return;
                  setSelected(currentChallenge);
                }}
                disabled={currentCompleted || !canCompleteMainChallenge()}
                haptic={currentCompleted || !canCompleteMainChallenge() ? false : "light"}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <LinearGradient colors={currentCompleted ? [ACCENT.success, ACCENT.success] : theme.gradient} style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                    {currentCompleted ? (
                      <CheckCircle size={20} color="#FFF" />
                    ) : (
                      <Text style={{ color: "#FFF", fontFamily: FONT.extrabold, fontSize: 16 }}>{currentChallenge.day}</Text>
                    )}
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }} numberOfLines={1}>
                        {currentChallenge.title}
                      </Text>
                      <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 11 }}>+{currentChallenge.xpReward} XP</Text>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {currentChallenge.description}
                    </Text>
                  </View>
                  {!currentCompleted && canCompleteMainChallenge() && (
                    <Play size={16} color={theme.color} />
                  )}
                </View>
              </PressableScale>
            </GlassCard>
          ) : null}

          {/* ── Daily quote ── */}
          <GlassCard style={{ padding: 0, overflow: "hidden" }}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 4, backgroundColor: theme.color + "88" }} />
              <View style={{ flex: 1, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <QuoteIcon size={14} color={theme.color} style={{ marginTop: 3, opacity: 0.7 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13, lineHeight: 20 }}>
                      {dailyQuote.text}
                    </Text>
                    <Text style={{ color: theme.color, fontFamily: FONT.bold, fontSize: 11, marginTop: 6, opacity: 0.8 }}>
                      — {dailyQuote.author}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* ── Milestone progress ── */}
          <GlassCard style={{ padding: 16 }} borderColor={theme.color + "22"}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: ACCENT.milestone + "22", alignItems: "center", justifyContent: "center" }}>
                  <Trophy size={15} color={ACCENT.milestone} />
                </View>
                <View>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>
                    Next milestone
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11 }}>
                    {nextMilestone - progress.completedDays.length} days to go
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: ACCENT.milestone, fontFamily: FONT.extrabold, fontSize: 20 }}>
                  {progress.completedDays.length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11 }}>
                  of {nextMilestone}
                </Text>
              </View>
            </View>
            <AnimatedProgressBar progress={progressPercent} color={theme.color} trackColor={colors.secondary} height={7} />
          </GlassCard>

          {/* ── Bonus challenge ── */}
          <BonusChallengeCard
            challenge={dailyBonus}
            isCompleted={bonusDone}
            pathType={path}
            onComplete={handleBonusComplete}
          />

          {/* ── Free user upgrade banner ── */}
          {!isPro && (
            <PressableScale onPress={() => router.push("/paywall")} haptic="medium">
              <LinearGradient
                colors={[ACCENT.milestone + "22", ACCENT.speaking + "11"]}
                style={{ borderRadius: 16, borderWidth: 1, borderColor: ACCENT.milestone + "44", padding: 16 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT.milestone + "33", alignItems: "center", justifyContent: "center" }}>
                      <Lock size={18} color={ACCENT.milestone} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>
                          Unlock Days 16–60
                        </Text>
                        <Crown size={13} color={ACCENT.milestone} />
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                        {Math.min(progress.completedDays.length, 15)}/15 free days used
                      </Text>
                    </View>
                  </View>
                  <LinearGradient colors={GOLD_GRADIENT} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}>
                    <Sparkles size={13} color="#FFF" />
                    <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>Go Pro</Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </PressableScale>
          )}
        </View>

        {/* ── Week sections ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
          {challengesByWeek.map((week) => {
            const collapsed = collapsedWeeks.includes(week.week);
            const isCurrentWeek = currentWeek?.week === week.week;

            return (
              <View key={week.week}>
                {/* Week header */}
                <PressableScale
                  onPress={() => week.isCompleted && toggleWeek(week.week)}
                  innerStyle={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: 14,
                    backgroundColor: isCurrentWeek && !week.isCompleted
                      ? theme.color + "14"
                      : week.isCompleted
                        ? ACCENT.milestone + "11"
                        : colors.card,
                    borderWidth: 1,
                    borderColor: isCurrentWeek && !week.isCompleted
                      ? theme.color + "55"
                      : week.isCompleted
                        ? ACCENT.milestone + "44"
                        : colors.glassBorder,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                      borderRadius: 7,
                      backgroundColor: week.isCompleted
                        ? ACCENT.milestone + "26"
                        : isCurrentWeek
                          ? theme.color + "26"
                          : colors.secondary,
                    }}>
                      <Text style={{
                        color: week.isCompleted ? ACCENT.milestone : isCurrentWeek ? theme.color : colors.mutedForeground,
                        fontFamily: FONT.bold,
                        fontSize: 10,
                      }}>
                        WK {week.week}
                      </Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{
                          color: week.isCompleted ? ACCENT.milestone : isCurrentWeek ? colors.foreground : colors.mutedForeground,
                          fontFamily: FONT.bold,
                          fontSize: 13,
                        }}>
                          {week.name || `Week ${week.week}`}
                        </Text>
                        {isCurrentWeek && !week.isCompleted && (
                          <View style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 5,
                            backgroundColor: theme.color + "22",
                            borderWidth: 1,
                            borderColor: theme.color + "44",
                          }}>
                            <Text style={{ color: theme.color, fontFamily: FONT.bold, fontSize: 9 }}>
                              CURRENT
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, marginTop: 1 }}>
                        {week.completedCount}/{week.challenges.length} days
                      </Text>
                    </View>
                  </View>
                  {week.isCompleted && (
                    <ChevronDown
                      size={16}
                      color={ACCENT.milestone}
                      style={{ transform: [{ rotate: collapsed ? "0deg" : "180deg" }] }}
                    />
                  )}
                </PressableScale>

                {/* Day nodes */}
                {!collapsed && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start", paddingHorizontal: 2 }}>
                    {week.challenges.map((c) => (
                      <PathNode
                        key={c.id}
                        day={c.day}
                        status={getNodeStatus(c.day)}
                        isMilestone={MILESTONES.includes(c.day as (typeof MILESTONES)[number])}
                        pathType={path}
                        challenge={c}
                        onPress={() => setSelected(c)}
                        onProLockedPress={() => router.push("/paywall")}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TaskModal
        challenge={selected}
        visible={!!selected}
        isCompleted={selected ? progress.completedDays.includes(selected.day) : false}
        canComplete={canCompleteMainChallenge()}
        pathType={path}
        onClose={handleModalClose}
        onComplete={handleComplete}
      />

      {/* Dismiss-only close (when user drags down or taps backdrop without completing) */}
      {/* We expose a separate onClose for the non-complete dismiss, but handleModalClose handles both cases.
          The pending celebration flag distinguishes between them. */}

      <ConfettiOverlay visible={showConfetti} onFinish={handleConfettiFinish} />
    </View>
  );
}
