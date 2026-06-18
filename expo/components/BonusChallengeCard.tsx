import { Check, Gift } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import GlassCard from "@/components/GlassCard";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, PATH_THEME } from "@/constants/theme";
import { BonusChallenge } from "@/data/bonusChallenges";
import { useTheme } from "@/providers/ThemeProvider";
import { PathType } from "@/types";

interface Props {
  challenge: BonusChallenge;
  isCompleted: boolean;
  pathType: PathType;
  onComplete: () => void;
}

export default function BonusChallengeCard({ challenge, isCompleted, pathType, onComplete }: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];

  return (
    <GlassCard style={{ padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT.milestone + "22", alignItems: "center", justifyContent: "center" }}>
          <Gift size={20} color={ACCENT.milestone} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>{challenge.title}</Text>
            <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 11 }}>+{challenge.xp} XP</Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
        <PressableScale
          onPress={() => {
            if (!isCompleted) {
              onComplete();
            }
          }}
          disabled={isCompleted}
          haptic={isCompleted ? false : "success"}
          innerStyle={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isCompleted ? ACCENT.success : "transparent",
            borderWidth: isCompleted ? 0 : 2,
            borderColor: theme.color,
          }}
        >
          <Check size={20} color={isCompleted ? "#FFF" : theme.color} strokeWidth={3} />
        </PressableScale>
      </View>
    </GlassCard>
  );
}
