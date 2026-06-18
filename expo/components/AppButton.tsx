import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { FONT, RADIUS } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import { useTheme } from "@/providers/ThemeProvider";

type Variant = "primary" | "gold" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  gradient?: [string, string];
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<Size, { h: number; px: number; font: number }> = {
  sm: { h: 40, px: 16, font: 14 },
  md: { h: 48, px: 20, font: 15 },
  lg: { h: 56, px: 24, font: 17 },
};

/** Spring-press animated button with haptics, matching the source's tactile feel. */
export default function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  gradient,
  icon,
  trailingIcon,
  fullWidth,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const dims = SIZE_MAP[size];

  const press = (to: number): void => {
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handlePress = (): void => {
    if (disabled || loading) return;
    triggerHaptic("light");
    onPress();
  };

  const isGradient = variant === "primary" || variant === "gold";
  const grad: [string, string] = gradient ?? (variant === "gold" ? ["#F5A623", "#E0820E"] : [colors.primary, colors.primary]);

  const textColor =
    variant === "outline" || variant === "ghost"
      ? colors.foreground
      : variant === "destructive"
        ? "#FFFFFF"
        : colors.primaryForeground;

  const labelStyle: TextStyle = {
    color: textColor,
    fontFamily: FONT.bold,
    fontSize: dims.font,
  };

  const containerBase: ViewStyle = {
    height: dims.h,
    paddingHorizontal: dims.px,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : undefined,
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
          {trailingIcon}
        </>
      )}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], width: fullWidth ? "100%" : undefined }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => press(0.96)}
        onPressOut={() => press(1)}
        disabled={disabled || loading}
        style={{ borderRadius: RADIUS.full }}
      >
        {isGradient ? (
          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={containerBase}>
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              containerBase,
              variant === "outline" && { borderWidth: 1.5, borderColor: colors.border, backgroundColor: "transparent" },
              variant === "ghost" && { backgroundColor: "transparent" },
              variant === "destructive" && { backgroundColor: colors.destructive },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const styles = StyleSheet.create({});
