import {
  Award,
  Crown,
  Flame,
  Heart,
  Rocket,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react-native";
import React from "react";
import { AchievementIcon } from "@/data/achievements";

interface Props {
  icon: AchievementIcon;
  size?: number;
  color: string;
}

/** Maps an achievement's icon name to a lucide icon component. */
export default function AchievementIconView({ icon, size = 20, color }: Props) {
  const common = { size, color };
  switch (icon) {
    case "trophy":
      return <Trophy {...common} />;
    case "flame":
      return <Flame {...common} />;
    case "star":
      return <Star {...common} />;
    case "zap":
      return <Zap {...common} />;
    case "target":
      return <Target {...common} />;
    case "crown":
      return <Crown {...common} />;
    case "rocket":
      return <Rocket {...common} />;
    case "heart":
      return <Heart {...common} />;
    default:
      return <Star {...common} />;
  }
}
