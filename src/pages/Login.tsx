import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import logoSquare from "@/assets/logo-square.jpg";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+256 ");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username || phone, phone);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card/80 backdrop-blur rounded-lg p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <img src={logoSquare} alt="Cinematic Lens" className="h-16 object-contain" />
        </div>
        <h1 className="text-display text-3xl text-center mb-8">{isSignup ? "Sign Up" : "Sign In"}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          <input
            type="tel"
            placeholder="Phone (+256...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isSignup && (
            <input
              type="text"
              placeholder="Referral code (optional)"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="w-full bg-input border border-border rounded px-4 py-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold hover:bg-primary/90 transition"
          >
            {isSignup ? "Sign Up — Get 1 Free Watch!" : "Sign In"}
          </button>
        </form>

        <p className="text-muted-foreground text-sm mt-6 text-center">
          {isSignup ? "Already have an account?" : "New to Cinematic Lens?"}{" "}
          <button onClick={() => setIsSignup(!isSignup)} className="text-foreground hover:underline">
            {isSignup ? "Sign In" : "Sign Up Now"}
          </button>
        </p>
      </div>
    </div>
  );
}
