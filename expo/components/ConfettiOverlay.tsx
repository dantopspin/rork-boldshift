import React, { useCallback, useEffect, useState } from "react";
import { Animated, Dimensions, Modal, Platform, StyleSheet, Text, View } from "react-native";

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
  shape: "circle" | "square" | "star";
  targetX: number;
}

interface Props {
  visible: boolean;
  onFinish: () => void;
}

/**
 * Confetti celebration overlay rendered inside a React Native Modal so it
 * always sits above the entire view hierarchy — including other Modals.
 *
 * Particles burst from two cannons (bottom-left and bottom-right) in an
 * upward arc, then scatter and fall for a celebratory cannon effect.
 */
export default function ConfettiOverlay({ visible, onFinish }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const handleFinish = useCallback((): void => {
    setHasStarted(false);
    setParticles([]);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    if (!visible || hasStarted) return;
    setHasStarted(true);

    const centerY = SCREEN_H / 2;

    // ── Cannon origins: bottom-left and bottom-right ──
    const cannonOrigins = [
      { x: 24, y: SCREEN_H },               // bottom-left cannon
      { x: SCREEN_W - 24, y: SCREEN_H },     // bottom-right cannon
    ];

    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const cannon = cannonOrigins[Math.random() > 0.5 ? 1 : 0];
      // Spread angle: fan outward from the cannon point
      const spreadAngle = (Math.random() - 0.5) * 0.8; // radians
      const burstDistance = 200 + Math.random() * 300;
      const targetX = cannon.x + Math.sin(spreadAngle) * burstDistance;
      const clampX = Math.max(0, Math.min(SCREEN_W, targetX));

      return {
        x: new Animated.Value(cannon.x),
        y: new Animated.Value(cannon.y),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 7 + Math.random() * 9,
        shape: ((): "circle" | "square" | "star" => {
          const r = Math.random();
          if (r < 0.25) return "star";
          if (r < 0.6) return "circle";
          return "square";
        })(),
        targetX: clampX,
      };
    });

    setParticles(newParticles);

    const animations = newParticles.map((p) => {
      const delay = Math.random() * 400;
      const burstUp = 120 + Math.random() * 180;
      const burstDur = 350 + Math.random() * 250;
      const fallDur = 1400 + Math.random() * 1200;
      const rotationTarget = (Math.random() - 0.5) * 4;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: p.targetX, duration: burstDur + fallDur, delay, useNativeDriver: true }),
        Animated.sequence([
          // Burst upward from the cannon
          Animated.timing(p.y, { toValue: centerY - burstUp, duration: burstDur, delay, useNativeDriver: true }),
          // Then fall to the bottom
          Animated.timing(p.y, { toValue: SCREEN_H + 80, duration: fallDur, useNativeDriver: true }),
        ]),
        Animated.timing(p.rotation, { toValue: rotationTarget, duration: burstDur + fallDur, delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(p.scale, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.delay(burstDur + fallDur - 400 - delay - 150),
          Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      handleFinish();
    });

    return () => {
      setHasStarted(false);
      newParticles.forEach((p) => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.rotation.stopAnimation();
        p.opacity.stopAnimation();
        p.scale.stopAnimation();
      });
    };
  }, [visible, hasStarted, handleFinish]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === "android"}
      supportedOrientations={["portrait"]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particles.map((p, i) => {
          const rotateInterpolated = p.rotation.interpolate({
            inputRange: [-3, 3],
            outputRange: ["-180deg", "180deg"],
          });
          const particleStyle = {
            position: "absolute" as const,
            width: p.size,
            height: p.size,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: rotateInterpolated },
              { scale: p.scale },
            ],
            opacity: p.opacity,
          };

          if (p.shape === "star") {
            return (
              <Animated.Text
                key={i}
                style={[
                  particleStyle,
                  {
                    fontSize: p.size + 4,
                    lineHeight: p.size + 4,
                    color: p.color,
                    textAlign: "center",
                  },
                ]}
              >
                ★
              </Animated.Text>
            );
          }

          return (
            <Animated.View
              key={i}
              style={[
                particleStyle,
                {
                  borderRadius: p.shape === "circle" ? p.size / 2 : 3,
                  backgroundColor: p.color,
                },
              ]}
            />
          );
        })}
      </View>
    </Modal>
  );
}
