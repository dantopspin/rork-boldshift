import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FREE_DAYS, TOTAL_DAYS } from "@/types";

const STORAGE_KEY = "boldshift_subscription";
export type Tier = "free" | "pro_monthly" | "pro_annual";

/**
 * Local-first subscription state. No backend validation — premium status is
 * stored on-device only. (RevenueCat would slot in here on a real build.)
 */
export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [tier, setTier] = useState<Tier>("free");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showPaywallAfterOnboarding, setShowPaywallAfterOnboarding] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "pro_monthly" || stored === "pro_annual" || stored === "free") {
          setTier(stored);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const persist = useCallback((next: Tier): void => {
    setTier(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const purchase = useCallback(
    (plan: "pro_monthly" | "pro_annual"): void => {
      persist(plan);
      setShowPaywall(false);
      setShowPaywallAfterOnboarding(false);
    },
    [persist],
  );

  const restore = useCallback((): void => {
    // Local-only: nothing to restore from a server.
  }, []);

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
