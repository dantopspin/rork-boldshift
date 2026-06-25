import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { RADIUS } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  radius?: number;
  borderColor?: string;
}

/**
 * iOS-style frosted glass card. Uses expo-blur on native and a translucent
 * fallback on web (blur is unreliable there).
 */
export default function GlassCard({ children, style, elevated, radius = RADIUS.lg, borderColor }: GlassCardProps) {
  const { colors, isDark } = useTheme();

  const border = borderColor ?? (elevated ? (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)") : colors.glassBorder);
  const containerStyle: ViewStyle = {
    borderRadius: radius,
    borderWidth: 1,
    borderColor: border,
    overflow: "hidden",
    ...(elevated
      ? {
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }
      : {
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }),
  };

  if (Platform.OS === "web") {
    return (
      <View style={[containerStyle, { backgroundColor: colors.card, borderWidth: 1.5 }, style]}>{children}</View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <BlurView intensity={25} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} />
      {children}
    </View>
  );
}
