import { useEffect, useRef, useState } from "react";
import { Wallet } from "lucide-react";

interface BalanceBadgeProps {
  balance: number;
  className?: string;
  /** Style variant */
  variant?: "pill" | "inline";
}

export default function BalanceBadge({ balance, className = "", variant = "pill" }: BalanceBadgeProps) {
  const [flash, setFlash] = useState(false);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      setFlash(true);
      prevBalance.current = balance;
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
  }, [balance]);

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 text-sm text-gold ${flash ? "balance-flash" : ""} ${className}`}>
        <Wallet className="w-4 h-4" />
        <span>{balance.toLocaleString()} UGX</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${flash ? "balance-flash" : ""} ${className}`}
      style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))", color: "hsl(0 0% 5%)" }}
    >
      <Wallet className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">UGX {balance.toLocaleString()}</span>
    </span>
  );
}
