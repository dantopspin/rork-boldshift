import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, Lock, Star } from "lucide-react-native";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { ACCENT, FONT, PATH_THEME } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/providers/ThemeProvider";
import { Challenge, NodeStatus, PathType } from "@/types";

interface PathNodeProps {
  day: number;
  status: NodeStatus;
  isMilestone: boolean;
  pathType: PathType;
  challenge: Challenge;
  onPress: () => void;
  onProLockedPress: () => void;
}

const SIZE = 54;

/** A single day node in the journey grid. */
const PathNode = memo(function PathNode({
  day,
  status,
  isMilestone,
  pathType,
  onPress,
  onProLockedPress,
}: PathNodeProps) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Gentle looping pulse for current day node
  useEffect(() => {
    if (status !== "current") {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const handlePress = (): void => {
    if (status === "locked") return;
    if (status === "pro-locked") {
      triggerHaptic("warning");
      onProLockedPress();
      return;
    }
    triggerHaptic("medium");
    onPress();
  };

  const press = (to: number): void => {
    if (status === "locked") return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
  };

  const renderInner = (): React.ReactNode => {
    if (status === "completed") {
      return <Check size={22} color="#FFFFFF" strokeWidth={3} />;
    }
    if (status === "pro-locked") {
      return <Crown size={18} color={ACCENT.milestone} />;
    }
    if (status === "locked") {
      return <Lock size={16} color={colors.mutedForeground} />;
    }
    // current
    return (
      <Text style={{ color: "#FFFFFF", fontFamily: FONT.extrabold, fontSize: 18 }}>{day}</Text>
    );
  };

  const isFilled = status === "completed" || status === "current";
  const effectiveScale = status === "current" ? Animated.multiply(scale, pulse) : scale;

  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Animated.View style={{ transform: [{ scale: effectiveScale }] }}>
        {/* Glow circle behind the node (Android-compatible, replaces shadows) */}
        {isFilled && (
          <View
            style={{
              position: "absolute",
              top: -(SIZE * 0.25),
              left: -(SIZE * 0.25),
              width: SIZE * 1.5,
              height: SIZE * 1.5,
              borderRadius: (SIZE * 1.5) / 2,
              backgroundColor: theme.color + "26",
            }}
            pointerEvents="none"
          />
        )}
        <Pressable
          onPress={handlePress}
          onPressIn={() => press(0.9)}
          onPressOut={() => press(1)}
          accessibilityLabel={`Day ${day}, ${status}`}
        >
          {isFilled ? (
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: status === "current" ? 3 : 0,
                borderColor: "#FFFFFF",
              }}
            >
              {renderInner()}
            </LinearGradient>
          ) : (
            <View
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: status === "pro-locked" ? "rgba(245,166,35,0.12)" : colors.secondary,
                borderWidth: 1.5,
                borderColor: status === "pro-locked" ? "rgba(245,166,35,0.4)" : colors.border,
              }}
            >
              {renderInner()}
            </View>
          )}
          {isMilestone && (
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: ACCENT.milestone,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </Pressable>
      </Animated.View>
      {/* Day label below each node */}
      <Text
        style={{
          color: status === "current" ? theme.color : colors.mutedForeground,
          fontFamily: FONT.medium,
          fontSize: 10,
          textAlign: "center",
        }}
      >
        Day {day}
      </Text>
    </View>
  );
});

export default PathNode;
