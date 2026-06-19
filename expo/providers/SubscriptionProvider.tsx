import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo, LOG_LEVEL } from "react-native-purchases";
import { FREE_DAYS, TOTAL_DAYS } from "@/types";

const STORAGE_KEY = "boldshift_subscription";
export type Tier = "free" | "pro_monthly" | "pro_weekly";

function getRCToken(): string {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "",
  });
}

// Configure RevenueCat once at module level
const apiKey = getRCToken();
if (apiKey) {
  Purchases.configure({ apiKey });
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
}

/**
 * RevenueCat-backed subscription state. Customer info and offerings are fetched
 * via react-query; purchase/restore call through the Purchases SDK directly so
 * entitlements stay in sync.
 */
export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [tier, setTier] = useState<Tier>("free");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showPaywallAfterOnboarding, setShowPaywallAfterOnboarding] = useState<boolean>(false);

  // Fetch customer info to determine active entitlements
  const { refetch: refetchCustomerInfo } = useQuery({
    queryKey: ["rc-customer-info"],
    queryFn: async (): Promise<CustomerInfo> => {
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Sync tier from customer info
  const syncTier = useCallback(async (): Promise<void> => {
    try {
      const info = await Purchases.getCustomerInfo();
      const active = Object.keys(info.entitlements.active);
      if (active.includes("pro")) {
        // Determine which product is active from the entitlement
        const entitlement = info.entitlements.active["pro"];
        const productId = entitlement?.productIdentifier ?? "";
        if (productId.toLowerCase().includes("weekly")) {
          setTier("pro_weekly");
        } else {
          setTier("pro_monthly");
        }
      } else {
        // Fall back to cached tier from AsyncStorage
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "pro_monthly" || stored === "pro_weekly") {
          // RevenueCat says not active — respect that
          setTier("free");
        }
      }
    } catch {
      // Offline — use cached tier
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "pro_monthly" || stored === "pro_weekly" || stored === "free") {
          setTier(stored);
        }
      } catch {}
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    syncTier();
  }, [syncTier]);

  const persist = useCallback((next: Tier): void => {
    setTier(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const purchase = useCallback(
    async (plan: "pro_monthly" | "pro_weekly"): Promise<void> => {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = plan === "pro_weekly"
          ? offerings.current?.weekly
          : offerings.current?.monthly;

        if (!pkg) {
          console.error(`No ${plan} package found in current offering`);
          return;
        }

        const result = await Purchases.purchasePackage(pkg);
        if (result.customerInfo.entitlements.active["pro"]) {
          persist(plan);
          setShowPaywall(false);
          setShowPaywallAfterOnboarding(false);
        }
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; code?: string };
        if (err.userCancelled) return;
        console.error("Purchase failed", e);
      }
    },
    [persist],
  );

  const restore = useCallback(async (): Promise<void> => {
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active["pro"]) {
        const productId = info.entitlements.active["pro"]?.productIdentifier ?? "";
        const plan: Tier = productId.toLowerCase().includes("weekly") ? "pro_weekly" : "pro_monthly";
        persist(plan);
        setShowPaywall(false);
        setShowPaywallAfterOnboarding(false);
      }
    } catch (e) {
      console.error("Restore failed", e);
    }
  }, [persist]);

  const isPro = tier !== "free";
  const maxDays = isPro ? TOTAL_DAYS : FREE_DAYS;

  return useMemo(
    () => ({
      tier,
      isPro,
      maxDays,
      isLoaded,
      showPaywall,
      setShowPaywall,
      showPaywallAfterOnboarding,
      setShowPaywallAfterOnboarding,
      purchase,
      restore,
    }),
    [tier, isPro, maxDays, isLoaded, showPaywall, showPaywallAfterOnboarding, purchase, restore],
  );
});
