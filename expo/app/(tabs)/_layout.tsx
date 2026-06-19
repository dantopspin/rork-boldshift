import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { BookOpen, Home, Trophy, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { ACCENT, FONT } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  const tabColors: Record<string, string> = {
    journey: ACCENT.introvert,
    milestones: ACCENT.milestone,
    journal: colors.primary,
    profile: ACCENT.assertiveness,
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        freezeOnBlur: true,
        lazy: true,
        tabBarActiveTintColor: tabColors[route.name] ?? colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 11 },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg, borderTopWidth: 1, borderTopColor: colors.glassBorder }]} />
          </View>
        ),
      })}
    >
      <Tabs.Screen
        name="journey"
        options={{ title: "Journey", tabBarIcon: ({ color, focused }) => <Home color={color} size={22} strokeWidth={focused ? 2.6 : 1.9} /> }}
      />
      <Tabs.Screen
        name="milestones"
        options={{ title: "Milestones", tabBarIcon: ({ color, focused }) => <Trophy color={color} size={22} strokeWidth={focused ? 2.6 : 1.9} /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: "Journal", tabBarIcon: ({ color, focused }) => <BookOpen color={color} size={22} strokeWidth={focused ? 2.6 : 1.9} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <User color={color} size={22} strokeWidth={focused ? 2.6 : 1.9} /> }}
      />
    </Tabs>
  );
}
