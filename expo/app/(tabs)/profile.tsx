import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  Award,
  Bell,
  ChevronRight,
  Crown,
  FileText,
  MessageCircle,
  Mic,
  Moon,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GlassCard from "@/components/GlassCard";
import PressableScale from "@/components/PressableScale";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import { ACCENT, FONT, GOLD_GRADIENT, PATH_THEME } from "@/constants/theme";
import { getCurrentLevel, getNextLevel, getProgressToNextLevel } from "@/data/xpLevels";
import { triggerHaptic } from "@/lib/haptics";
import { useProgress } from "@/providers/ProgressProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { PathType } from "@/types";

const PATH_ICON: Record<PathType, typeof MessageCircle> = {
  introvert: MessageCircle,
  speaking: Mic,
  assertiveness: Shield,
};

export default function Profile() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { progress, resetProgress, switchPath, getTotalXP } = useProgress();
  const { isPro, tier, setShowPaywall } = useSubscription();
  const [switching, setSwitching] = useState<boolean>(false);
  const [notificationsOn, setNotificationsOn] = useState<boolean>(true);

  const DAILY_REMINDER_ID = "boldshift-daily-reminder";

  const scheduleReminder = useCallback(async (): Promise<void> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    // Cancel any existing before re-scheduling to avoid duplicates
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: "Time for your daily challenge",
        body: "One small step today keeps your BoldShift streak alive.",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  }, []);

  const cancelReminder = useCallback(async (): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  }, []);

  // Sync toggle with actual scheduled state & permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        setNotificationsOn(false);
        return;
      }
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const hasReminder = scheduled.some((n) => n.identifier === DAILY_REMINDER_ID);
      setNotificationsOn(hasReminder);
    })().catch(() => {});
  }, []);

  const toggleNotifications = async (): Promise<void> => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    triggerHaptic("light");
    if (next) {
      await scheduleReminder();
    } else {
      await cancelReminder();
    }
  };

  const currentPath = progress.selectedPath ?? "introvert";
  const CurrentIcon = PATH_ICON[currentPath];
  const theme = PATH_THEME[currentPath];
  const totalXP = getTotalXP();
  const level = getCurrentLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const levelProgress = getProgressToNextLevel(totalXP) / 100;
  const otherPaths = (["introvert", "speaking", "assertiveness"] as PathType[]).filter((p) => p !== currentPath);

  const confirmReset = (): void => {
    Alert.alert(
      "Reset Progress?",
      "This will permanently delete all your progress, including completed days, streaks, and reflections. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("warning");
            await resetProgress();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  const handleSwitchPath = (): void => {
    if (!isPro) {
      setShowPaywall(true);
      router.push("/paywall");
      return;
    }
    Alert.alert("Choose a Path", "This will permanently delete your current 60-day progress and cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      ...otherPaths.map((p) => ({
        text: PATH_THEME[p].label,
        onPress: () => {
          triggerHaptic("medium");
          setSwitching(true);
          setTimeout(() => {
            switchPath(p);
            setSwitching(false);
            router.replace("/(tabs)/journey");
          }, 600);
        },
      })),
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />

      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CurrentIcon size={18} color={theme.color} />
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 20 }}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <GlassCard style={{ padding: 0, overflow: "hidden" }} elevated borderColor={theme.color + "44"}>
            {/* Gradient strip at top */}
            <LinearGradient
              colors={[theme.color + "33", theme.color + "08"]}
              style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
            >
              {/* Path identity row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <LinearGradient
                  colors={theme.gradient}
                  style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
                >
                  <CurrentIcon size={24} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginBottom: 2 }}>
                    Current path
                  </Text>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 17 }}>
                    {theme.label}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>
                    {theme.tagline}
                  </Text>
                </View>
              </View>

              {/* XP / level row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={14} color={ACCENT.milestone} />
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13 }}>{level.name}</Text>
                </View>
                <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 13 }}>{totalXP} XP</Text>
              </View>
              <AnimatedProgressBar progress={levelProgress} color={ACCENT.milestone} trackColor={colors.secondary} height={7} />
              {nextLevel && (
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, marginTop: 6 }}>
                  {nextLevel.minXP - totalXP} XP to {nextLevel.name}
                </Text>
              )}
            </LinearGradient>

            {/* 4-stat grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: colors.border }}>
              {[
                { label: "Days done", value: `${progress.completedDays.length}/60`, color: theme.color },
                { label: "Streak", value: `${progress.streak}d`, color: ACCENT.streak },
                { label: "Best streak", value: `${progress.longestStreak}d`, color: colors.foreground },
                { label: "Badges", value: `${progress.unlockedAchievements.length}`, color: ACCENT.milestone },
              ].map((stat, i) => (
                <View
                  key={stat.label}
                  style={{
                    width: "50%",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRightWidth: i % 2 === 0 ? 1 : 0,
                    borderBottomWidth: i < 2 ? 1 : 0,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: stat.color, fontFamily: FONT.extrabold, fontSize: 20 }}>{stat.value}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* ── Subscription ── */}
        <SectionLabel label="Subscription" colors={colors} />
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <GlassCard style={{ padding: 16 }} elevated={isPro} borderColor={isPro ? ACCENT.milestone + "4D" : undefined}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: isPro ? "transparent" : colors.secondary }}>
                  {isPro ? (
                    <LinearGradient colors={[ACCENT.milestone, ACCENT.speaking]} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                      <Crown size={18} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <Crown size={18} color={colors.mutedForeground} />
                  )}
                </View>
                <View>
                  <Text style={{ color: isPro ? ACCENT.milestone : colors.foreground, fontFamily: FONT.bold, fontSize: 15 }}>
                    {isPro ? "BoldShift Pro" : "Free Plan"}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>
                    {isPro
                      ? tier === "pro_weekly" ? "Billed weekly" : "Billed monthly"
                      : "Days 1–15 unlocked"}
                  </Text>
                </View>
              </View>
              {!isPro && (
                <PressableScale onPress={() => router.push("/paywall")} haptic="medium">
                  <LinearGradient colors={GOLD_GRADIENT} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}>
                    <Sparkles size={13} color="#FFF" />
                    <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>Upgrade</Text>
                  </LinearGradient>
                </PressableScale>
              )}
            </View>
          </GlassCard>
        </View>

        {/* ── Settings ── */}
        <SectionLabel label="Settings" colors={colors} />
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <GlassCard style={{ padding: 0 }}>
            {/* Dark mode */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isDark ? colors.secondary : ACCENT.milestone + "22", alignItems: "center", justifyContent: "center" }}>
                  {isDark
                    ? <Moon size={16} color={colors.mutedForeground} />
                    : <Sun size={16} color={ACCENT.milestone} />}
                </View>
                <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => { triggerHaptic("light"); toggleTheme(); }}
                trackColor={{ true: colors.primary, false: colors.muted }}
                thumbColor="#FFF"
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

            {/* Notifications */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                  <Bell size={16} color={colors.mutedForeground} />
                </View>
                <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Notifications</Text>
              </View>
              <Switch
                value={notificationsOn}
                onValueChange={toggleNotifications}
                trackColor={{ true: colors.primary, false: colors.muted }}
                thumbColor="#FFF"
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />

            {/* Switch path */}
            <PressableScale
              onPress={handleSwitchPath}
              innerStyle={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.color + "22", alignItems: "center", justifyContent: "center" }}>
                  <RefreshCw size={16} color={theme.color} />
                </View>
                <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Switch Path</Text>
                {!isPro && <Crown size={13} color={ACCENT.milestone} />}
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </PressableScale>
          </GlassCard>
        </View>

        {/* ── Danger zone ── */}
        <SectionLabel label="Danger Zone" colors={colors} />
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <GlassCard style={{ padding: 0 }} borderColor={colors.destructive + "33"}>
            <PressableScale
              onPress={confirmReset}
              haptic="warning"
              innerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.destructive + "1A", alignItems: "center", justifyContent: "center" }}>
                <RotateCcw size={16} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.destructive, fontFamily: FONT.bold, fontSize: 14 }}>Reset Progress</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 1 }}>
                  Permanently deletes all data
                </Text>
              </View>
              <ChevronRight size={18} color={colors.destructive + "88"} />
            </PressableScale>
          </GlassCard>
        </View>

        {/* ── Legal ── */}
        <SectionLabel label="Legal" colors={colors} />
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <GlassCard style={{ padding: 0 }}>
            <PressableScale onPress={() => router.push("/privacy")} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                <FileText size={16} color={colors.mutedForeground} />
              </View>
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14, flex: 1 }}>Privacy Policy</Text>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </PressableScale>
            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
            <PressableScale onPress={() => router.push("/terms")} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                <FileText size={16} color={colors.mutedForeground} />
              </View>
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14, flex: 1 }}>Terms of Service</Text>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </PressableScale>
            <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
            <PressableScale onPress={() => Linking.openURL("mailto:taskalidaniyal@gmail.com")} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={16} color={colors.mutedForeground} />
              </View>
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14, flex: 1 }}>Contact Support</Text>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </PressableScale>
          </GlassCard>
        </View>

        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textAlign: "center", marginTop: 8, marginBottom: 4, paddingHorizontal: 20 }}>
          BoldShift · Local-first. Your data stays on your device.
        </Text>

        {/* Path-switching overlay */}
        {switching && (
          <View style={{ position: "absolute", inset: 0, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <LinearGradient colors={theme.gradient} style={{ width: 100, height: 100, borderRadius: 28, alignItems: "center", justifyContent: "center" }}>
              <Award size={48} color="#FFF" />
            </LinearGradient>
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 18 }}>Switching path…</Text>
            <ActivityIndicator size="small" color={theme.color} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={{
      color: colors.mutedForeground,
      fontFamily: FONT.bold,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      paddingHorizontal: 20,
      marginBottom: 8,
      marginTop: 20,
    }}>
      {label}
    </Text>
  );
}