import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useProgress } from "@/providers/ProgressProvider";
import { useTheme } from "@/providers/ThemeProvider";

/** Entry router: send to onboarding or the journey depending on saved state. */
export default function Index() {
  const { progress, isLoaded } = useProgress();
  const { colors } = useTheme();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={progress.selectedPath ? "/(tabs)/journey" : "/onboarding"} />;
}
