import { Check, Gift, Plus } from "lucide-react-native";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
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

const BonusChallengeCard = memo(function BonusChallengeCard({
  challenge,
  isCompleted,
  pathType,
  onComplete,
}: Props) {
  const { colors } = useTheme();
  const theme = PATH_THEME[pathType];

  // ── Shimmer on the gift icon background (looping opacity pulse) ──
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (isCompleted) {
      shimmer.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isCompleted, shimmer]);

  // ── Scale-up on completion ──
  const cardScale = useRef(new Animated.Value(1)).current;
  const wasCompleted = useRef<boolean>(isCompleted);

  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      Animated.sequence([
        Animated.spring(cardScale, { toValue: 1.04, useNativeDriver: true, speed: 20, bounciness: 8 }),
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      ]).start();
    }
    wasCompleted.current = isCompleted;
  }, [isCompleted, cardScale]);

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <GlassCard style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Gift icon with shimmering background */}
          <Animated.View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: ACCENT.milestone + "22",
              alignItems: "center",
              justifyContent: "center",
              opacity: shimmer,
            }}
          >
            <Gift size={20} color={ACCENT.milestone} />
          </Animated.View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14 }}>
                {challenge.title}
              </Text>
              <Text style={{ color: ACCENT.milestone, fontFamily: FONT.bold, fontSize: 11 }}>
                +{challenge.xp} XP
              </Text>
            </View>
            <Text
              style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}
              numberOfLines={2}
            >
              {challenge.description}
            </Text>
          </View>

          {/* Action button: Plus (uncompleted) / Check with green bg (completed) */}
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
            {isCompleted ? (
              <Check size={20} color="#FFF" strokeWidth={3} />
            ) : (
              <Plus size={20} color={theme.color} strokeWidth={2.5} />
            )}
          </PressableScale>
        </View>
      </GlassCard>
    </Animated.View>
  );
});

export default BonusChallengeCard;
