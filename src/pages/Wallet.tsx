import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const quickAmounts = [5000, 10000, 20000, 50000];
const DEPOSIT_METHODS: { key: string; label: string; comingSoon?: boolean }[] = [
  { key: "mtn", label: "📱 MTN MoMo" },
  { key: "airtel", label: "📱 Airtel Money" },
  { key: "card", label: "💳 Card" },
  { key: "crypto", label: "🪙 Crypto", comingSoon: true },
];

type Method = typeof DEPOSIT_METHODS[number]["key"];

export default function Wallet() {
  const [wallet, setWallet] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<Method>("mtn");
  const [depositing, setDepositing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load profile + transactions and subscribe realtime
  useEffect(() => {
    let profileChannel: any;
    let txChannel: any;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const uid = session.user.id;
      setUserId(uid);

      // Fetch profile
      const { data: prof } = await supabase.from("profiles").select("wallet, free_credits").eq("user_id", uid).single();
      if (prof) { setWallet(prof.wallet); setFreeCredits(prof.free_credits); }

      // Fetch transactions
      const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
      setTransactions(txs || []);
      setLoading(false);

      // Realtime profile
      profileChannel = supabase
        .channel("wallet-profile")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${uid}` }, (payload) => {
          const p = payload.new as any;
          setWallet(p.wallet ?? 0);
          setFreeCredits(p.free_credits ?? 0);
        })
        .subscribe();

      // Realtime transactions
      txChannel = supabase
        .channel("wallet-transactions")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${uid}` }, (payload) => {
          setTransactions(prev => [payload.new as any, ...prev]);
        })
        .subscribe();
    };
    setup();
    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (txChannel) supabase.removeChannel(txChannel);
    };
  }, []);

  const handleDeposit = async () => {
    if (amount < 5000 || !userId || method === "crypto") return;
    setDepositing(true);
    // Simulate payment processing
    setTimeout(async () => {
      await supabase.from("profiles").update({ wallet: wallet + amount }).eq("user_id", userId);
      await supabase.from("transactions").insert({ user_id: userId, type: "deposit", amount, title_name: `${method.toUpperCase()} deposit` });
      setDepositing(false);
      setAmount(0);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="bg-background min-h-screen pt-20 px-4 md:px-12 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-display text-3xl md:text-5xl mb-2">Wallet</h1>
      <p className="text-muted-foreground mb-8">Top up your balance to watch content.</p>

      <div className="bg-card border border-border rounded-lg p-6 mb-8 max-w-md">
        <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
        <p className="text-display text-4xl text-cinema-gold">UGX {wallet.toLocaleString()}</p>
        {freeCredits > 0 && <p className="text-xs text-primary mt-1">{freeCredits} free credit{freeCredits > 1 ? "s" : ""} remaining</p>}
      </div>

      <div className="max-w-md">
        <h2 className="text-display text-xl mb-4">Deposit</h2>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickAmounts.map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className={`py-2 rounded text-sm font-medium transition ${amount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
              {a.toLocaleString()}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Custom amount (min 5,000)"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Payment methods */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {DEPOSIT_METHODS.map(m => (
            <button key={m.key} onClick={() => !m.comingSoon && setMethod(m.key)}
              disabled={m.comingSoon}
              className={`py-3 rounded border text-sm font-semibold transition relative ${
                m.comingSoon ? "border-border text-muted-foreground/50 cursor-not-allowed" :
                method === m.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}>
              {m.label}
              {m.comingSoon && <span className="absolute -top-2 right-2 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Soon</span>}
            </button>
          ))}
        </div>

        <button onClick={handleDeposit}
          disabled={amount < 5000 || depositing || method === "crypto"}
          className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold disabled:opacity-50 hover:bg-primary/90 transition">
          {depositing ? "Processing..." : amount < 5000 ? "Min 5,000 UGX" : `Deposit UGX ${amount.toLocaleString()}`}
        </button>
      </div>

      {/* Transaction history */}
      <div className="mt-12 max-w-md">
        <h2 className="text-display text-xl mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between bg-card border border-border rounded px-4 py-3">
                <div>
                  <p className="text-sm text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                  {tx.title_name && <p className="text-xs text-muted-foreground">{tx.title_name}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "deposit" ? "text-cinema-gold" : "text-primary"}`}>
                  {tx.type === "deposit" ? "+" : "-"}UGX {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
