import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { DARK, LIGHT, Palette } from "@/constants/theme";

const STORAGE_KEY = "boldshift_theme";
type Mode = "dark" | "light";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<Mode>(systemScheme === "dark" ? "dark" : "light");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") setMode(stored);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setThemeMode = (next: Mode): void => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = (): void => setThemeMode(mode === "dark" ? "light" : "dark");

  const colors: Palette = mode === "dark" ? DARK : LIGHT;
  const isDark = mode === "dark";

  return { mode, isDark, colors, setThemeMode, toggleTheme, isLoaded };
});
