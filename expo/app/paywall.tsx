import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Award, Check, Crown, Flame, Sparkles, X, Zap } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, GOLD_GRADIENT } from "@/constants/theme";
import { triggerHaptic } from "@/lib/haptics";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useTheme } from "@/providers/ThemeProvider";

const FEATURES = [
  { icon: Crown, text: "Unlock all 60 days of challenges" },
  { icon: Zap, text: "Access every confidence path" },
  { icon: Award, text: "Earn every achievement & badge" },
  { icon: Flame, text: "Advanced streak protection" },
  { icon: Sparkles, text: "Complete the full transformation" },
];

type Plan = "pro_monthly" | "pro_weekly";

export default function Paywall() {
  const router = useRouter();
  const { colors } = useTheme();
  const { purchase, restore, offerings } = useSubscription();
  const [plan, setPlan] = useState<Plan>("pro_monthly");
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const currentOffering = offerings?.current;
  const monthlyPackage = currentOffering?.monthly;
  const weeklyPackage = currentOffering?.weekly;

  // If offerings haven't loaded yet, still show the UI with fallback prices
  const monthlyPrice = monthlyPackage?.product?.priceString ?? "$14.99";
  const weeklyPrice = weeklyPackage?.product?.priceString ?? "$4.99";

  const handlePurchase = async (): Promise<void> => {
    if (isPurchasing) return;
    triggerHaptic("success");
    setIsPurchasing(true);
    setPurchaseError(null);
    try {
      const success = await purchase(plan);
      if (success) {
        router.back();
      } else {
        setPurchaseError("Purchase was cancelled or failed. Please try again.");
      }
    } catch {
      setPurchaseError("Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    if (isRestoring) return;
    triggerHaptic("light");
    setIsRestoring(true);
    setPurchaseError(null);
    try {
      const success = await restore();
      if (success) {
        router.back();
      }
    } catch {
      setPurchaseError("Restore failed. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Close button */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingTop: 8 }}>
          <PressableScale onPress={() => router.back()} hitSlop={10} innerStyle={{ padding: 8, borderRadius: 20, backgroundColor: colors.card }}>
            <X size={20} color={colors.mutedForeground} />
          </PressableScale>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <LinearGradient colors={GOLD_GRADIENT} style={{ width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Crown size={32} color="#FFF" />
            </LinearGradient>
            <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 26, textAlign: "center" }}>Unlock BoldShift Pro</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              Go beyond day 15 and complete your full 60-day transformation.
            </Text>
          </View>

          {/* Feature list */}
          <View style={{ gap: 10, marginBottom: 22 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: ACCENT.milestone + "1F", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} color={ACCENT.milestone} />
                  </View>
                  <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 14, flex: 1 }}>{f.text}</Text>
                  <Check size={16} color={ACCENT.success} strokeWidth={3} />
                </View>
              );
            })}
          </View>

          {/* Plan options — always visible, prices show immediately via cache */}
          <View style={{ gap: 10 }}>
            <PlanOption
              active={plan === "pro_monthly"}
              onPress={() => { triggerHaptic("light"); setPlan("pro_monthly"); }}
              title="Monthly"
              price={`${monthlyPrice}/mo`}
              subtitle="Best value"
              badge="POPULAR"
            />
            <PlanOption
              active={plan === "pro_weekly"}
              onPress={() => { triggerHaptic("light"); setPlan("pro_weekly"); }}
              title="Weekly"
              price={`${weeklyPrice}/wk`}
              subtitle="Billed weekly"
            />
          </View>

          {/* Error message */}
          {purchaseError && (
            <Text style={{ color: colors.destructive, fontFamily: FONT.medium, fontSize: 13, textAlign: "center", marginTop: 12 }}>
              {purchaseError}
            </Text>
          )}

          {/* CTA */}
          <View style={{ marginTop: purchaseError ? 10 : 20 }}>
            <AppButton
              label={isPurchasing ? "Processing…" : "Continue with Pro"}
              size="lg"
              variant="gold"
              fullWidth
              onPress={handlePurchase}
              disabled={isPurchasing}
            />
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, textAlign: "center", marginTop: 10, lineHeight: 17 }}>
              Cancel anytime. No free trials.
            </Text>
          </View>

          {/* Restore purchases */}
          <View style={{ marginTop: 14, alignItems: "center" }}>
            <PressableScale
              onPress={handleRestore}
              haptic="light"
              disabled={isRestoring}
              innerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.medium, fontSize: 13 }}>
                {isRestoring ? "Restoring…" : "Restore Purchases"}
              </Text>
            </PressableScale>
          </View>
        </View>

        {/* Legal */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12, alignItems: "center" }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textAlign: "center", lineHeight: 16 }}>
            By subscribing, you agree to our{" "}
            <Link href="/terms" style={{ textDecorationLine: "underline" }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textDecorationLine: "underline" }}>Terms of Use</Text>
            </Link>
            {" "}&{" "}
            <Link href="/privacy" style={{ textDecorationLine: "underline" }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11, textDecorationLine: "underline" }}>Privacy Policy</Text>
            </Link>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PlanOption({ active, onPress, title, price, subtitle, badge }: { active: boolean; onPress: () => void; title: string; price: string; subtitle: string; badge?: string }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      innerStyle={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: active ? ACCENT.milestone : colors.border,
        backgroundColor: active ? ACCENT.milestone + "12" : colors.cardSolid,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 16 }}>{title}</Text>
          {badge && (
            <View style={{ backgroundColor: ACCENT.milestone, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 10 }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: colors.foreground, fontFamily: FONT.extrabold, fontSize: 16 }}>{price}</Text>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: active ? ACCENT.milestone : colors.border, alignItems: "center", justifyContent: "center", marginTop: 4, backgroundColor: active ? ACCENT.milestone : "transparent" }}>
          {active && <Check size={13} color="#FFF" strokeWidth={3} />}
        </View>
      </View>
    </PressableScale>
  );
}
