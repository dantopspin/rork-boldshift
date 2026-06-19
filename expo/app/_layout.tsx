import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProgressProvider } from "@/providers/ProgressProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade", animationDuration: 200 }} />
        <Stack.Screen name="onboarding" options={{ animation: "fade", animationDuration: 300 }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade", animationDuration: 240 }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom", animationDuration: 260 }} />
        <Stack.Screen name="privacy" options={{ animationDuration: 260 }} />
        <Stack.Screen name="terms" options={{ animationDuration: 260 }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SubscriptionProvider>
          <ProgressProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ProgressProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
