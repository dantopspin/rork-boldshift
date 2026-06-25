import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Check, Frown, Heart, ImageIcon, Meh, Smile, X } from "lucide-react-native";
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
 * Single-phase bottom-sheet modal for completing a challenge.
 *
 * Shows the full challenge info plus mood, optional photo proof, and reflection
 * on one screen — no intermediate read step.
 *
 * Dismiss behaviour: when the challenge is completed, the sheet slides down with a
 * brief "Completed" banner visible during the animation — no snap-away glitch.
 */
export default function TaskModal({ challenge, visible, isCompleted, canComplete, pathType, onClose, onComplete }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const [text, setText] = useState<string>("");
  const [mood, setMood] = useState<Mood>("good");
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [showPhotoOptions, setShowPhotoOptions] = useState<boolean>(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showValidationHint, setShowValidationHint] = useState<boolean>(false);

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
      setPhotoUri(null);
      setShowPhotoOptions(false);
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
  const pickFromGallery = useCallback(async (): Promise<void> => {
    setShowPhotoOptions(false);
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

  /** Open the camera for proof evidence. */
  const pickFromCamera = useCallback(async (): Promise<void> => {
    setShowPhotoOptions(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      triggerHaptic("light");
      setPhotoUri(result.assets[0]!.uri);
    }
  }, []);

  /** Remove the attached photo. */
  const removePhoto = useCallback((): void => {
    triggerHaptic("light");
    setPhotoUri(null);
  }, []);

  const handleComplete = useCallback((): void => {
    const trimmed = text.trim();
    if (trimmed.length < 5 && !photoUri) {
      setShowValidationHint(true);
      return;
    }
    setShowValidationHint(false);
    triggerHaptic("success");
    Keyboard.dismiss();
    onComplete({ text: trimmed, mood });
    // Slide the sheet down — onClose will fire after the animation finishes
    dismiss();
  }, [text, mood, photoUri, onComplete, dismiss]);

  if (!challenge) return null;

  const blocked = !canComplete && !isCompleted;

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
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
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

                  {/* Title */}
                  <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 20 }}>{challenge.title}</Text>

                  {/* Description */}
                  <Text
                    numberOfLines={6}
                    style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 }}
                  >
                    {challenge.description}
                  </Text>

                  {/* ---- Completed banner ---- */}
                  {isCompleted && (
                    <View style={{ padding: 14, borderRadius: 14, backgroundColor: ACCENT.success + "1A", flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Check size={20} color={ACCENT.success} strokeWidth={3} />
                      <Text style={{ color: ACCENT.success, fontFamily: FONT.bold, fontSize: 14 }}>Completed — nice work!</Text>
                    </View>
                  )}

                  {/* ---- Blocked (already completed today) ---- */}
                  {blocked && (
                    <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.secondary }}>
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 13, textAlign: "center" }}>One challenge per day</Text>
                      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                        You already completed today's challenge. Come back tomorrow!
                      </Text>
                    </View>
                  )}

                  {/* ---- Complete form (always shown unless completed or blocked) ---- */}
                  {!isCompleted && !blocked && (
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

                      {/* Photo Evidence (optional) */}
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Photo Evidence (optional)</Text>

                      {photoUri ? (
                        <View style={{ borderRadius: RADIUS.md, borderWidth: 2, borderColor: ACCENT.success, backgroundColor: ACCENT.success + "0D", overflow: "hidden" }}>
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
                          <View style={{ flexDirection: "row", gap: 0 }}>
                            <PressableScale
                              onPress={() => {
                                triggerHaptic("light");
                                setShowPhotoOptions(true);
                              }}
                              style={{ flex: 1 }}
                              innerStyle={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}
                            >
                              <Camera size={14} color={ACCENT.success} />
                              <Text style={{ color: ACCENT.success, fontFamily: FONT.medium, fontSize: 12 }}>Change photo</Text>
                            </PressableScale>
                            <PressableScale
                              onPress={removePhoto}
                              style={{ flex: 1 }}
                              innerStyle={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" }}
                            >
                              <X size={14} color={colors.mutedForeground} />
                              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12 }}>Remove</Text>
                            </PressableScale>
                          </View>
                        </View>
                      ) : showPhotoOptions ? (
                        <View style={{ gap: 10 }}>
                          <View style={{ flexDirection: "row", gap: 10 }}>
                            <PressableScale
                              onPress={pickFromCamera}
                              style={{ flex: 1 }}
                              innerStyle={{
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                borderStyle: "dashed",
                                backgroundColor: colors.secondary,
                                paddingVertical: 24,
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color + "22", alignItems: "center", justifyContent: "center" }}>
                                <Camera size={20} color={theme.color} />
                              </View>
                              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13 }}>Camera</Text>
                            </PressableScale>
                            <PressableScale
                              onPress={pickFromGallery}
                              style={{ flex: 1 }}
                              innerStyle={{
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                borderStyle: "dashed",
                                backgroundColor: colors.secondary,
                                paddingVertical: 24,
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                                <ImageIcon size={20} color={colors.mutedForeground} />
                              </View>
                              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13 }}>Gallery</Text>
                            </PressableScale>
                          </View>
                          <PressableScale
                            onPress={() => {
                              triggerHaptic("light");
                              setShowPhotoOptions(false);
                            }}
                            innerStyle={{
                              borderRadius: RADIUS.full,
                              borderWidth: 1,
                              borderColor: colors.border,
                              paddingVertical: 10,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 13 }}>Cancel</Text>
                          </PressableScale>
                        </View>
                      ) : (
                        <PressableScale
                          onPress={() => {
                            triggerHaptic("light");
                            setShowPhotoOptions(true);
                          }}
                          innerStyle={{
                            borderRadius: RADIUS.md,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                            borderStyle: "dashed",
                            backgroundColor: colors.secondary,
                            paddingVertical: 28,
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                            <Camera size={18} color={colors.mutedForeground} />
                          </View>
                          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 13 }}>Add proof photo</Text>
                          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, opacity: 0.5 }}>Optional — camera or gallery</Text>
                        </PressableScale>
                      )}

                      {/* Reflection input */}
                      <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Reflection</Text>
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

                      {/* Validation hint */}
                      {showValidationHint && (
                        <View style={{ padding: 12, borderRadius: 12, backgroundColor: ACCENT.milestone + "18", flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: ACCENT.milestone + "33", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 11 }}>!</Text>
                          </View>
                          <Text style={{ color: ACCENT.milestone, fontFamily: FONT.medium, fontSize: 12, flex: 1 }}>Add a quick note or photo to finish</Text>
                        </View>
                      )}

                      {/* Complete CTA */}
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
                </ScrollView>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
