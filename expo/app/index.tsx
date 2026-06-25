import { Redirect } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useProgress } from "@/providers/ProgressProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { FONT } from "@/constants/theme";

/** Entry router: send to onboarding or the journey depending on saved state. */
export default function Index() {
  const { progress, isLoaded } = useProgress();
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1.0, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1400, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.Text
          style={[
            styles.brand,
            { color: colors.foreground, opacity },
          ]}
        >
          BoldShift
        </Animated.Text>
      </View>
    );
  }

  return <Redirect href={progress.selectedPath ? "/(tabs)/journey" : "/onboarding"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: FONT.extrabold,
    fontSize: 36,
    letterSpacing: -1,
  },
});
