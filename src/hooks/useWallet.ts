import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user and wallet
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
      if (data) {
        setBalance(data.balance);
      } else {
        // Create wallet if missing (for existing users)
        await supabase.from("wallets").insert({ user_id: user.id, balance: 0 });
        setBalance(0);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("wallet-balance")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "wallets",
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        if (payload.new?.balance !== undefined) {
          setBalance(payload.new.balance);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const deposit = useCallback(async (amount: number) => {
    if (!userId || amount <= 0) return false;
    const newBalance = balance + amount;
    const { error: walletError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);
    if (walletError) return false;

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "Deposit",
      amount,
      balance_after: newBalance,
    });
    setBalance(newBalance);
    return true;
  }, [userId, balance]);

  const deduct = useCallback(async (amount: number, movieTitle: string) => {
    if (!userId || amount <= 0) return false;
    if (balance < amount) return false;
    const newBalance = balance - amount;
    const { error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);
    if (error) return false;

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "Watch",
      amount: -amount,
      movie_title: movieTitle,
      balance_after: newBalance,
    });
    setBalance(newBalance);
    return true;
  }, [userId, balance]);

  return { balance, userId, loading, deposit, deduct };
}
