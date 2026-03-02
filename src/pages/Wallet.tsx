import { useStore } from "@/lib/store";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickAmounts = [3000, 5000, 10000, 20000];

export default function Wallet() {
  const { wallet, deposit, transactions } = useStore();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<"mtn" | "airtel">("mtn");
  const [depositing, setDepositing] = useState(false);
  const navigate = useNavigate();

  const handleDeposit = () => {
    if (amount < 3000) return;
    setDepositing(true);
    setTimeout(() => {
      deposit(amount);
      setDepositing(false);
      setAmount(0);
    }, 1500);
  };

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
      </div>

      <div className="max-w-md">
        <h2 className="text-display text-xl mb-4">Deposit</h2>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickAmounts.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-2 rounded text-sm font-medium transition ${
                amount === a
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {a.toLocaleString()}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Custom amount (min 3,000)"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Payment method */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMethod("mtn")}
            className={`flex-1 py-3 rounded border text-sm font-semibold transition ${
              method === "mtn"
                ? "border-cinema-gold bg-cinema-gold/10 text-cinema-gold"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            📱 MTN MoMo
          </button>
          <button
            onClick={() => setMethod("airtel")}
            className={`flex-1 py-3 rounded border text-sm font-semibold transition ${
              method === "airtel"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            📱 Airtel Money
          </button>
        </div>

        <button
          onClick={handleDeposit}
          disabled={amount < 3000 || depositing}
          className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold disabled:opacity-50 hover:bg-primary/90 transition"
        >
          {depositing ? "Processing..." : amount < 3000 ? "Min 3,000 UGX" : `Deposit UGX ${amount.toLocaleString()}`}
        </button>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="mt-12 max-w-md">
          <h2 className="text-display text-xl mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {[...transactions].reverse().slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between bg-card border border-border rounded px-4 py-3">
                <div>
                  <p className="text-sm text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                  {tx.titleName && <p className="text-xs text-muted-foreground">{tx.titleName}</p>}
                </div>
                <span className={`text-sm font-semibold ${tx.type === "deposit" ? "text-cinema-gold" : tx.amount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {tx.type === "deposit" ? "+" : tx.amount > 0 ? "-" : ""}UGX {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
