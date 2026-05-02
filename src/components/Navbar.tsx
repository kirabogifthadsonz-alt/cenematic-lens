import { Link, useLocation } from "react-router-dom";
import { Search, Bell, ChevronDown, Shield } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAdmin } from "@/hooks/use-admin";
import logoHorizontal from "@/assets/logo-horizontal.jpg";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { label: "Home", path: "/home" },
  { label: "VJs", path: "/vjs" },
  { label: "Movies", path: "/movies" },
  { label: "New & Popular", path: "/new-popular" },
  { label: "My List", path: "/my-list" },
  { label: "Get App", path: "/download" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { isLoggedIn, wallet, freeCredits, username, logout } = useStore();
  const { isAdmin } = useAdmin();
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 gradient-cinema-top">
      <div className="flex items-center justify-between px-4 md:px-12 py-3">
        <div className="flex items-center gap-6">
          <Link to={isLoggedIn ? "/home" : "/"}>
            <img src={logoHorizontal} alt="Cinematic Lens" className="h-8 md:h-10 object-contain" />
          </Link>
          {isLoggedIn && (
            <>
              <div className="hidden md:flex items-center gap-5">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      pathname === item.path ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="md:hidden relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1 text-sm text-foreground"
                >
                  Browse <ChevronDown className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute top-8 left-0 bg-card border border-border rounded-md py-2 min-w-[150px]">
                    {navItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMenu(false)}
                        className={`block px-4 py-2 text-sm hover:bg-secondary ${
                          pathname === item.path ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {isLoggedIn && (
            <>
              {showSearch ? (
                <div className="flex items-center bg-card border border-border rounded px-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Titles, people, genres"
                    className="bg-transparent border-none outline-none text-sm px-2 py-1 w-32 md:w-48 text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    onBlur={() => !searchQuery && setShowSearch(false)}
                  />
                </div>
              ) : (
                <button onClick={() => setShowSearch(true)}>
                  <Search className="w-5 h-5 text-foreground" />
                </button>
              )}
              <Bell className="w-5 h-5 text-foreground hidden md:block" />
              <ThemeToggle />
              <Link
                to="/wallet"
                className="flex items-center gap-1 bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold text-primary"
              >
                {freeCredits > 0 && <span>{freeCredits} free •</span>}
                <span>UGX {wallet.toLocaleString()}</span>
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-1">
                  <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {username[0]?.toUpperCase()}
                  </div>
                  <ChevronDown className="w-3 h-3 text-foreground hidden md:block" />
                </button>
                <div className="absolute right-0 top-10 bg-card border border-border rounded-md py-2 min-w-[160px] hidden group-hover:block">
                  <Link to="/wallet" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary">Wallet</Link>
                  <Link to="/referrals" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary">Referrals</Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-secondary">
                      <Shield className="w-3 h-3" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary">Sign Out</button>
                </div>
              </div>
            </>
          )}
          {!isLoggedIn && (
            <>
              <ThemeToggle />
              <Link to="/login" className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm font-semibold hover:bg-primary/90 transition">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
