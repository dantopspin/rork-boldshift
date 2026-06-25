import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { triggerHaptic, HapticType } from "@/lib/haptics";

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  scale?: number;
  haptic?: HapticType | false;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}

/**
 * Pressable wrapper that animates scale on press with optional haptic feedback.
 * Uses spring animation for a premium, responsive feel.
 * Applies touch-action: manipulation and -webkit-tap-highlight-color: transparent
 * for optimal iOS/mobile web reliability.
 */
export default function PressableScale({
  children,
  scale: scaleTo = 0.97,
  haptic = "light",
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  style,
  innerStyle,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = (): void => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const pressOut = (): void => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    }).start();
  };

  const handlePressIn = (e: any): void => {
    if (disabled) return;
    pressIn();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any): void => {
    if (disabled) return;
    pressOut();
    onPressOut?.(e);
  };

  const handlePress = (e: any): void => {
    if (disabled) return;
    if (haptic !== false) {
      triggerHaptic(haptic);
    }
    onPress?.(e);
  };

  // Web-specific touch optimisations
  const webTouchStyle: ViewStyle =
    Platform.OS === "web"
      ? ({
          touchAction: "manipulation" as const,
          WebkitTapHighlightColor: "transparent",
        } as ViewStyle)
      : {};

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[webTouchStyle, innerStyle]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
