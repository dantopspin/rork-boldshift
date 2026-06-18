import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COLORS = [
  "#F5A623",
  "#EC4899",
  "#34C9A3",
  "#1A8CFF",
  "#9B49E8",
  "#FB5436",
  "#22D3EE",
  "#FFD700",
  "#FF6B6B",
  "#48C6EF",
];
const PIECE_COUNT = 50;

function randomBetween(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

interface ConfettiPieceData {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  xDrift: number;
}

interface Props {
  visible: boolean;
  onFinish?: () => void;
}

/**
 * Lightweight confetti overlay that rains colorful pieces from the top of the screen.
 * Used to celebrate milestone completions (days 1, 7, 14, 21, 30, 45, 60).
 * All animations run on the native thread for smooth 60 fps.
 */
export default function ConfettiOverlay({ visible, onFinish }: Props) {
  const piecesRef = useRef<ConfettiPieceData[] | null>(null);

  // Build piece data once and reuse across re-triggers
  if (piecesRef.current === null) {
    piecesRef.current = Array.from({ length: PIECE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(6, 16),
      xDrift: randomBetween(-80, 80),
    }));
  }

  useEffect(() => {
    if (!visible || !piecesRef.current) return;

    const pieces = piecesRef.current;

    const animations = pieces.map((piece) => {
      const startX = randomBetween(20, SCREEN_WIDTH - 20);
      piece.x.setValue(startX);
      piece.y.setValue(randomBetween(-200, -20));
      piece.rotation.setValue(0);
      piece.opacity.setValue(1);

      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 100,
          duration: randomBetween(2500, 4500),
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: startX + piece.xDrift,
          duration: randomBetween(2500, 4500),
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: randomBetween(4, 14),
          duration: randomBetween(2500, 4500),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(randomBetween(0, 600)),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: randomBetween(1800, 3500),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    const composite = Animated.parallel(animations);
    composite.start(() => {
      onFinish?.();
    });

    return () => {
      composite.stop();
    };
  }, [visible, onFinish]);

  if (!visible || !piecesRef.current) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {piecesRef.current.map((piece, i) => {
        const spin = piece.rotation.interpolate({
          inputRange: [0, 14],
          outputRange: ["0deg", "2520deg"],
        });
        const w = piece.size;
        const h = piece.size * 0.6;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: w,
              height: h,
              backgroundColor: piece.color,
              borderRadius: 2,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: spin },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
