import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, X, Send, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";

export default function MovieRequestButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [movieTitle, setMovieTitle] = useState("");
  const [productionYear, setProductionYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        // Fetch user profile for better display
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        setUserProfile(profileData);
        checkUnfulfilledRequests(data.user.id);
      }
    };
    getUser();

    // Subscribe to movie_requests changes
    const subscription = supabase
      .channel("movie_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movie_requests",
        },
        async (payload) => {
          if (user?.id) {
            checkUnfulfilledRequests(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const checkUnfulfilledRequests = async (userId: string) => {
    const { data, error } = await supabase
      .from("movie_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "fulfilled")
      .eq("user_notified", false);

    if (!error && data) {
      setUnfulfilledCount(data.length);
    }
  };

  const handleSubmit = async () => {
    if (!movieTitle.trim()) {
      toast.error("Please enter a movie title");
      return;
    }

    if (!user) {
      toast.error("Please log in to request a movie");
      return;
    }

    setIsLoading(true);
    try {
      // Insert request into database
      const { data, error } = await supabase
        .from("movie_requests")
        .insert({
          user_id: user.id,
          movie_title: movieTitle.trim(),
          production_year: productionYear ? parseInt(productionYear) : null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Prepare WhatsApp message with user info
      const userName = userProfile?.full_name || user.email || "User";
      const whatsappMessage = `🎬 *New Movie Request*

📽️ Title: ${movieTitle}
📅 Year: ${productionYear || "Not specified"}
👤 Requested by: ${userName}
📧 Email: ${user.email}

Please add this movie to the platform!`;

      // Open WhatsApp group with the message
      const whatsappGroupUrl = `https://chat.whatsapp.com/ISLFj20RWaCL42bqwbIznK`;
      const whatsappUrl = `${whatsappGroupUrl}?text=${encodeURIComponent(whatsappMessage)}`;
      
      // Open in new tab
      window.open(whatsappUrl, "_blank");

      toast.success("Request sent to WhatsApp! ✓");
      setMovieTitle("");
      setProductionYear("");
      setIsOpen(false);
    } catch (err) {
      console.error("Error submitting request:", err);
      toast.error(`Failed to submit request: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsNotified = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("movie_requests")
        .update({ user_notified: true })
        .eq("user_id", user.id)
        .eq("status", "fulfilled")
        .eq("user_notified", false);

      if (!error) {
        setUnfulfilledCount(0);
        toast.success("Notifications cleared ✓");
      }
    } catch (err) {
      console.error("Error marking as notified:", err);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center transition-all"
            title="Request a Movie"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>

          {/* Red Notification Dot */}
          {unfulfilledCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unfulfilledCount > 9 ? "9+" : unfulfilledCount}
            </div>
          )}
        </div>
      </div>

      {/* Floating Menu */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 bg-background border border-border rounded-lg shadow-xl p-4 w-80 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              Request a Movie
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Movie Title *</Label>
              <Input
                placeholder="e.g., Inception"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                className="h-8 text-sm"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Year of Production</Label>
              <Input
                type="number"
                placeholder="e.g., 2010"
                value={productionYear}
                onChange={(e) => setProductionYear(e.target.value)}
                className="h-8 text-sm"
                min="1900"
                max={new Date().getFullYear()}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !movieTitle.trim()}
              className="w-full h-8 text-sm bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              {isLoading ? "Sending..." : "Send to WhatsApp"}
            </Button>

            {unfulfilledCount > 0 && (
              <Button
                onClick={markAsNotified}
                variant="outline"
                className="w-full h-8 text-xs"
              >
                <Bell className="w-3 h-3 mr-1" />
                {unfulfilledCount} Movie{unfulfilledCount !== 1 ? "s" : ""} Ready
              </Button>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your request will be sent to our WhatsApp group for the admin team to process.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
