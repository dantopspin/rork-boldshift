import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesOfferings, LOG_LEVEL } from "react-native-purchases";
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

// Eager-prefetch offerings so the paywall loads instantly
let _offeringsCache: PurchasesOfferings | null = null;
let _offeringsPromise: Promise<PurchasesOfferings | null> | null = null;

function prefetchOfferings(): Promise<PurchasesOfferings | null> {
  if (_offeringsCache) return Promise.resolve(_offeringsCache);
  if (_offeringsPromise) return _offeringsPromise;
  _offeringsPromise = Purchases.getOfferings()
    .then((o) => {
      _offeringsCache = o;
      return o;
    })
    .catch(() => null)
    .finally(() => {
      _offeringsPromise = null;
    });
  return _offeringsPromise;
}

// Kick off prefetch immediately
if (apiKey) {
  prefetchOfferings();
}

/**
 * RevenueCat-backed subscription state. Offerings are prefetched at module load
 * and refreshed via react-query; purchase/restore return success so the UI can
 * react correctly.
 */
export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [tier, setTier] = useState<Tier>("free");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showPaywallAfterOnboarding, setShowPaywallAfterOnboarding] = useState<boolean>(false);

  // Lightweight offerings query — uses the module-level cache as initialData
  const { data: offerings } = useQuery({
    queryKey: ["rc-offerings"],
    queryFn: async (): Promise<PurchasesOfferings | null> => {
      try {
        const o = await Purchases.getOfferings();
        _offeringsCache = o;
        return o;
      } catch {
        return _offeringsCache;
      }
    },
    initialData: _offeringsCache,
    staleTime: 1000 * 60 * 10, // 10 min
  });

  // Fetch customer info to determine active entitlements
  const syncTier = useCallback(async (): Promise<void> => {
    try {
      const info = await Purchases.getCustomerInfo();
      const active = Object.keys(info.entitlements.active);
      if (active.includes("pro")) {
        const entitlement = info.entitlements.active["pro"];
        const productId = entitlement?.productIdentifier ?? "";
        if (productId.toLowerCase().includes("weekly")) {
          setTier("pro_weekly");
        } else {
          setTier("pro_monthly");
        }
      } else {
        // RevenueCat says not active — clear stored tier
        setTier("free");
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
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

  /**
   * Attempt a purchase. Returns true if the purchase succeeded and the "pro"
   * entitlement was activated. Returns false if the user cancelled, the package
   * wasn't found, or the purchase failed for any other reason.
   */
  const purchase = useCallback(
    async (plan: "pro_monthly" | "pro_weekly"): Promise<boolean> => {
      try {
        // Use offerings from cache/query — no extra network call
        const currentOfferings = offerings ?? _offeringsCache;
        const pkg = plan === "pro_weekly"
          ? currentOfferings?.current?.weekly
          : currentOfferings?.current?.monthly;

        if (!pkg) {
          console.error(`No ${plan} package found in current offering`);
          return false;
        }

        const result = await Purchases.purchasePackage(pkg);
        if (result.customerInfo.entitlements.active["pro"]) {
          persist(plan);
          setShowPaywall(false);
          setShowPaywallAfterOnboarding(false);
          return true;
        }
        return false;
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; code?: string };
        if (err.userCancelled) return false;
        console.error("Purchase failed", e);
        return false;
      }
    },
    [offerings, persist],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active["pro"]) {
        const productId = info.entitlements.active["pro"]?.productIdentifier ?? "";
        const plan: Tier = productId.toLowerCase().includes("weekly") ? "pro_weekly" : "pro_monthly";
        persist(plan);
        setShowPaywall(false);
        setShowPaywallAfterOnboarding(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
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
      offerings,
      purchase,
      restore,
    }),
    [tier, isPro, maxDays, isLoaded, showPaywall, showPaywallAfterOnboarding, offerings, purchase, restore],
  );
});
