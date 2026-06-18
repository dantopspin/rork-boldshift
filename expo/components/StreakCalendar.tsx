import { Flame } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import GlassCard from "@/components/GlassCard";
import { FONT, PATH_THEME } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";
import { PathType } from "@/types";

interface Props {
  streak: number;
  longestStreak: number;
  pathType: PathType;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A simple 5-week heatmap that highlights the most recent `streak` days. */
export default function StreakCalendar({ streak, longestStreak, pathType }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const totalCells = 35;
  // Mark the trailing `streak` cells (ending today) as active.
  const today = new Date();
  const todayIndex = totalCells - 1;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const distanceFromToday = todayIndex - i;
    const active = distanceFromToday >= 0 && distanceFromToday < streak;
    return active;
  });

  return (
    <GlassCard style={{ padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Flame size={18} color={theme.color} />
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>Streak Calendar</Text>
        </View>
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 12 }}>
          Best: {longestStreak}d
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        {DAYS.map((d, i) => (
          <Text key={i} style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 10, width: 30, textAlign: "center" }}>
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "space-between" }}>
        {cells.map((active, i) => (
          <View
            key={i}
            style={{
              width: 30,
              height: 22,
              borderRadius: 6,
              backgroundColor: active ? theme.color : colors.secondary,
              opacity: active ? 1 : 0.5,
            }}
          />
        ))}
      </View>

      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, marginTop: 10, textAlign: "center" }}>
        {streak > 0 ? `${streak}-day streak going strong 🔥` : "Complete a day to start your streak"}
      </Text>
    </GlassCard>
  );
}
