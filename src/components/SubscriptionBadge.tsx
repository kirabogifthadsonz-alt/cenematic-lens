import { Clock, Zap } from "lucide-react";
import { useState } from "react";
import { useSubscription, usePackages } from "@/hooks/useSubscription";
import SubscribeDialog from "@/components/SubscribeDialog";

interface Props {
  variant?: "pill" | "compact";
  className?: string;
}

export default function SubscriptionBadge({ variant = "pill", className = "" }: Props) {
  const { activeSub, isActive, countdown, secondsLeft } = useSubscription();
  const { packages } = usePackages();
  const [showSubscribe, setShowSubscribe] = useState(false);

  const pkgLabel = activeSub
    ? packages.find(p => p.key === activeSub.package_key)?.label ?? activeSub.package_key
    : "";

  // Pulse-red when ≤ 5 minutes
  const warning = isActive && secondsLeft <= 300;

  if (!isActive) {
    return (
      <>
        <button
          onClick={() => setShowSubscribe(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] transition-all ${className}`}
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", color: "hsl(var(--primary-foreground))" }}
        >
          <Zap className="w-3.5 h-3.5" />
          Subscribe
        </button>
        <SubscribeDialog open={showSubscribe} onClose={() => setShowSubscribe(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSubscribe(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${warning ? "animate-pulse" : ""} ${className}`}
        style={{
          background: warning
            ? "linear-gradient(135deg, hsl(0 80% 50%), hsl(0 70% 35%))"
            : "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))",
          color: "hsl(0 0% 5%)"
        }}
        title={`${pkgLabel} subscription · expires ${new Date(activeSub!.expires_at).toLocaleString()}`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">{pkgLabel} · </span>
        <span className="tabular-nums">{countdown}</span>
      </button>
      <SubscribeDialog open={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </>
  );
}
