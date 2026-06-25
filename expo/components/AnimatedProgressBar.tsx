import React, { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

interface Props {
  progress: number; // 0..1
  color: string;
  trackColor: string;
  height?: number;
  style?: ViewStyle;
}

/** A smoothly animating horizontal progress bar using scaleX for native-driver performance. */
export default function AnimatedProgressBar({ progress, color, trackColor, height = 10, style }: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [progress, widthAnim]);

  return (
    <View style={[{ height, backgroundColor: trackColor, borderRadius: height / 2, overflow: "hidden" }, style]}>
      <Animated.View
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: color,
          borderRadius: height / 2,
          transform: [{ scaleX: widthAnim }],
          transformOrigin: "left center",
        }}
      />
    </View>
  );
}
