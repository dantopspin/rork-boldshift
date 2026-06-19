import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProgressProvider } from "@/providers/ProgressProvider";
import { SubscriptionProvider, useSubscription } from "@/providers/SubscriptionProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const segments = useSegments() as string[];
  const { showPaywallAfterOnboarding, setShowPaywallAfterOnboarding } = useSubscription();
  const navigatingRef = useRef<boolean>(false);

  // Auto-show paywall after onboarding completes for the first time
  useEffect(() => {
    if (
      showPaywallAfterOnboarding &&
      !navigatingRef.current &&
      !segments.includes("paywall")
    ) {
      navigatingRef.current = true;
      setShowPaywallAfterOnboarding(false);
      // Small delay so the journey screen mounts first, then present paywall
      const id = setTimeout(() => {
        router.push("/paywall");
        navigatingRef.current = false;
      }, 600);
      return () => {
        clearTimeout(id);
        navigatingRef.current = false;
      };
    }
    return undefined;
  }, [showPaywallAfterOnboarding, segments, router, setShowPaywallAfterOnboarding]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade", animationDuration: 160 }} />
        <Stack.Screen name="onboarding" options={{ animation: "fade", animationDuration: 240 }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade", animationDuration: 200 }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", animation: "slide_from_bottom", animationDuration: 220 }} />
        <Stack.Screen name="privacy" options={{ animationDuration: 200 }} />
        <Stack.Screen name="terms" options={{ animationDuration: 200 }} />
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
