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

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A 5-week heatmap that highlights the most recent `streak` days, properly aligned by day-of-week. */
export default function StreakCalendar({ streak, longestStreak, pathType }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];
  const totalCells = 35;

  /** Build 5 rows × 7 columns with correct day-of-week offset so active cells align under the right day letter. */
  const rows = useMemo(() => {
    const today = new Date();
    const todayDow = today.getDay(); // 0=Sun … 6=Sat

    // The cell totalCells-1 positions before today lands at firstCellDow.
    const firstCellDow = (todayDow - (totalCells - 1) + 70) % 7;

    // Build a flat array: true = active streak day, false = inactive
    const cells: boolean[] = Array.from({ length: totalCells }, (_, i) => {
      const distanceFromToday = totalCells - 1 - i;
      return distanceFromToday >= 0 && distanceFromToday < streak;
    });

    // Partition into 5 rows of 7, inserting empty placeholders for firstCellDow offset
    const rowsResult: boolean[][] = [];
    let cellIdx = 0;

    for (let row = 0; row < 5; row++) {
      const rowCells: boolean[] = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstCellDow) {
          rowCells.push(false);
        } else if (cellIdx < totalCells) {
          rowCells.push(cells[cellIdx]);
          cellIdx++;
        }
      }
      rowsResult.push(rowCells);
    }
    return rowsResult;
  }, [streak, totalCells]);

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
        {DAYS.map((d, i) => (
          <Text key={i} style={{ flex: 1, color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 10, textAlign: "center" }}>
            {d}
          </Text>
        ))}
      </View>

      {/* 5 rows × 7 columns, stretches to full card width */}
      <View style={{ gap: 5 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 5 }}>
            {row.map((active, ci) => (
              <View
                key={ci}
                style={{
                  flex: 1,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: active ? theme.color : colors.secondary,
                  opacity: active ? 1 : 0.5,
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
}