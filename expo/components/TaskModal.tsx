import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Camera, Check, Frown, Heart, Meh, Smile, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, PATH_THEME, RADIUS } from "@/constants/theme";
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

const ICON_BOX = 28;
const ICON_SIZE = 22;

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/**
 * Two-phase bottom-sheet modal for reading a challenge then logging a reflection.
 *
 * Phase 1 — Read: shows title + description + "I'll do this challenge →" CTA.
 * Phase 2 — Complete: shows mood selector + reflection input + "Complete Day X".
 * Skips Phase 1 entirely if the challenge is already completed.
 *
 * Dismiss behaviour: when the challenge is completed, the sheet slides down with a
 * brief "Completed" banner visible during the animation — no snap-away glitch.
 */
export default function TaskModal({ challenge, visible, isCompleted, canComplete, pathType, onClose, onComplete }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const [text, setText] = useState<string>("");
  const [mood, setMood] = useState<Mood>("good");
  const [readyToComplete, setReadyToComplete] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardY = useRef(new Animated.Value(0)).current;

  // Guard against entrance animation re-firing while the sheet is dismissing
  const closingRef = useRef<boolean>(false);

  // Track keyboard height
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(keyboardY, {
          toValue: -e.endCoordinates.height,
          duration: 250,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 180);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        Animated.timing(keyboardY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardY]);

  // Entrance animation — skip if closing
  useEffect(() => {
    if (closingRef.current) return;

    if (visible && challenge) {
      setText("");
      setMood("good");
      setReadyToComplete(isCompleted);
      setPhotoUri(null);
      setKeyboardHeight(0);
      translateY.setValue(600);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible) {
      backdropOpacity.setValue(0);
    }
  }, [visible, challenge?.id, isCompleted]);

  /** Slide the sheet down, then call onClose. */
  const dismiss = useCallback((): void => {
    if (closingRef.current) return;
    closingRef.current = true;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 600,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(0);
      closingRef.current = false;
      onClose();
    });
  }, [translateY, backdropOpacity, onClose]);

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
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
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

  /** Called when the user taps "Complete Day X". */
  /** Open the photo library for proof evidence. */
  const pickPhoto = useCallback(async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      triggerHaptic("light");
      setPhotoUri(result.assets[0]!.uri);
    }
  }, []);

  const handleComplete = useCallback((): void => {
    triggerHaptic("success");
    Keyboard.dismiss();
    onComplete({ text: text.trim(), mood });
    // Slide the sheet down — onClose will fire after the animation finishes
    dismiss();
  }, [text, mood, onComplete, dismiss]);

  if (!challenge) return null;

  const blocked = !canComplete && !isCompleted;
  const phaseOne = !readyToComplete && !isCompleted;

  const sheetTranslate = Animated.add(translateY, keyboardY);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
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
        <Animated.View style={{ transform: [{ translateY: sheetTranslate }] }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "position" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View style={{ backgroundColor: colors.cardSolid, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
              <SafeAreaView edges={["bottom"]}>
                {/* Drag handle */}
                <View
                  {...panResponder.panHandlers}
                  style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}
                >
                  <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
                </View>

                <ScrollView
                  ref={scrollRef}
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20, gap: 12 }}
                >
                  {/* Header row */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      {!phaseOne && !isCompleted && (
                        <PressableScale
                          onPress={() => {
                            triggerHaptic("light");
                            setReadyToComplete(false);
                          }}
                          hitSlop={10}
                          innerStyle={{ padding: 6, borderRadius: 20, backgroundColor: colors.secondary }}
                        >
                          <ArrowLeft size={18} color={colors.mutedForeground} />
                        </PressableScale>
                      )}
                      <LinearGradient colors={theme.gradient} style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#FFF", fontFamily: FONT.extrabold, fontSize: 20 }}>{challenge.day}</Text>
                      </LinearGradient>
                    </View>
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

                  {/* Title */}
                  <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 20 }}>{challenge.title}</Text>

                  {/* ---- PHASE 1: Read view ---- */}
                  {phaseOne && (
                    <>
                      <Text
                        numberOfLines={6}
                        style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 }}
                      >
                        {challenge.description}
                      </Text>
                      {blocked ? (
                        <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.secondary }}>
                          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13, textAlign: "center" }}>One challenge per day</Text>
                          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                            You already completed today's challenge. Come back tomorrow!
                          </Text>
                        </View>
                      ) : (
                        <AppButton
                          label="I'll do this challenge →"
                          size="lg"
                          fullWidth
                          gradient={theme.gradient}
                          onPress={() => {
                            triggerHaptic("medium");
                            setReadyToComplete(true);
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* ---- Completed banner ---- */}
                  {isCompleted && (
                    <>
                      <Text
                        numberOfLines={4}
                        style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 }}
                      >
                        {challenge.description}
                      </Text>
                      <View style={{ padding: 14, borderRadius: 14, backgroundColor: ACCENT.success + "1A", flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Check size={20} color={ACCENT.success} strokeWidth={3} />
                        <Text style={{ color: ACCENT.success, fontFamily: FONT.bold, fontSize: 14 }}>Completed — nice work!</Text>
                      </View>
                    </>
                  )}

                  {/* ---- PHASE 2: Complete form ---- */}
                  {readyToComplete && !isCompleted && !blocked && (
                    <>
                      {/* Mood selector */}
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>How did it feel?</Text>

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        {MOODS.map((m) => {
                          const active = mood === m.value;
                          const MoodIcon = m.icon;
                          return (
                            <PressableScale
                              key={m.value}
                              onPress={() => setMood(m.value)}
                              style={{ flex: 1 }}
                              innerStyle={{
                                alignItems: "center",
                                paddingVertical: 12,
                                borderRadius: 14,
                                borderWidth: 2,
                                borderColor: active ? m.color : colors.border,
                                backgroundColor: active ? m.color + "1A" : "transparent",
                                gap: 6,
                              }}
                            >
                              <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: "center", justifyContent: "center" }}>
                                <MoodIcon size={ICON_SIZE} color={m.color} />
                              </View>
                              <Text style={{ color: active ? m.color : colors.mutedForeground, fontFamily: FONT.medium, fontSize: 11 }}>{m.label}</Text>
                            </PressableScale>
                          );
                        })}
                      </View>

                      {/* Photo Evidence */}
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Photo Evidence</Text>
                      <PressableScale
                        onPress={pickPhoto}
                        haptic="light"
                        innerStyle={{
                          borderRadius: RADIUS.md,
                          borderWidth: photoUri ? 2 : 1.5,
                          borderColor: photoUri ? ACCENT.success : colors.border,
                          borderStyle: photoUri ? "solid" : "dashed",
                          backgroundColor: photoUri ? ACCENT.success + "0D" : colors.secondary,
                          overflow: "hidden",
                        }}
                      >
                        {photoUri ? (
                          <View>
                            <Image source={{ uri: photoUri }} style={{ width: "100%", height: 140 }} contentFit="cover" />
                            <View
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: ACCENT.success,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={15} color="#FFF" strokeWidth={3} />
                            </View>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Camera size={14} color={ACCENT.success} />
                              <Text style={{ color: ACCENT.success, fontFamily: FONT.medium, fontSize: 12 }}>Photo attached — tap to change</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={{ paddingVertical: 32, alignItems: "center", gap: 8 }}>
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: colors.secondary,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Camera size={20} color={colors.mutedForeground} />
                            </View>
                            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 13 }}>
                              Tap to add proof
                            </Text>
                            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, opacity: 0.6 }}>
                              Snap a photo to prove you did it
                            </Text>
                          </View>
                        )}
                      </PressableScale>

                      {/* Reflection input */}
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Reflection (optional)</Text>
                      <TextInput
                        ref={inputRef}
                        value={text}
                        onChangeText={setText}
                        placeholder="What did you notice? How did it go?"
                        placeholderTextColor={colors.mutedForeground}
                        multiline
                        returnKeyType="done"
                        submitBehavior="blurAndSubmit"
                        blurOnSubmit
                        onFocus={() => {
                          setTimeout(() => {
                            scrollRef.current?.scrollToEnd({ animated: true });
                          }, 150);
                        }}
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

                      {/* Complete CTA */}
                      <AppButton
                        label={`Complete Day ${challenge.day}`}
                        size="lg"
                        fullWidth
                        gradient={theme.gradient}
                        icon={<Check size={20} color="#FFF" strokeWidth={3} />}
                        onPress={handleComplete}
                        disabled={!photoUri}
                      />
                      {!photoUri && (
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textAlign: "center" }}>
                          Add photo evidence to complete
                        </Text>
                      )}
                    </>
                  )}
                </ScrollView>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
