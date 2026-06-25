import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Mic,
  Rocket,
  Shield,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";
import AppButton from "@/components/AppButton";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, PATH_THEME } from "@/constants/theme";
import { getChallengesForPath } from "@/data/challenges";
import { getWeekThemesForPath } from "@/data/weekThemes";
import { triggerHaptic } from "@/lib/haptics";
import { useProgress } from "@/providers/ProgressProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { PathType, SocialFear, SocialGoal } from "@/types";

const SOCIAL_FEARS: { value: SocialFear; label: string }[] = [
  { value: "judged", label: "Walking into a room full of strangers" },
  { value: "ignored", label: "Sharing an opinion that might be unpopular" },
  { value: "rejected", label: "The silence after you finish speaking" },
  { value: "no_words", label: "Asking for what I actually need/want" },
  { value: "wrong_thing", label: "Being the center of attention" },
];

const SOCIAL_GOALS: { value: SocialGoal; label: string }[] = [
  { value: "less_anxious", label: "Giving a presentation without my heart racing" },
  { value: "speak_confidently", label: 'Saying "no" to a request without feeling guilty' },
  { value: "set_boundaries", label: "Actually enjoying a party or social gathering" },
  { value: "stop_overthinking", label: 'Stopping a "thought spiral" before it ruins my night' },
  { value: "improve_relationships", label: "Speaking up without over-preparing" },
];

const PATHS: { value: PathType; icon: typeof MessageCircle }[] = [
  { value: "introvert", icon: MessageCircle },
  { value: "speaking", icon: Mic },
  { value: "assertiveness", icon: Shield },
];

const TOTAL_SCREENS = 7;

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const { selectPath } = useProgress();
  const { isPro, setShowPaywallAfterOnboarding } = useSubscription();

  const [screen, setScreen] = useState<number>(1);
  const [selectedPath, setSelectedPath] = useState<PathType | null>(null);
  const [fears, setFears] = useState<SocialFear[]>([]);
  const [goals, setGoals] = useState<SocialGoal[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTo = (next: number, dir: 1 | -1): void => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: dir * -40, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setScreen(next);
      slideAnim.setValue(dir * 40);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const goTo = (next: number, dir: 1 | -1 = 1): void => {
    triggerHaptic("light");
    animateTo(next, dir);
  };

  const toggleFear = (v: SocialFear): void => {
    triggerHaptic("light");
    setFears((prev) => (prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]));
  };
  const toggleGoal = (v: SocialGoal): void => {
    triggerHaptic("light");
    setGoals((prev) => (prev.includes(v) ? prev.filter((g) => g !== v) : [...prev, v]));
  };

  const DAILY_REMINDER_ID = "boldshift-daily-reminder";

  const scheduleReminder = useCallback(async (): Promise<void> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
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

  const handleReminderToggle = useCallback(async (): Promise<void> => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    if (next) {
      await scheduleReminder();
    } else {
      await cancelReminder();
    }
  }, [reminderEnabled, scheduleReminder, cancelReminder]);

  const handleStart = (): void => {
    triggerHaptic("success");
    if (!selectedPath) return;
    if (reminderEnabled) {
      scheduleReminder();
    }
    // Persist notification preference so Profile stays in sync
    AsyncStorage.setItem("boldshift_notifications", JSON.stringify(reminderEnabled)).catch(() => {});
    selectPath(selectedPath, null, fears, goals);
    if (!isPro) setShowPaywallAfterOnboarding(true);
    router.replace("/(tabs)/journey");
  };

  const firstChallenge = selectedPath ? getChallengesForPath(selectedPath)[0] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Progress header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12 }}>
              Step {screen} of {TOTAL_SCREENS}
            </Text>
            <Text style={{ color: colors.primary, fontFamily: FONT.bold, fontSize: 12 }}>
              {Math.round((screen / TOTAL_SCREENS) * 100)}%
            </Text>
          </View>
          <AnimatedProgressBar
            progress={screen / TOTAL_SCREENS}
            color={colors.primary}
            trackColor={colors.secondary}
            height={6}
          />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12 }}>
            {Array.from({ length: TOTAL_SCREENS }, (_, i) => i + 1).map((step) => (
              <PressableScale
                key={step}
                disabled={step >= screen}
                onPress={() => step < screen && goTo(step, -1)}
                haptic={false}
                innerStyle={{ padding: 4 }}
              >
                <View
                  style={{
                    width: step === screen ? 10 : 8,
                    height: step === screen ? 10 : 8,
                    borderRadius: 5,
                    backgroundColor:
                      step === screen ? colors.primary : step < screen ? colors.primary + "88" : colors.mutedForeground + "55",
                  }}
                />
              </PressableScale>
            ))}
          </View>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Screen 1 — Welcome */}
            {screen === 1 && (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 420 }}>
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 22,
                    backgroundColor: colors.primary + "22",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Rocket size={36} color={colors.primary} />
                </View>
                <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 30, textAlign: "center", lineHeight: 36, marginBottom: 14 }}>
                  Your 60-Day Confidence Journey
                </Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 16, textAlign: "center", marginBottom: 36, lineHeight: 24 }}>
                  One 5-minute challenge per day. Real transformation. No overwhelm.
                </Text>
                <AppButton label="Start My Journey" size="lg" fullWidth onPress={() => goTo(2, 1)} />
              </View>
            )}

            {/* Screens 2 & 3 — multi select */}
            {(screen === 2 || screen === 3) && (
              <SelectStep
                onBack={() => goTo(screen - 1, -1)}
                title={screen === 2 ? "Which moments hit you the hardest?" : "What does confident feel like in 60 days?"}
                options={screen === 2 ? SOCIAL_FEARS : SOCIAL_GOALS}
                selected={screen === 2 ? fears : goals}
                onToggle={(v) => (screen === 2 ? toggleFear(v as SocialFear) : toggleGoal(v as SocialGoal))}
                onContinue={() => goTo(screen + 1, 1)}
                canContinue={screen === 2 ? fears.length > 0 : goals.length > 0}
                hint="This helps us tailor your daily challenges."
              />
            )}

            {/* Screen 4 — choose path */}
            {screen === 4 && (
              <View style={{ flex: 1 }}>
                <BackButton onPress={() => goTo(3, -1)} />
                <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 24, textAlign: "center", marginTop: 8, marginBottom: 20 }}>
                  Choose Your Journey
                </Text>
                <View style={{ gap: 12 }}>
                  {PATHS.map(({ value, icon: Icon }) => {
                    const theme = PATH_THEME[value];
                    const active = selectedPath === value;
                    return (
                      <PressableScale
                        key={value}
                        onPress={() => {
                          triggerHaptic("medium");
                          setSelectedPath(value);
                        }}
                        haptic={false}
                        innerStyle={{
                          padding: 16,
                          borderRadius: 18,
                          backgroundColor: colors.cardSolid,
                          borderWidth: 2,
                          borderColor: active ? theme.color : colors.border,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                          shadowColor: active ? theme.color : "transparent",
                          shadowOpacity: active ? 0.3 : 0,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 4 },
                        }}
                      >
                        <LinearGradient colors={theme.gradient} style={{ width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                          <Icon size={24} color="#FFFFFF" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 16 }}>
                            {theme.label} {theme.emoji}
                          </Text>
                          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>
                            {theme.tagline}
                          </Text>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
                <View style={{ marginTop: 24 }}>
                  <AppButton
                    label="Continue"
                    size="lg"
                    fullWidth
                    disabled={!selectedPath}
                    gradient={selectedPath ? PATH_THEME[selectedPath].gradient : undefined}
                    trailingIcon={<ChevronRight size={20} color={colors.primaryForeground} />}
                    onPress={() => goTo(5, 1)}
                  />
                </View>
              </View>
            )}

            {/* Screen 5 — journey preview (Roadmap) */}
            {screen === 5 && selectedPath && (
              <View style={{ flex: 1 }}>
                <BackButton onPress={() => goTo(4, -1)} />
                <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 24, textAlign: "center", marginTop: 8 }}>
                  Your {PATH_THEME[selectedPath].label} Journey
                </Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 20 }}>
                  60 days of progressive growth — 3 phases
                </Text>
                <Roadmap pathType={selectedPath} />
                {firstChallenge && (
                  <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.cardSolid, borderWidth: 2, borderColor: PATH_THEME[selectedPath].color + "4D" }}>
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12, marginBottom: 8 }}>Day 1 Challenge:</Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <LinearGradient colors={PATH_THEME[selectedPath].gradient} style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#FFFFFF", fontFamily: FONT.bold, fontSize: 16 }}>1</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>{firstChallenge.title}</Text>
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>{firstChallenge.description}</Text>
                      </View>
                    </View>
                  </View>
                )}
                <View style={{ marginTop: 24 }}>
                  <AppButton label="I'm Ready" size="lg" fullWidth gradient={PATH_THEME[selectedPath].gradient} trailingIcon={<ChevronRight size={20} color="#FFF" />} onPress={() => goTo(6, 1)} />
                </View>
              </View>
            )}

            {/* Screen 6 — commitment */}
            {screen === 6 && selectedPath && (
              <View style={{ flex: 1 }}>
                <BackButton onPress={() => goTo(5, -1)} />
                <View style={{ alignItems: "center", marginTop: 8 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: PATH_THEME[selectedPath].color + "22", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Check size={36} color={PATH_THEME[selectedPath].color} />
                  </View>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 24, marginBottom: 20 }}>Your Commitment</Text>
                </View>
                <View style={{ padding: 20, borderRadius: 18, backgroundColor: colors.cardSolid, borderWidth: 2, borderColor: PATH_THEME[selectedPath].color + "4D", marginBottom: 16 }}>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.regular, fontSize: 16, textAlign: "center", lineHeight: 24 }}>
                    <Text style={{ color: colors.mutedForeground }}>I commit to </Text>
                    <Text style={{ fontFamily: FONT.bold }}>{PATH_THEME[selectedPath].label}</Text>
                    <Text style={{ color: colors.mutedForeground }}> for </Text>
                    <Text style={{ fontFamily: FONT.bold }}>60 days</Text>
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 13, textAlign: "center", marginTop: 8 }}>
                    One small step each day. No excuses.
                  </Text>
                </View>
                {/* Notification preview mockup */}
                <View style={{
                  marginBottom: 16,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  overflow: "hidden",
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
                    <LinearGradient colors={PATH_THEME[selectedPath].gradient} style={{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                      <Rocket size={18} color="#FFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 12 }}>BoldShift</Text>
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 10 }}>now</Text>
                      </View>
                      <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                        Time for your daily challenge
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                        One small step today keeps your BoldShift streak alive.
                      </Text>
                    </View>
                  </View>
                  <View style={{ paddingHorizontal: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Clock size={11} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 10 }}>Daily at 9:00 AM — a gentle nudge, not a demand</Text>
                  </View>
                </View>
                <PressableScale
                  onPress={handleReminderToggle}
                  innerStyle={{
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: reminderEnabled ? PATH_THEME[selectedPath].color : colors.border,
                    backgroundColor: reminderEnabled ? PATH_THEME[selectedPath].color + "1A" : colors.cardSolid,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Bell size={20} color={reminderEnabled ? PATH_THEME[selectedPath].color : colors.mutedForeground} />
                    <Text style={{ color: reminderEnabled ? colors.foreground : colors.mutedForeground, fontFamily: FONT.medium, fontSize: 14 }}>
                      Daily reminder
                    </Text>
                  </View>
                  <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: reminderEnabled ? PATH_THEME[selectedPath].color : colors.muted, justifyContent: "center" }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFF", marginLeft: reminderEnabled ? 21 : 3 }} />
                  </View>
                </PressableScale>
                <AppButton label="Begin Day 1" size="lg" fullWidth gradient={PATH_THEME[selectedPath].gradient} onPress={handleStart} />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} haptic={false} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 }}>
      <ChevronLeft size={18} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 14 }}>Back</Text>
    </PressableScale>
  );
}

interface SelectStepProps<T extends string> {
  title: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
  onContinue: () => void;
  canContinue: boolean;
  onBack: () => void;
  hint?: string;
}

function SelectStep<T extends string>({ title, options, selected, onToggle, onContinue, canContinue, onBack, hint }: SelectStepProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <BackButton onPress={onBack} />
      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 23, textAlign: "center", marginTop: 8 }}>{title}</Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 18 }}>
        Pick one or more
      </Text>
      <View style={{ gap: 10 }}>
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <PressableScale
              key={o.value}
              onPress={() => onToggle(o.value)}
              innerStyle={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primary + "1A" : colors.cardSolid,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14, flex: 1, paddingRight: 8 }}>{o.label}</Text>
              {active && <Check size={18} color={colors.primary} />}
            </PressableScale>
          );
        })}
      </View>
      {hint && (
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 14, opacity: 0.7 }}>
          {hint}
        </Text>
      )}
      <View style={{ marginTop: 24 }}>
        <AppButton
          label="Continue"
          size="lg"
          fullWidth
          disabled={!canContinue}
          trailingIcon={<ChevronRight size={20} color={colors.primaryForeground} />}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

/** Visual roadmap showing the 3 phases of the 60-day journey. */
function Roadmap({ pathType }: { pathType: PathType }) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];

  const phases = [
    { name: "Foundation", days: "Days 1–21", desc: "Build awareness and small daily habits that rewire your social reflexes." },
    { name: "Growth", days: "Days 22–42", desc: "Step into real-world practice with guided exposure and reflection." },
    { name: "Mastery", days: "Days 43–60", desc: "Confidence becomes second nature. Lead, connect, and speak your truth." },
  ];

  return (
    <View style={{ gap: 0 }}>
      {phases.map((phase, i) => (
        <View key={phase.name} style={{ flexDirection: "row", gap: 0 }}>
          {/* Left rail: dot + line */}
          <View style={{ alignItems: "center", width: 28 }}>
            <View style={{
              width: i === 0 ? 14 : 12,
              height: i === 0 ? 14 : 12,
              borderRadius: 7,
              backgroundColor: i === 0 ? theme.color : i === 1 ? theme.glow : ACCENT.milestone,
              borderWidth: 2,
              borderColor: colors.background,
            }} />
            {i < phases.length - 1 && (
              <View style={{ width: 2, flex: 1, backgroundColor: theme.color + "33", marginVertical: 4, minHeight: 30 }} />
            )}
          </View>
          {/* Phase card */}
          <View style={{
            flex: 1,
            marginLeft: 10,
            marginBottom: i < phases.length - 1 ? 14 : 0,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.cardSolid,
            borderWidth: 1,
            borderColor: i === 0 ? theme.color + "44" : colors.border,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 15 }}>
                {phase.name}
              </Text>
              <Text style={{ color: theme.color, fontFamily: FONT.bold, fontSize: 11, opacity: 0.8 }}>
                {phase.days}
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, lineHeight: 18 }}>
              {phase.desc}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export const _platform = Platform.OS;
