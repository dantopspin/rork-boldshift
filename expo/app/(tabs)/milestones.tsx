import { LinearGradient } from "expo-linear-gradient";
import { Award, Flame, Lock, Target, Trophy } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AchievementIconView from "@/components/AchievementIconView";
import GlassCard from "@/components/GlassCard";
import StreakCalendar from "@/components/StreakCalendar";
import { ACCENT, FONT, GOLD_GRADIENT } from "@/constants/theme";
import { ACHIEVEMENTS, getLockedAchievements, getUnlockedAchievements } from "@/data/achievements";
import { useProgress } from "@/providers/ProgressProvider";
import { useTheme } from "@/providers/ThemeProvider";

const MILESTONE_DATA = [
  { day: 15, title: "First Steps", description: "You've built the foundation!" },
  { day: 30, title: "Halfway Hero", description: "You're unstoppable now!" },
  { day: 45, title: "Almost There", description: "Just 15 days left — finish strong!" },
  { day: 60, title: "Transformation Complete", description: "You did it! A new you!" },
];

export default function Milestones() {
  const { colors } = useTheme();
  const { progress, isLoaded } = useProgress();

  const completedCount = progress.completedDays.length;
  const ap = {
    completedDays: progress.completedDays,
    streak: progress.streak,
    longestStreak: progress.longestStreak,
    totalDaysCompleted: completedCount,
  };

  const unlocked = useMemo(() => getUnlockedAchievements(ap), [completedCount, progress.longestStreak, progress.streak]);
  const locked = useMemo(() => getLockedAchievements(ap), [completedCount, progress.longestStreak, progress.streak]);

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 20 }}>Milestones</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>Your journey achievements</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard icon={<Flame size={18} color={ACCENT.streak} />} value={progress.streak} label="Streak" color={ACCENT.streak} />
          <StatCard icon={<Target size={18} color={ACCENT.success} />} value={completedCount} label="Days" color={ACCENT.success} />
          <StatCard icon={<Award size={18} color={ACCENT.milestone} />} value={unlocked.length} label="Badges" color={ACCENT.milestone} />
        </View>

        <StreakCalendar streak={progress.streak} longestStreak={progress.longestStreak} pathType={progress.selectedPath} completedDates={progress.completedDates} />

        {/* Achievements */}
        <GlassCard style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Award size={16} color={ACCENT.milestone} />
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>
              Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {unlocked.map((a) => (
              <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: ACCENT.success + "12", borderWidth: 1, borderColor: ACCENT.success + "33" }}>
                <LinearGradient colors={GOLD_GRADIENT} style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                  <AchievementIconView icon={a.icon} size={20} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>{a.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>{a.description}</Text>
                </View>
              </View>
            ))}

            {locked.length > 0 && (
              <>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12, marginTop: 4 }}>Up next:</Text>
                {locked.slice(0, 3).map((a) => (
                  <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: colors.secondary, opacity: 0.7 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }}>
                      <AchievementIconView icon={a.icon} size={20} color={colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>{a.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>{a.description}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </GlassCard>

        {/* Major milestones */}
        <GlassCard style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Trophy size={16} color={ACCENT.milestone} />
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Major Milestones</Text>
          </View>
          <View style={{ gap: 10 }}>
            {MILESTONE_DATA.map((m) => {
              const isUnlocked = completedCount >= m.day;
              return (
                <View
                  key={m.day}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: colors.secondary,
                    borderWidth: 1,
                    borderColor: isUnlocked ? ACCENT.milestone + "80" : "transparent",
                    opacity: isUnlocked ? 1 : 0.6,
                  }}
                >
                  {isUnlocked ? (
                    <LinearGradient colors={GOLD_GRADIENT} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                      <Trophy size={20} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }}>
                      <Lock size={16} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Day {m.day}: {m.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>{m.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <GlassCard style={{ flex: 1, padding: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon}
        <Text style={{ color, fontFamily: FONT.extrabold, fontSize: 18 }}>{value}</Text>
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </GlassCard>
  );
}
