import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ceoPhoto from "@/assets/ceo-photo.png";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordField } from "@/components/auth/PasswordField";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capture ?ref=CODE from URL and persist for after signup
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("pending_referral_code", ref.toUpperCase().trim());
      setIsLogin(false); // default to signup when arriving from a referral link
    }
  }, [searchParams]);

  const tryApplyPendingReferral = async () => {
    const ref = localStorage.getItem("pending_referral_code");
    if (!ref) return;
    try {
      const { data } = await supabase.rpc("apply_referral_code", { _code: ref });
      const result = data as { ok: boolean; error?: string } | null;
      if (result?.ok) {
        toast.success("Referral applied! Top up 3,000 UGX to unlock both rewards.");
      }
    } catch {
      // silent — user can still apply manually from profile
    } finally {
      localStorage.removeItem("pending_referral_code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await tryApplyPendingReferral();
        toast.success("Welcome back!");
        navigate("/home");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // If session is auto-created (email confirm disabled), apply now
        await tryApplyPendingReferral();
        toast.success("Check your email to confirm your account!");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute inset-0">
        <img src={ceoPhoto} alt="" className="h-full w-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_34%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/82 to-background" />
      </div>

      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/15 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <AuthPanel
          title={isLogin ? "Welcome Back" : "Join the Show"}
          subtitle={
            isLogin
              ? "Pick up where you left off with Uganda's home for movies, VJs, and standout originals."
              : "Create your account to unlock Cinematic Lens premieres, local stories, and pay-per-view access."
          }
          footer={<span>Movies, streamed your way • HADZ GROUP OF COMPANIES</span>}
          className="w-full"
        >
          <GoogleAuthButton loading={googleLoading} onClick={handleGoogleSignIn} className="mb-5" />

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-border/80 bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder="Password"
              required
            />
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.18em]">
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? "New to Cinematic Lens?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {isLogin ? "Sign up now" : "Sign in"}
            </button>
          </p>
        </AuthPanel>
      </div>
    </div>
  );
}
