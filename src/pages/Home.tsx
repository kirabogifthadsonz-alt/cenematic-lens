import { useState, useCallback, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import MovieRowSkeleton from "@/components/MovieRowSkeleton";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import WatchedRow from "@/components/WatchedRow";
import SplashScreen from "@/components/SplashScreen";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";
import { useMoviesByRow } from "@/hooks/useMoviesByRow";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTrendingMovies } from "@/hooks/useTrendingMovies";
import { useContentRows, useCategories } from "@/hooks/useAdminLists";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const alreadyShown = sessionStorage.getItem("splash_shown") === "true";
  const [splashDone, setSplashDone] = useState(alreadyShown);
  const [userId, setUserId] = useState<string | null>(null);
  const { moviesByRow, seriesByRow, moviesByCategory, loading: moviesLoading } = useMoviesByRow();
  const trendingMovies = useTrendingMovies();
  const { rows, loading: rowsLoading } = useContentRows();
  const { categories } = useCategories();
  const online = useOnlineStatus();
  const showSkeleton = (moviesLoading || rowsLoading) && rows.length === 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Apply any pending referral code captured before OAuth/email confirmation
  useEffect(() => {
    if (!userId) return;
    const ref = localStorage.getItem("pending_referral_code");
    if (!ref) return;
    supabase.rpc("apply_referral_code", { _code: ref }).then(() => {
      localStorage.removeItem("pending_referral_code");
    });
  }, [userId]);

  usePushNotifications(userId);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("splash_shown", "true");
    setSplashDone(true);
  }, []);

  // Build ordered row names from DB, excluding Coming Soon (handled separately)
  const orderedRows = rows
    .filter(r => r.name !== "Coming Soon")
    .map(r => r.name);

  const seriesRowNames = rows.filter(r => r.is_series_row).map(r => r.name);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-background">
        <HeroSection />
        <MarqueeBar />
        {!online && (
          <div className="mx-4 md:mx-12 mt-3 mb-1 flex items-center gap-2 rounded-md border border-border/60 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
            <WifiOff className="w-3.5 h-3.5" />
            <span>You're offline — showing the app shell. Content will load once you're back online.</span>
          </div>
        )}
        <div className="-mt-20 relative z-10 pb-16">
          {showSkeleton && (
            <div className="pt-24">
              {Array.from({ length: 4 }).map((_, i) => (
                <MovieRowSkeleton key={i} />
              ))}
            </div>
          )}
          <ContinueWatchingRow />
          {/* Trending first */}
          {trendingMovies.length > 0 && (
            <MovieRow key="Trending" title="🔥 Trending" movies={trendingMovies} />
          )}
          {/* Coming Soon second */}
          {(moviesByRow["Coming Soon"]?.length ?? 0) > 0 && (
            <MovieRow key="Coming Soon" title="Coming Soon" movies={moviesByRow["Coming Soon"]} />
          )}
          {/* Watched row third */}
          <WatchedRow />
          {/* Remaining custom rows from DB */}
          {orderedRows.map((row) => (
            <MovieRow
              key={row}
              title={row}
              movies={moviesByRow[row] || []}
              seriesGroups={seriesRowNames.includes(row) ? seriesByRow[row] : undefined}
            />
          ))}
          {/* Category rows — auto-generated from categories table */}
          {categories.map((c) => {
            const list = moviesByCategory[c.name];
            if (!list || list.length === 0) return null;
            return <MovieRow key={`cat-${c.id}`} title={c.name} movies={list} />;
          })}
        </div>
        <Footer />
      </div>
    </>
  );
}
