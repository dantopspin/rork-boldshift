import { LinearGradient } from "expo-linear-gradient";
import { Check, Frown, Heart, Meh, Smile, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, PATH_THEME } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { Challenge, Mood, PathType } from "@/types";

interface Props {
  challenge: Challenge | null;
  visible: boolean;
  isCompleted: boolean;
  canComplete: boolean;
  pathType: PathType;
  onClose: () => void;
  onComplete: (reflection: { text: string; mood: Mood }) => void;
}

const MOODS: { value: Mood; icon: typeof Smile; color: string; label: string }[] = [
  { value: "great", icon: Heart, color: "#EC4899", label: "Great" },
  { value: "good", icon: Smile, color: ACCENT.success, label: "Good" },
  { value: "okay", icon: Meh, color: ACCENT.milestone, label: "Okay" },
  { value: "hard", icon: Frown, color: "#E0483D", label: "Hard" },
];

// FIXED: Fixed icon footprint, independent of the icon's own size prop.
// Lucide icons don't share identical internal SVG bounding boxes — Heart,
// Smile, Meh, and Frown each crop their glyph differently within their
// viewBox. At the same numeric `size`, a face icon like Smile draws closer
// to its own edges than Heart does, so the rendered circle appears larger.
// On unselected pills this was invisible (just a thin grey border, no fill).
// On the active pill — which gets a colored background tint sized to the
// icon's true bounding box — the mismatch became visible as the icon
// appearing to overflow the pill edge. Wrapping every icon in an identical
// fixed-size, centered container normalizes the visual footprint regardless
// of which glyph is used, so all four moods read as the same size.
const ICON_BOX = 28;
const ICON_SIZE = 22;

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/**
 * Bottom-sheet modal for reading a challenge and logging a reflection.
 * Fully visible on all iPhone sizes — no scrolling required.
 * Features smooth swipe-to-dismiss via PanResponder.
 */
export default function TaskModal({ challenge, visible, isCompleted, canComplete, pathType, onClose, onComplete }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const [text, setText] = useState<string>("");
  const [mood, setMood] = useState<Mood>("good");

  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setText("");
      setMood("good");
      translateY.setValue(0);
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      backdropOpacity.setValue(0);
    }
  }, [visible, challenge?.id]);

  const dismiss = (): void => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 500,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dx) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 14,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  if (!challenge) return null;

  const blocked = !canComplete && !isCompleted;

  const handleComplete = (): void => {
    triggerHaptic("success");
    onComplete({ text: text.trim(), mood });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <Animated.View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              opacity: backdropOpacity,
            }}
          >
            <TouchableWithoutFeedback onPress={dismiss}>
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={{ transform: [{ translateY }] }}
            {...panResponder.panHandlers}
          >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={{ backgroundColor: colors.cardSolid, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
                <SafeAreaView edges={["bottom"]}>
                  {/* Drag handle */}
                  <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
                    <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
                  </View>

                  <View style={{ paddingHorizontal: 22, paddingBottom: 20, gap: 12 }}>
                    {/* Header row */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <LinearGradient colors={theme.gradient} style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#FFF", fontFamily: FONT.extrabold, fontSize: 20 }}>{challenge.day}</Text>
                      </LinearGradient>
                      <PressableScale onPress={dismiss} hitSlop={10} innerStyle={{ padding: 6, borderRadius: 20, backgroundColor: colors.secondary }}>
                        <X size={18} color={colors.mutedForeground} />
                      </PressableScale>
                    </View>

                    {/* Tags */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ backgroundColor: theme.color + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: theme.color, fontFamily: FONT.bold, fontSize: 11 }}>Day {challenge.day}</Text>
                      </View>
                      <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 11 }}>{DIFFICULTY_LABEL[challenge.difficulty]}</Text>
                      </View>
                      <View style={{ backgroundColor: ACCENT.milestone + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 11 }}>+{challenge.xpReward} XP</Text>
                      </View>
                    </View>

                    {/* Title & description */}
                    <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 20 }}>{challenge.title}</Text>
                    <Text
                      numberOfLines={4}
                      style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 }}
                    >
                      {challenge.description}
                    </Text>

                    {isCompleted ? (
                      <View style={{ padding: 14, borderRadius: 14, backgroundColor: ACCENT.success + "1A", flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Check size={20} color={ACCENT.success} strokeWidth={3} />
                        <Text style={{ color: ACCENT.success, fontFamily: FONT.bold, fontSize: 14 }}>Completed — nice work!</Text>
                      </View>
                    ) : blocked ? (
                      <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.secondary }}>
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13, textAlign: "center" }}>One challenge per day</Text>
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                          You already completed today's challenge. Come back tomorrow!
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* Mood selector */}
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>How did it feel?</Text>

                        {/*
                          FIXED: Row already shares the same paddingHorizontal: 22
                          as "How did it feel?" above it (both live inside the same
                          parent View), so its outer bounds already match the text's
                          full width — no separate alignment fix needed there.

                          What needed fixing was internal balance:
                          - Each pill uses flex: 1 so all four divide the row's
                            width evenly, edge to edge, with no leftover gap.
                          - gap: 10 (up from 8) gives slightly more breathing room
                            between pills now that each icon sits in a fixed,
                            visually consistent box — matches the app's general
                            preference for generous spacing over cramped rows.
                          - Icon is wrapped in a fixed ICON_BOX × ICON_BOX container,
                            centered, so Heart/Smile/Meh/Frown all read as the same
                            visual size regardless of their individual SVG bounding
                            boxes. This is what eliminates the overflow artifact on
                            the active ("Good") pill from the original bug.
                        */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          {MOODS.map((m) => {
                            const active = mood === m.value;
                            const MoodIcon = m.icon;
                            return (
                              <PressableScale
                                key={m.value}
                                onPress={() => {
                                  setMood(m.value);
                                }}
                                innerStyle={{
                                  flex: 1,
                                  alignItems: "center",
                                  paddingVertical: 12,
                                  borderRadius: 14,
                                  borderWidth: 2,
                                  borderColor: active ? m.color : colors.border,
                                  backgroundColor: active ? m.color + "1A" : "transparent",
                                  gap: 6,
                                }}
                              >
                                <View
                                  style={{
                                    width: ICON_BOX,
                                    height: ICON_BOX,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <MoodIcon size={ICON_SIZE} color={m.color} />
                                </View>
                                <Text style={{ color: active ? m.color : colors.mutedForeground, fontFamily: FONT.medium, fontSize: 11 }}>{m.label}</Text>
                              </PressableScale>
                            );
                          })}
                        </View>

                        {/* Reflection input */}
                        <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Reflection (optional)</Text>
                        <TextInput
                          value={text}
                          onChangeText={setText}
                          placeholder="What did you notice? How did it go?"
                          placeholderTextColor={colors.mutedForeground}
                          multiline
                          returnKeyType="done"
                          submitBehavior="blurAndSubmit"
                          style={{
                            height: 72,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.secondary,
                            padding: 12,
                            color: colors.foreground,
                            fontFamily: FONT.regular,
                            fontSize: 14,
                            textAlignVertical: "top",
                          }}
                        />

                        {/* CTA */}
                        <AppButton
                          label={`Complete Day ${challenge.day}`}
                          size="lg"
                          fullWidth
                          gradient={theme.gradient}
                          icon={<Check size={20} color="#FFF" strokeWidth={3} />}
                          onPress={handleComplete}
                        />
                      </>
                    )}
                  </View>
                </SafeAreaView>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}