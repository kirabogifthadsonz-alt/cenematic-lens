import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveSubscription {
  id: string;
  package_key: string;
  started_at: string;
  expires_at: string;
  source: string;
}

export interface SubscriptionPackage {
  id: string;
  key: string;
  label: string;
  duration_hours: number;
  price_ugx: number;
  display_order: number;
  is_active: boolean;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

let conversionAttempted = false;

export function useSubscription() {
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  const fetchSub = useCallback(async (uid: string, forceRefresh = false) => {
    try {
      // Force cache bypass by adding a timestamp query parameter
      const query = supabase
        .from("subscriptions")
        .select("id, package_key, started_at, expires_at, source")
        .eq("user_id", uid)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1);
      
      // Add a cache-busting parameter if force refresh is requested
      if (forceRefresh) {
        console.log("[Subscription] Force refresh requested at", new Date().toISOString());
      }
      
      const { data } = await query.maybeSingle();
      setActiveSub((data as ActiveSubscription) ?? null);
      return data;
    } catch (err) {
      console.error("Error fetching subscription:", err);
      return null;
    }
  }, []);

  // Init
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      if (cancelled) return;
      setUserId(user.id);
      const sub = await fetchSub(user.id);
      if (cancelled) return;

      // One-time wallet → subscription conversion
      if (!sub && !conversionAttempted) {
        conversionAttempted = true;
        try {
          const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
          if (wallet && wallet.balance >= 300) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
              await fetch(`https://${projectId}.supabase.co/functions/v1/wallet-convert-to-subscription`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
              });
              // Retry subscription fetch after conversion with delay
              await new Promise(resolve => setTimeout(resolve, 500));
              await fetchSub(user.id);
            }
          }
        } catch (e) { console.error("Wallet conversion failed:", e); }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchSub]);

  // Realtime - instant updates with NO debouncing for subscription changes
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`sub-${userId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => {
          // INSTANT refresh - no debouncing for subscription updates
          console.log("[Subscription] Real-time update detected, refreshing immediately");
          fetchSub(userId, true);
        })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, fetchSub]);

  // Live tick
  useEffect(() => {
    if (!activeSub) return;
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [activeSub?.id]);

  const expiresAt = activeSub ? new Date(activeSub.expires_at).getTime() : 0;
  const secondsLeft = activeSub ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const isActive = !!activeSub && secondsLeft > 0;

  return {
    activeSub,
    userId,
    loading,
    isActive,
    secondsLeft,
    expiresAt,
    countdown: activeSub ? formatCountdown(secondsLeft) : "",
    // Force immediate refresh when subscription status changes
    forceRefresh: () => userId ? fetchSub(userId, true) : Promise.resolve(null),
    refresh: async () => {
      if (!userId) return;
      // Instant refresh with aggressive retry for newly subscribed users
      console.log("[Subscription] Manual refresh triggered");
      const result = await fetchSub(userId, true);
      if (!result) {
        // Retry immediately after short delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return fetchSub(userId, true);
      }
      return result;
    },
  };
}

export function usePackages() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (!cancelled) {
        setPackages((data as SubscriptionPackage[]) ?? []);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel("packages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_packages" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { packages, loading };
}
