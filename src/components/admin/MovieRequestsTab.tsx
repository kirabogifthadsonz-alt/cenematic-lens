import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Trash2, MessageSquare, Loader2, Bell, Copy } from "lucide-react";

interface MovieRequest {
  id: string;
  user_id: string;
  movie_title: string;
  production_year: number | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  user_notified: boolean;
  user_email?: string;
  user_name?: string;
}

export default function MovieRequestsTab() {
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();

    // Subscribe to changes
    const subscription = supabase
      .channel("admin_movie_requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movie_requests",
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("movie_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each request
      const enrichedRequests = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", req.user_id)
            .single();

          return {
            ...req,
            user_email: profileData?.email || "Unknown",
            user_name: profileData?.full_name || "Unknown User",
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (err) {
      console.error("Error loading requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("movie_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
      loadRequests();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const saveAdminNotes = async (id: string) => {
    try {
      const { error } = await supabase
        .from("movie_requests")
        .update({ admin_notes: adminNotes })
        .eq("id", id);

      if (error) throw error;
      toast.success("Notes saved");
      setEditingId(null);
      setAdminNotes("");
      loadRequests();
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Failed to save notes");
    }
  };

  const notifyUser = async (id: string) => {
    setNotifyingId(id);
    try {
      const { error } = await supabase
        .from("movie_requests")
        .update({ user_notified: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("User notified ✓");
      loadRequests();
    } catch (err) {
      console.error("Error notifying user:", err);
      toast.error("Failed to notify user");
    } finally {
      setNotifyingId(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    try {
      const { error } = await supabase.from("movie_requests").delete().eq("id", id);
      if (error) throw error;
      toast.success("Request deleted");
      loadRequests();
    } catch (err) {
      console.error("Error deleting request:", err);
      toast.error("Failed to delete request");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const filteredRequests = requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled" && !r.user_notified).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Movie Requests
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount}</Badge>}
          {fulfilledCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {fulfilledCount}
            </Badge>
          )}
        </h2>
      </div>

      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              Pending ({requests.filter((r) => r.status === "pending").length})
            </SelectItem>
            <SelectItem value="fulfilled">
              Fulfilled ({requests.filter((r) => r.status === "fulfilled").length})
            </SelectItem>
            <SelectItem value="rejected">
              Rejected ({requests.filter((r) => r.status === "rejected").length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No {filter} requests
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="border border-border rounded-lg p-4 bg-muted/30 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{request.movie_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.production_year && `Year: ${request.production_year}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested by: <span className="font-medium">{request.user_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {request.user_email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => copyToClipboard(request.user_email || "")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()} at{" "}
                    {new Date(request.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Badge variant={request.status === "pending" ? "outline" : "default"}>
                    {request.status}
                  </Badge>
                  {request.status === "fulfilled" && !request.user_notified && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {request.admin_notes && (
                <div className="bg-background/50 p-2 rounded text-sm border border-border/50">
                  <p className="font-semibold text-xs mb-1">Admin Notes:</p>
                  <p>{request.admin_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {request.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(request.id, "fulfilled")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Fulfilled
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(request.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {request.status === "fulfilled" && !request.user_notified && (
                  <Button
                    size="sm"
                    onClick={() => notifyUser(request.id)}
                    disabled={notifyingId === request.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {notifyingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Bell className="w-4 h-4 mr-1" />
                    )}
                    Notify User
                  </Button>
                )}

                {editingId === request.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => saveAdminNotes(request.id)}
                      className="bg-primary text-primary-foreground"
                    >
                      Save Notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(request.id);
                      setAdminNotes(request.admin_notes || "");
                    }}
                  >
                    Add Notes
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteRequest(request.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {editingId === request.id && (
                <Textarea
                  placeholder="Add admin notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-20"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
