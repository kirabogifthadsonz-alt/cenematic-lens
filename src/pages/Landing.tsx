import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logoSquare from "@/assets/logo-square.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Circular video background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full overflow-hidden opacity-30 blur-sm">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src="/hero-video.mp4"
            />
          </div>
        </div>

        {/* Circular video foreground */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mb-8"
        >
          <div className="w-[220px] h-[220px] md:w-[340px] md:h-[340px] rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl shadow-primary/20">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src="/hero-video.mp4"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 text-center max-w-2xl"
        >
          <img src={logoSquare} alt="Cinematic Lens" className="h-16 md:h-20 mx-auto mb-4 object-contain" />
          <p className="text-xl md:text-2xl text-foreground font-light mb-2">
            Movies, streamed your way
          </p>
          <p className="text-sm text-muted-foreground mb-8 tracking-widest uppercase">
            (HADZ GROUP OF COMPANIES)
          </p>
          <p className="text-muted-foreground mb-8 text-sm md:text-base max-w-md mx-auto">
            Uganda's #1 streaming app. Watch movies, VJ mixes, Nollywood hits & more — all for just 400 UGX per view. Sign up and get your first watch FREE!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="border border-muted-foreground text-foreground px-8 py-3 rounded-md text-lg font-semibold hover:bg-secondary transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {["Pay-Per-View 400 UGX", "1 Free Watch on Signup", "MTN MoMo & Airtel Money", "VJ Content"].map(f => (
            <span key={f} className="border border-border rounded-full px-4 py-1.5 text-xs text-muted-foreground">
              {f}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
