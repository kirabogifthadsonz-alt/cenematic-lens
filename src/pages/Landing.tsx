import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import logoHorizontal from "@/assets/logo-horizontal.jpg";
import ceoPhoto from "@/assets/ceo-photo.png";
import { AuthBenefitGrid } from "@/components/auth/AuthBenefitGrid";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordField } from "@/components/auth/PasswordField";

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/home", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/home", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const scrollToAuth = () => {
    setActiveTab("signup");
    authRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (rememberMe) localStorage.setItem("cl_remember", "true");
      toast.success("Welcome back!");
      navigate("/home");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/home" },
      });
      if (error) throw error;
      toast.success("Check your email to confirm your account!");
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email!");
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={ceoPhoto} alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/82 to-background" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:pt-14">
          <div className="flex flex-col justify-center pb-12 lg:pb-0">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-border/70 bg-card/70 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-accent shadow-lg shadow-background/20 backdrop-blur-sm">
              Uganda's Home for Movies & VJs
            </div>

            <div className="mb-7 flex items-center gap-4">
              <img
              src={logoHorizontal}
              alt="Cinematic Lens"
              className="h-20 w-20 rounded-[1.25rem] border border-border/70 object-cover shadow-2xl shadow-background/30 sm:h-24 sm:w-24"
            />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-muted-foreground">
                  HADZ GROUP OF COMPANIES
                </p>
                <h1 className="mt-2 text-5xl leading-none text-foreground sm:text-7xl">
                  Cinematic <span className="text-primary">Lens</span>
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Stream Ugawood originals, Nollywood, global hits, and iconic Luganda VJ narrations in one bold cinematic home.
            </p>

            <div className="mt-8 max-w-xl rounded-[calc(var(--radius)*3)] border border-border/70 bg-card/65 p-5 shadow-xl shadow-background/20 backdrop-blur-md sm:p-6">
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                Founded by <span className="font-semibold text-foreground">Gift Hadson</span> in Kampala — bringing local stories, premium premieres, and fan-favorite VJ voices closer to every screen.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={scrollToAuth}
                size="lg"
                className="h-12 rounded-xl px-8 text-sm font-semibold uppercase tracking-[0.18em] shadow-lg shadow-primary/25"
              >
                Get Started
              </Button>
              <div className="flex items-center rounded-xl border border-border/70 bg-card/55 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm">
                New releases. Local voices. No monthly subscription required.
              </div>
            </div>
          </div>

          <div ref={authRef} className="flex items-center justify-center lg:justify-end">
            <AuthPanel
              eyebrow={activeTab === "login" ? "Member access" : "Start watching"}
              title={activeTab === "login" ? "Sign In" : "Create Account"}
              subtitle={
                activeTab === "login"
                  ? "Jump back into your watchlist, purchases, and the latest Cinematic Lens drops."
                  : "Set up your account to start streaming, buying titles, and following your favorite VJs."
              }
              className="w-full max-w-xl"
              footer={<span>Secure sign-in powered by Cinematic Lens</span>}
            >
              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-secondary/45 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition-all ${
                    activeTab === "login"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition-all ${
                    activeTab === "signup"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <GoogleAuthButton loading={googleLoading} onClick={handleGoogleSignIn} className="mb-5" />

              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  or continue with email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border/80 bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <PasswordField value={password} onChange={setPassword} placeholder="Password" required />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                      <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
                      Remember Me
                    </label>
                    <button type="button" onClick={handleForgotPassword} className="font-semibold text-primary transition-colors hover:text-primary/80">
                      Forgot Password?
                    </button>
                  </div>
                  <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.18em]">
                    {loading ? "Signing in..." : "Log In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border/80 bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <PasswordField value={password} onChange={setPassword} placeholder="Password" required />
                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm Password"
                    required
                  />
                  <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.18em]">
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              )}

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {activeTab === "login" ? "New to Cinematic Lens? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {activeTab === "login" ? "Sign up now" : "Log in"}
                </button>
              </p>
            </AuthPanel>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AuthBenefitGrid />
        </div>
      </section>

      <Footer />
    </div>
  );
}
