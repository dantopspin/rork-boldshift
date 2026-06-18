import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Crown,
  Flame,
  Lock,
  Quote as QuoteIcon,
  Sparkles,
  Trophy,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import BonusChallengeCard from "@/components/BonusChallengeCard";
import GlassCard from "@/components/GlassCard";
import PathNode from "@/components/PathNode";
import PressableScale from "@/components/PressableScale";
import TaskModal from "@/components/TaskModal";
import { ACCENT, FONT, GOLD_GRADIENT, PATH_THEME } from "@/constants/theme";
import { getChallengesForPath } from "@/data/challenges";
import { getDailyBonusChallenge } from "@/data/bonusChallenges";
import { getDailyQuote } from "@/data/quotes";
import { getCurrentLevel } from "@/data/xpLevels";
import { getWeekForDay, WEEK_THEMES } from "@/data/weekThemes";
import { triggerHaptic } from "@/lib/haptics";
import { useProgress } from "@/providers/ProgressProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Challenge, FREE_DAYS, MILESTONES, Mood, NodeStatus } from "@/types";

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

  const path = progress.selectedPath;
  const theme = path ? PATH_THEME[path] : PATH_THEME.introvert;

  const challenges = useMemo(() => (path ? getChallengesForPath(path) : []), [path]);
  const totalXP = getTotalXP();
  const currentLevel = getCurrentLevel(totalXP);
  const dailyQuote = useMemo(() => getDailyQuote(path), [path]);
  const dailyBonus = useMemo(() => getDailyBonusChallenge(), []);
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
      WEEK_THEMES.map((w) => {
        const wChallenges = challenges.filter((c) => c.day >= w.startDay && c.day <= w.endDay);
        const isCompleted = wChallenges.every((c) => progress.completedDays.includes(c.day));
        return { ...w, challenges: wChallenges, isCompleted };
      }),
    [challenges, progress.completedDays],
  );

  if (!isLoaded || !path) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const handleComplete = (reflection: { text: string; mood: Mood }): void => {
    if (selected) {
      completeDay(selected.day, reflection);
      setSelected(null);
    }
  };

  const currentWeek = getWeekForDay(progress.currentDay);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />

      {/* Sticky header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 26 }}>Day {progress.currentDay}</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 13 }}>
                {progress.completedDays.length}/{maxDays} completed{!isPro ? " (Free)" : ""}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LinearGradient colors={GOLD_GRADIENT} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 }}>
                <Sparkles size={15} color="#FFF" />
                <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>{totalXP}</Text>
              </LinearGradient>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.glassBorder }}>
                <Flame size={18} color={ACCENT.streak} />
                <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>{progress.streak}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 110, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {/* Yesterday check-in */}
          {shouldShowCheckIn() && (
            <GlassCard style={{ padding: 14 }} borderColor={ACCENT.success + "44"}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <CheckCircle size={20} color={ACCENT.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13 }}>
                    Did you complete yesterday's challenge?
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                    Confirm to keep your streak alive
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <PressableScale
                    onPress={() => { triggerHaptic("success"); confirmYesterdayComplete(); }}
                    haptic={false}
                    innerStyle={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: ACCENT.success + "22", borderWidth: 1, borderColor: ACCENT.success + "66" }}
                  >
                    <Text style={{ color: ACCENT.success, fontFamily: FONT.bold, fontSize: 12 }}>Yes</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={() => { triggerHaptic("light"); dismissCheckIn(); }}
                    haptic={false}
                    innerStyle={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.bold, fontSize: 12 }}>No</Text>
                  </PressableScale>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Streak warning */}
          {streakAtRisk && (
            <GlassCard style={{ padding: 14 }} borderColor={ACCENT.streak + "33"}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <AlertTriangle size={20} color={ACCENT.streak} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13 }}>
                    Don't break your {progress.streak}-day streak! 🔥
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                    One small action today keeps it alive
                  </Text>
                </View>
                {progress.streakFreezes > 0 && (
                  <PressableScale
                    onPress={() => {
                      useStreakFreeze();
                    }}
                    haptic="medium"
                    innerStyle={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: ACCENT.cyan + "88" }}
                  >
                    <Text style={{ color: ACCENT.cyan, fontFamily: FONT.bold, fontSize: 12 }}>❄ Freeze</Text>
                  </PressableScale>
                )}
              </View>
            </GlassCard>
          )}

          {/* Daily quote */}
          <GlassCard style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <QuoteIcon size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontFamily: FONT.regular, fontSize: 14, fontStyle: "italic", lineHeight: 21 }}>
                  "{dailyQuote.text}"
                </Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12, marginTop: 6 }}>— {dailyQuote.author}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Bonus challenge */}
          <BonusChallengeCard challenge={dailyBonus} isCompleted={bonusDone} pathType={path} onComplete={() => completeBonusChallenge(dailyBonus.id)} />

          {/* Milestone progress */}
          <GlassCard style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Trophy size={16} color={ACCENT.milestone} />
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 13 }}>Next milestone</Text>
              </View>
              <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 13 }}>Day {nextMilestone}</Text>
            </View>
            <AnimatedProgressBar progress={progressPercent} color={theme.color} trackColor={colors.secondary} />
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 8 }}>
              {nextMilestone - progress.completedDays.length} days to go!
            </Text>
          </GlassCard>

          {/* Free user banner */}
          {!isPro && (
            <PressableScale onPress={() => router.push("/paywall")} haptic="medium">
              <GlassCard style={{ padding: 16 }} borderColor={ACCENT.milestone + "33"}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <LinearGradient colors={[ACCENT.milestone, ACCENT.speaking]} style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                      <Lock size={18} color="#FFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Days 16–60</Text>
                        <Crown size={14} color={ACCENT.milestone} />
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                        {Math.min(progress.completedDays.length, 15)}/15 free days used
                      </Text>
                    </View>
                  </View>
                  <LinearGradient colors={GOLD_GRADIENT} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}>
                    <Sparkles size={14} color="#FFF" />
                    <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>Unlock</Text>
                  </LinearGradient>
                </View>
              </GlassCard>
            </PressableScale>
          )}
        </View>

        {/* Weeks + nodes */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          {challengesByWeek.map((week) => {
            const collapsed = collapsedWeeks.includes(week.week);
            const isCurrentWeek = currentWeek?.week === week.week;
            return (
              <View key={week.week} style={{ marginBottom: 18 }}>
                <PressableScale
                  onPress={() => week.isCompleted && toggleWeek(week.week)}
                  innerStyle={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: isCurrentWeek && !week.isCompleted ? theme.color + "80" : colors.glassBorder,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: week.isCompleted ? ACCENT.milestone + "26" : isCurrentWeek ? theme.color + "26" : colors.secondary,
                      }}
                    >
                      <Text style={{ color: week.isCompleted ? ACCENT.milestone : isCurrentWeek ? theme.color : colors.mutedForeground, fontFamily: FONT.bold, fontSize: 11 }}>
                        Week {week.week}
                      </Text>
                    </View>
                    <Text style={{ color: week.isCompleted ? ACCENT.milestone : isCurrentWeek ? colors.foreground : colors.mutedForeground, fontFamily: FONT.medium, fontSize: 14 }}>
                      {week.name}
                    </Text>
                  </View>
                  {week.isCompleted && <ChevronDown size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: collapsed ? "0deg" : "180deg" }] }} />}
                </PressableScale>

                {!collapsed && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start" }}>
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
        onClose={() => setSelected(null)}
        onComplete={handleComplete}
      />
    </View>
  );
}