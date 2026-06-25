import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { DARK, LIGHT, Palette } from "@/constants/theme";

const STORAGE_KEY = "boldshift_theme";
type Mode = "dark" | "light";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<Mode>(systemScheme === "dark" ? "dark" : "light");
  const [hasManualPreference, setHasManualPreference] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load stored preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") {
          setMode(stored);
          setHasManualPreference(true);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Auto-switch theme when the system appearance changes, but only if the user
  // hasn't set an explicit manual preference stored in AsyncStorage.
  useEffect(() => {
    if (!isLoaded || hasManualPreference || !systemScheme) return;
    setMode(systemScheme === "dark" ? "dark" : "light");
  }, [systemScheme, isLoaded, hasManualPreference]);

  const setThemeMode = (next: Mode): void => {
    setMode(next);
    setHasManualPreference(true);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = (): void => setThemeMode(mode === "dark" ? "light" : "dark");

  const isDark = useMemo(() => mode === "dark", [mode]);
  const colors: Palette = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  return {
    mode,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
    isLoaded,
    /** Renders a StatusBar that stays in sync with the current theme across the whole app. */
    StatusBar: <StatusBar style={isDark ? "light" : "dark"} />,
  };
});
