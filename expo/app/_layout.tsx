import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProgressProvider } from "@/providers/ProgressProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";

SplashScreen.preventAutoHideAsync();

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
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="privacy" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="terms" options={{ animation: "slide_from_right" }} />
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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
