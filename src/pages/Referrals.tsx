import { useStore } from "@/lib/store";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Referrals() {
  const { referralCode, referralCount } = useStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const progress = Math.min(referralCount, 2);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join Cinematic Lens and get your first watch FREE! Use my code: ${referralCode}\nhttps://cinematiclens.ug`)}`);
  };

  return (
    <div className="bg-background min-h-screen pt-20 px-4 md:px-12 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-display text-3xl md:text-5xl mb-2">Refer & Earn</h1>
      <p className="text-muted-foreground mb-8">Refer 2 friends who watch at least 1 video → get 1 extra free credit!</p>

      <div className="max-w-md">
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <span className="text-display text-2xl text-cinema-gold flex-1">{referralCode}</span>
            <button onClick={copyCode} className="text-muted-foreground hover:text-foreground">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-xs text-cinema-gold mt-2">Copied!</p>}
        </div>

        {/* Progress */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-3">Referral Progress</p>
          <div className="w-full h-2 bg-muted rounded-full mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(progress / 2) * 100}%` }}
            />
          </div>
          <p className="text-sm text-foreground">{progress}/2 friends joined & watched</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 bg-[hsl(142,70%,40%)] text-primary-foreground py-3 rounded font-semibold hover:opacity-90 transition"
          >
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={() => window.open(`sms:?body=${encodeURIComponent(`Join Cinematic Lens! Code: ${referralCode}`)}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-3 rounded font-semibold hover:bg-muted transition"
          >
            <Share2 className="w-4 h-4" /> SMS
          </button>
        </div>
      </div>
    </div>
  );
}
