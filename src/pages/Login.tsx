import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import logoSquare from "@/assets/logo-square.jpg";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+256 ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/home");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { username, phone },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        navigate("/home");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error: oauthError } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed");
      setLoading(false);
    }
    // Redirect happens automatically
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card/80 backdrop-blur rounded-lg p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <img src={logoSquare} alt="Cinematic Lens" className="h-16 object-contain" />
        </div>
        <h1 className="text-display text-3xl text-center mb-8">{isSignup ? "Sign Up" : "Sign In"}</h1>

        {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
        {message && <p className="text-primary text-sm text-center mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="tel" placeholder="Phone (+256...)" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignup ? "Sign Up — Get 1 Free Watch!" : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-secondary text-foreground py-3 rounded font-semibold hover:bg-secondary/80 transition disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>

        <p className="text-muted-foreground text-sm mt-6 text-center">
          {isSignup ? "Already have an account?" : "New to Cinematic Lens?"}{" "}
          <button onClick={() => { setIsSignup(!isSignup); setError(""); setMessage(""); }} className="text-foreground hover:underline">
            {isSignup ? "Sign In" : "Sign Up Now"}
          </button>
        </p>
      </div>
    </div>
  );
}
