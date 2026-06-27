import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Volume2, VolumeX } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  file_url: string;
}

export default function FloatingMusicPlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffledRef = useRef<Song[]>([]);
  const indexRef = useRef(0);

  // Fetch active songs
  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase
        .from("background_music")
        .select("id, title, artist, file_url")
        .eq("is_active", true);
      if (data && data.length > 0) {
        setSongs(data);
        // Shuffle
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        shuffledRef.current = shuffled;
        indexRef.current = 0;
        setCurrentSong(shuffled[0]);
      }
    };
    fetchSongs();
  }, []);

  // Play next song in shuffle
  const playNext = useCallback(() => {
    if (shuffledRef.current.length === 0) return;
    indexRef.current = (indexRef.current + 1) % shuffledRef.current.length;
    // Re-shuffle when we loop back
    if (indexRef.current === 0) {
      shuffledRef.current = [...shuffledRef.current].sort(() => Math.random() - 0.5);
    }
    setCurrentSong(shuffledRef.current[indexRef.current]);
  }, []);

  // Handle audio playback
  useEffect(() => {
    if (!currentSong) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3; // Background music should be soft
    }

    const audio = audioRef.current;
    audio.src = currentSong.file_url;
    audio.muted = isMuted;
    
    const handleEnded = () => playNext();
    audio.addEventListener("ended", handleEnded);

    // Auto-play
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      // Browser may block autoplay — user needs to interact
      setIsPlaying(false);
    });

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, playNext]);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  if (songs.length === 0 || !currentSong) return null;

  return (
    <div className="fixed left-3 z-50 flex flex-col items-start gap-2" style={{ bottom: "5cm" }}>
      {/* Expanded info */}
      {expanded && (
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl px-3 py-2 shadow-lg max-w-[200px] animate-in slide-in-from-bottom-2 fade-in duration-200">
          <p className="text-xs font-semibold text-foreground truncate">{currentSong.title}</p>
          {currentSong.artist && (
            <p className="text-[10px] text-muted-foreground truncate">{currentSong.artist}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={togglePlayPause}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={playNext}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Floating icon button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
          isPlaying
            ? "bg-primary text-primary-foreground animate-pulse shadow-[0_0_15px_hsl(var(--primary)/0.6),0_0_30px_hsl(var(--primary)/0.3)]"
            : "bg-card text-muted-foreground border border-border shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
        }`}
      >
        <Music className={`w-5 h-5 ${isPlaying ? "animate-spin" : ""}`} style={isPlaying ? { animationDuration: "3s" } : undefined} />
      </button>
    </div>
  );
}
