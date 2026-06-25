import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, View } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#1A8CFF", "#FA7918", "#9B49E8", "#34C9A3", "#F5A623",
  "#FB5436", "#22D3EE", "#EC4899", "#8B5CF6", "#10B981",
];

const PARTICLE_COUNT = 50;
const DURATION_MS = 2800;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: "circle" | "square";
  targetX: number;
}

interface Props {
  visible: boolean;
  onFinish: () => void;
}

/**
 * Confetti celebration overlay rendered inside a React Native Modal so it
 * always sits above the entire view hierarchy — including other Modals.
 */
export default function ConfettiOverlay({ visible, onFinish }: Props) {
  const particles = useRef<Particle[]>([]);
  const hasStarted = useRef<boolean>(false);

  const handleFinish = useCallback((): void => {
    hasStarted.current = false;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    if (!visible || hasStarted.current) return;
    hasStarted.current = true;

    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const startX = Math.random() * SCREEN_W;
      const drift = (Math.random() - 0.5) * 160;
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(-30 - Math.random() * 200),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 7 + Math.random() * 9,
        shape: (Math.random() > 0.5 ? "circle" : "square") as "circle" | "square",
        targetX: startX + drift,
      };
    });

    particles.current = newParticles;

    const animations = newParticles.map((p) => {
      const delay = Math.random() * 400;
      const dur = 1600 + Math.random() * 1200;
      const rotationTarget = (Math.random() - 0.5) * 3;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: p.targetX, duration: dur, delay, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: SCREEN_H + 80, duration: dur, delay, useNativeDriver: true }),
        Animated.timing(p.rotation, { toValue: rotationTarget, duration: dur, delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(p.scale, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.delay(dur - 600 - delay - 180),
          Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      handleFinish();
    });

    return () => {
      newParticles.forEach((p) => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.rotation.stopAnimation();
        p.opacity.stopAnimation();
        p.scale.stopAnimation();
      });
    };
  }, [visible, handleFinish]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" supportedOrientations={["portrait"]}>
      <View
        pointerEvents="none"
        style={{
          flex: 1,
          position: "absolute",
          inset: 0,
        }}
      >
        {particles.current.map((p, i) => {
          const rotateInterpolated = p.rotation.interpolate({
            inputRange: [-3, 3],
            outputRange: ["-180deg", "180deg"],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: p.shape === "circle" ? p.size / 2 : 3,
                backgroundColor: p.color,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: rotateInterpolated },
                  { scale: p.scale },
                ],
                opacity: p.opacity,
              }}
            />
          );
        })}
      </View>
    </Modal>
  );
}
