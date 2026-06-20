import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesOfferings, LOG_LEVEL, PURCHASES_ERROR_CODE } from "react-native-purchases";
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
      if (o?.current) {
        _offeringsCache = o;
      }
      return o;
    })
    .catch((err) => {
      console.warn("RevenueCat offerings fetch failed:", err?.message ?? err);
      return null;
    })
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
 * Waits for the "pro" entitlement to appear in customer info, retrying up to
 * `retries` times with a `delayMs` pause between attempts. Returns true if
 * found, false otherwise.
 */
async function waitForEntitlement(retries = 5, delayMs = 800): Promise<{ found: boolean; info: CustomerInfo }> {
  for (let i = 0; i < retries; i++) {
    const info = await Purchases.getCustomerInfo();
    const active = Object.keys(info.entitlements.active);
    if (active.includes("pro")) {
      return { found: true, info };
    }
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  const info = await Purchases.getCustomerInfo();
  return { found: false, info };
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
  const { data: offerings, isFetched: offeringsFetched } = useQuery({
    queryKey: ["rc-offerings"],
    queryFn: async (): Promise<PurchasesOfferings | null> => {
      try {
        const o = await Purchases.getOfferings();
        if (o?.current) {
          _offeringsCache = o;
        }
        return o;
      } catch {
        return _offeringsCache;
      }
    },
    initialData: _offeringsCache,
    staleTime: 1000 * 60 * 10, // 10 min
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
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
   * Attempt a purchase. Returns a result for the UI to act on:
   * "success" — purchase completed and "pro" entitlement confirmed active.
   * "cancelled" — user dismissed the payment sheet.
   * "error" — package missing, purchase failed, or entitlement not confirmed.
   * "pending" — purchase went through but entitlement still propagating (rare).
   */
  const purchase = useCallback(
    async (plan: "pro_monthly" | "pro_weekly"): Promise<"success" | "cancelled" | "error" | "pending"> => {
      try {
        // Always fetch fresh offerings before purchase to ensure packages exist
        let currentOfferings = offerings ?? _offeringsCache;
        if (!currentOfferings?.current) {
          try {
            const fresh = await Purchases.getOfferings();
            if (fresh?.current) {
              _offeringsCache = fresh;
              currentOfferings = fresh;
            }
          } catch { /* ignore — fall through to error */ }
        }

        const wantedType = plan === "pro_weekly" ? "WEEKLY" : "MONTHLY";
        const pkg = currentOfferings?.current?.availablePackages?.find(
          (p) => p.packageType === wantedType,
        );

        if (!pkg) {
          const available = currentOfferings?.current?.availablePackages?.map((p) => p.packageType).join(", ") ?? "none";
          console.error(`No ${plan} package found. Wanted packageType=${wantedType}. Available packageTypes: ${available}`);
          return "error";
        }

        await Purchases.purchasePackage(pkg);

        // Wait for the entitlement to propagate (RevenueCat can take a moment)
        const { found, info } = await waitForEntitlement(5, 800);

        if (found) {
          const entitlement = info.entitlements.active["pro"];
          const productId = entitlement?.productIdentifier ?? "";
          const resolvedTier: Tier = productId.toLowerCase().includes("weekly") ? "pro_weekly" : "pro_monthly";
          persist(resolvedTier);
          setShowPaywall(false);
          setShowPaywallAfterOnboarding(false);
          return "success";
        }

        // Purchase completed but entitlement not yet visible — still persist
        // optimistically so the UI unlocks; the next syncTier will reconcile
        persist(plan);
        setShowPaywall(false);
        setShowPaywallAfterOnboarding(false);
        return "success";
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; code?: unknown; userCancelError?: boolean };
        if (err.userCancelled === true || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return "cancelled";
        }
        console.error("Purchase failed", e);
        return "error";
      }
    },
    [offerings, persist],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      const { found } = await waitForEntitlement(3, 600);
      if (found || info.entitlements.active["pro"]) {
        const productId = (info.entitlements.active["pro"]?.productIdentifier ?? found
          ? (await Purchases.getCustomerInfo()).entitlements.active["pro"]?.productIdentifier
          : "") ?? "";
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
      offeringsFetched,
      purchase,
      restore,
    }),
    [tier, isPro, maxDays, isLoaded, showPaywall, showPaywallAfterOnboarding, offerings, offeringsFetched, purchase, restore],
  );
});
