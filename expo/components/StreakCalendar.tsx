import { Flame } from "lucide-react-native";
import React, { useMemo } from "react";
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

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * 5-week heatmap aligned to actual calendar weekdays.
 * Today is highlighted in the correct S/M/T/W/T/F/S column,
 * and every active cell maps to a real date within the current streak.
 */
export default function StreakCalendar({ streak, longestStreak, pathType }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const cells = useMemo(() => {
    // We display 35 cells (5 rows × 7 cols).
    // The last cell is today, placed in its correct weekday column.
    // The first cell is snapped to the Sunday before (today - 34 days).
    const firstDate = new Date(today);
    firstDate.setDate(firstDate.getDate() - 34);
    // Snap back to the previous Sunday so the grid starts on a Sunday.
    const firstDayOfWeek = firstDate.getDay();
    firstDate.setDate(firstDate.getDate() - firstDayOfWeek);

    return Array.from({ length: 35 }, (_, i) => {
      const date = new Date(firstDate);
      date.setDate(date.getDate() + i);
      const timeDiff = today.getTime() - date.getTime();
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const active = daysAgo >= 0 && daysAgo < streak;
      const isToday = daysAgo === 0;
      const isFuture = daysAgo < 0;
      return { active, isToday, isFuture };
    });
  }, [today, streak]);

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

      {/* Day-of-week headers */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        {DAY_LABELS.map((label, i) => (
          <Text
            key={i}
            style={{
              color: colors.mutedForeground,
              fontFamily: FONT.medium,
              fontSize: 10,
              width: 30,
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Calendar grid — 5 rows of 7 */}
      <View style={{ flexDirection: "column", gap: 5 }}>
        {[0, 1, 2, 3, 4].map((row) => (
          <View key={row} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {cells.slice(row * 7, (row + 1) * 7).map((cell, colIdx) => (
              <View
                key={colIdx}
                style={{
                  width: 30,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: cell.isFuture
                    ? "transparent"
                    : cell.active
                      ? theme.color
                      : colors.secondary,
                  opacity: cell.isFuture ? 0 : cell.active ? 1 : 0.5,
                  borderWidth: cell.isToday ? 2 : 0,
                  borderColor: cell.isToday ? theme.color : "transparent",
                }}
              />
            ))}
          </View>
        ))}
      </View>

      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: FONT.regular,
          fontSize: 11,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        {streak > 0 ? `${streak}-day streak going strong 🔥` : "Complete a day to start your streak"}
      </Text>
    </GlassCard>
  );
}
