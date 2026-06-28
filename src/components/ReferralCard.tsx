import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Share2, Gift, Users } from "lucide-react";

export default function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [stats, setStats] = useState({ count: 0, credits: 0 });
  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, referred_by")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile) {
      setCode(profile.referral_code);
      setReferredBy(profile.referred_by);
    }
    const { data: rewards } = await supabase
      .from("referral_rewards")
      .select("credits_awarded")
      .eq("referrer_id", user.id);
    if (rewards) {
      setStats({
        count: rewards.length,
        credits: rewards.reduce((s, r: any) => s + (r.credits_awarded || 0), 0),
      });
    }
  };

  useEffect(() => { load(); }, []);

  const link = code ? `${window.location.origin}/auth?ref=${code}` : "";

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const share = async () => {
    if (!link) return;
    const text = `Join me on Cinematic Lens — Uganda's home for movies & VJs. Sign up with my link and we both get a FREE movie when you top up: ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Cinematic Lens", text, url: link }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  const applyCode = async () => {
    if (!inputCode.trim()) return;
    setApplying(true);
    const { data, error } = await supabase.rpc("apply_referral_code", {
      code: inputCode.trim(),
    });
    setApplying(false);
    if (error) { toast.error(error.message); return; }
    const result = data as { ok: boolean; error?: string };
    if (result.ok) {
      toast.success("Referral applied! You'll both earn a free movie when you deposit 3,000 UGX.");
      setInputCode("");
      load();
    } else {
      const msg: Record<string, string> = {
        invalid_code: "That code doesn't exist.",
        self_referral: "You can't refer yourself.",
        already_referred: "You already have a referrer.",
        not_authenticated: "Please sign in.",
      };
      toast.error(msg[result.error || ""] || "Could not apply code");
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border space-y-5">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg">Refer & Earn</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Share your link. When a friend signs up and tops up <span className="text-foreground font-semibold">3,000 UGX</span> or more,
        you <span className="text-foreground font-semibold">both</span> get a free movie.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="w-3 h-3" /> Successful</div>
          <div className="text-xl font-bold mt-0.5">{stats.count}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Gift className="w-3 h-3" /> Credits earned</div>
          <div className="text-xl font-bold mt-0.5">{stats.credits}</div>
        </div>
      </div>

      {/* Code + share */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Your referral code</label>
        <div className="flex gap-2">
          <Input
            value={code || "..."}
            readOnly
            className="bg-secondary border-border font-mono tracking-widest text-center font-bold"
          />
          <Button onClick={copy} variant="secondary" size="icon" disabled={!code}><Copy className="w-4 h-4" /></Button>
          <Button onClick={share} disabled={!code} className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
        </div>
      </div>

      {/* Apply someone else's code */}
      {!referredBy && (
        <div className="pt-3 border-t border-border/50">
          <label className="text-xs text-muted-foreground mb-1 block">Got a friend's code? Enter it once.</label>
          <div className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={12}
              className="bg-secondary border-border font-mono tracking-widest"
            />
            <Button onClick={applyCode} disabled={applying || !inputCode.trim()} variant="secondary">
              {applying ? "..." : "Apply"}
            </Button>
          </div>
        </div>
      )}
      {referredBy && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          ✓ You were referred by a friend. Top up 3,000 UGX or more to unlock both rewards.
        </p>
      )}
    </div>
  );
}
