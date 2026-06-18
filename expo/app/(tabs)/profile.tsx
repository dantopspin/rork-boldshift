import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Award,
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
import React, { useState } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import GlassCard from "@/components/GlassCard";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, GOLD_GRADIENT, PATH_THEME } from "@/constants/theme";
import { getCurrentLevel, getNextLevel, getProgressToNextLevel } from "@/data/xpLevels";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
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
    Alert.alert("Choose a Path", "Switching paths will reset your current progress.", [
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
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CurrentIcon size={18} color={theme.color} />
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 20 }}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Subscription */}
        <GlassCard style={{ padding: 16 }} elevated borderColor={isPro ? ACCENT.milestone + "4D" : undefined}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isPro ? "transparent" : colors.secondary, overflow: "hidden" }}>
                {isPro ? (
                  <LinearGradient colors={[ACCENT.milestone, ACCENT.speaking]} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                    <Crown size={20} color="#FFF" />
                  </LinearGradient>
                ) : (
                  <Crown size={20} color={colors.mutedForeground} />
                )}
              </View>
              <View>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>Subscription</Text>
                <Text style={{ color: isPro ? ACCENT.milestone : colors.foreground, fontFamily: FONT.bold, fontSize: 15 }}>
                  {isPro ? `BoldShift Pro${tier === "pro_weekly" ? " · Weekly" : " · Monthly"}` : "Free Plan"}
                </Text>
              </View>
            </View>
            {!isPro && (
              <PressableScale onPress={() => router.push("/paywall")} haptic="medium">
                <LinearGradient colors={GOLD_GRADIENT} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}>
                  <Sparkles size={14} color="#FFF" />
                  <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 13 }}>Upgrade</Text>
                </LinearGradient>
              </PressableScale>
            )}
          </View>
        </GlassCard>

        {/* XP / Level */}
        <GlassCard style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color={ACCENT.success} />
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Level: {level.name}</Text>
            <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 13, marginLeft: "auto" }}>{totalXP} XP</Text>
          </View>
          <AnimatedProgressBar progress={levelProgress} color={ACCENT.milestone} trackColor={colors.secondary} height={8} />
          {nextLevel && (
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 8 }}>
              {nextLevel.minXP - totalXP} XP to {nextLevel.name}
            </Text>
          )}
        </GlassCard>

        {/* Journey stats */}
        <GlassCard style={{ padding: 16 }}>
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14, marginBottom: 12 }}>Your Journey</Text>
          <StatRow label="Days completed" value={`${progress.completedDays.length}/60`} color={colors.foreground} />
          <StatRow label="Current streak" value={`${progress.streak} days`} color={ACCENT.streak} />
          <StatRow label="Longest streak" value={`${progress.longestStreak} days`} color={colors.foreground} />
          <StatRow label="Streak freezes" value={`${progress.streakFreezes} left`} color={ACCENT.cyan} />
          <StatRow label="Badges earned" value={`${progress.unlockedAchievements.length}`} color={ACCENT.milestone} last />
        </GlassCard>

        {/* Settings */}
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.bold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20 }}>Settings</Text>
        <GlassCard style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {isDark ? <Moon size={18} color={colors.mutedForeground} /> : <Sun size={18} color={ACCENT.milestone} />}
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                triggerHaptic("light");
                toggleTheme();
              }}
              trackColor={{ true: colors.primary, false: colors.muted }}
              thumbColor="#FFF"
            />
          </View>
        </GlassCard>

        {/* Journey actions */}
        <GlassCard style={{ padding: 16 }}>
          <PressableScale
            onPress={handleSwitchPath}
            innerStyle={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <RefreshCw size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Switch Path</Text>
              {!isPro && <Crown size={14} color={ACCENT.milestone} />}
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </PressableScale>
        </GlassCard>

        {/* Reset — isolated to signal its destructive weight */}
        <GlassCard style={{ padding: 16 }}>
          <PressableScale onPress={confirmReset} haptic="warning" innerStyle={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
            <RotateCcw size={18} color={colors.destructive} />
            <Text style={{ color: colors.destructive, fontFamily: FONT.medium, fontSize: 14 }}>Reset Progress</Text>
          </PressableScale>
        </GlassCard>

        {/* Legal */}
        <GlassCard style={{ padding: 16, gap: 6 }}>
          <PressableScale onPress={() => router.push("/privacy")} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
            <FileText size={18} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Privacy Policy</Text>
          </PressableScale>
          <PressableScale onPress={() => router.push("/terms")} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
            <FileText size={18} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14 }}>Terms of Service</Text>
          </PressableScale>
        </GlassCard>

        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textAlign: "center", marginTop: 4 }}>
          BoldShift · Local-first. Your data stays on your device.
        </Text>

        {switching && (
          <View style={{ position: "absolute", inset: 0, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <LinearGradient colors={theme.gradient} style={{ width: 100, height: 100, borderRadius: 28, alignItems: "center", justifyContent: "center" }}>
              <Award size={48} color="#FFF" />
            </LinearGradient>
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 18 }}>Switching path…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatRow({ label, value, color, last }: { label: string; value: string; color: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14 }}>{label}</Text>
      <Text style={{ color, fontFamily: FONT.bold, fontSize: 14 }}>{value}</Text>
    </View>
  );
}