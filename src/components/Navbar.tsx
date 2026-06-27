import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import logoLens from "@/assets/logo-lens.jpg";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", path: "/home" },
  { label: "VJs", path: "/vjs" },
  { label: "Browse", path: "/movies" },
  { label: "New & Popular", path: "/new-popular" },
  { label: "My List", path: "/my-list" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle();
      if (profile?.display_name) setUserInitial(profile.display_name.charAt(0).toUpperCase());
      else if (user.email) setUserInitial(user.email.charAt(0).toUpperCase());
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    };
    init();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.url) setAvatarUrl(detail.url);
    };
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-3 md:px-8 pt-2 md:pt-3 pb-2 flex items-center justify-between gap-2">
        <Link
          to="/home"
          className="glass-pill rounded-full pl-2 pr-3 py-1.5 flex items-center pointer-events-auto"
        >
          <img src={logoLens} alt="Cinematic Lens" className="h-6 md:h-8 object-contain rounded-full" />
        </Link>

        <div className="hidden md:flex items-center gap-1.5 glass-pill rounded-full px-1.5 py-1 pointer-events-auto">
          {navLinks.map((l) => {
            const active = location.pathname === l.path;
            return (
              <Link
                key={l.path}
                to={l.path}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-all ${
                  active ? "glass-chip-active text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="glass-pill rounded-full flex items-center gap-1 px-2 py-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-[140px] md:w-[200px] h-7 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="glass-pill w-9 h-9 rounded-full flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-foreground" />
            </button>
          )}
          {userId && (
            <div className="glass-pill rounded-full px-1 py-0.5 flex items-center">
              <SubscriptionBadge />
            </div>
          )}
          <Link
            to="/profile"
            className="glass-pill flex items-center justify-center w-9 h-9 rounded-full overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-xs font-bold text-primary">{userInitial}</span>
            )}
          </Link>
          <button
            className="md:hidden glass-pill w-9 h-9 rounded-full flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-3 pointer-events-auto">
          <div className="glass-pill rounded-2xl p-2 space-y-1">
            {navLinks.map((l) => {
              const active = location.pathname === l.path;
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block text-sm font-medium px-3 py-2 rounded-xl transition-all ${
                    active ? "glass-chip-active text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}