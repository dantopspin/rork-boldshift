import { Flame } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import { Text, View } from "react-native";
import GlassCard from "@/components/GlassCard";
import { FONT, PATH_THEME } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";
import { PathType } from "@/types";

interface Props {
  streak: number;
  longestStreak: number;
  pathType: PathType | null;
  completedDates?: string[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ROWS = 5;
const COLS = 7;
const TOTAL_CELLS = ROWS * COLS; // 35

function dateToISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * A 5-week heat-map calendar grid (Sun–Sat) that highlights days where the
 * user completed a challenge. Today always sits at the last row + today's
 * day-of-week column.
 */
const StreakCalendar = memo(function StreakCalendar({ streak, longestStreak, pathType, completedDates }: Props) {
  const { colors } = useTheme();
  const resolvedPath = (pathType ?? "introvert") as PathType;
  const theme = PATH_THEME[resolvedPath];

  const completedSet = useMemo(() => new Set(completedDates ?? []), [completedDates]);

  const rows = useMemo(() => {
    const today = new Date();
    const todayDow = today.getDay(); // 0 = Sun … 6 = Sat
    const todayFlat = 28 + todayDow; // row 4, col todayDow

    const dates: string[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const daysAgo = todayFlat - i;
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      dates.push(dateToISO(d));
    }

    const result: boolean[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const rowCells: boolean[] = [];
      for (let c = 0; c < COLS; c++) {
        const flatIndex = r * COLS + c;
        const dateStr = dates[flatIndex]!;
        rowCells.push(completedSet.has(dateStr));
      }
      result.push(rowCells);
    }
    return result;
  }, [completedSet]);

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
      <View style={{ flexDirection: "row", gap: 5, marginBottom: 8 }}>
        {DAY_LABELS.map((d, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              color: colors.mutedForeground,
              fontFamily: FONT.bold,
              fontSize: 10,
              textAlign: "center",
            }}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ gap: 5 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 5 }}>
            {row.map((active, ci) => (
              <View
                key={ci}
                style={{
                  flex: 1,
                  height: 26,
                  borderRadius: 7,
                  backgroundColor: active ? theme.color : colors.secondary,
                  opacity: active ? 1 : 0.4,
                }}
              />
            ))}
          </View>
        ))}
      </View>

      <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, marginTop: 10, textAlign: "center" }}>
        {streak > 0 ? `${streak}-day streak going strong!` : "Complete a day to start your streak"}
      </Text>
    </GlassCard>
  );
});

export default StreakCalendar;
