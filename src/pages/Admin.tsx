import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Tables } from "@/integrations/supabase/types";
import {
  LayoutDashboard, Film, Users, Receipt, Share2, BarChart3, Settings,
  Plus, Pencil, Trash2, LogOut, Loader2, Menu, Cloud, Sparkles,
} from "lucide-react";
import DropboxFoldersTab from "@/components/admin/DropboxFoldersTab";
import PendingReviewTab from "@/components/admin/PendingReviewTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import logoHorizontal from "@/assets/logo-horizontal.jpg";

type DbTitle = Tables<"titles">;
type DbProfile = Tables<"profiles">;
type DbTransaction = Tables<"transactions">;

type SidebarTab = "dashboard" | "content" | "dropbox" | "pending" | "users" | "transactions" | "referrals" | "analytics" | "settings";

const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "content", label: "Content Library", icon: <Film className="w-4 h-4" /> },
  { key: "dropbox", label: "Dropbox Folders", icon: <Cloud className="w-4 h-4" /> },
  { key: "pending", label: "Review Queue", icon: <Sparkles className="w-4 h-4" /> },
  { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { key: "transactions", label: "Transactions", icon: <Receipt className="w-4 h-4" /> },
  { key: "referrals", label: "Referrals", icon: <Share2 className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [tab, setTab] = useState<SidebarTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data
  const [titles, setTitles] = useState<DbTitle[]>([]);
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Content form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", genre: "", language: "English", year: 2025,
    duration: "", rating: "PG-13", is_free: false, is_vj: false,
    category: [] as string[], video_url: "", status: "live", price: 400,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [adminLoading, isAdmin, navigate]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      const [t, p, tx] = await Promise.all([
        supabase.from("titles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      ]);
      setTitles(t.data || []);
      setProfiles(p.data || []);
      setTransactions(tx.data || []);
      setLoadingData(false);
    };
    fetchAll();

    // Realtime subscription for titles
    const channel = supabase
      .channel("admin-titles")
      .on("postgres_changes", { event: "*", schema: "public", table: "titles" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTitles(prev => [payload.new as DbTitle, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setTitles(prev => prev.map(t => t.id === (payload.new as DbTitle).id ? payload.new as DbTitle : t));
        } else if (payload.eventType === "DELETE") {
          setTitles(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (adminLoading || (!isAdmin && adminLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // Stats
  const totalRevenue = transactions.filter(t => t.type === "watch").reduce((s, t) => s + t.amount, 0);
  const totalDeposits = transactions.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalWatches = transactions.filter(t => t.type === "watch" || t.type === "credit_used").length;

  const openAdd = () => {
    setEditingId(null);
    setForm({
      title: "", description: "", genre: "", language: "English", year: 2025,
      duration: "", rating: "PG-13", is_free: false, is_vj: false,
      category: [], video_url: "", status: "live", price: 400,
    });
    setShowForm(true);
  };

  const openEdit = (t: DbTitle) => {
    setEditingId(t.id);
    setForm({
      title: t.title, description: t.description, genre: t.genre,
      language: t.language, year: t.year, duration: t.duration,
      rating: t.rating, is_free: t.is_free, is_vj: t.is_vj,
      category: t.category, video_url: t.video_url, status: t.status, price: t.price,
    });
    setShowForm(true);
  };

  const saveContent = async () => {
    if (!form.title) return;
    setSaving(true);
    if (editingId) {
      await supabase.from("titles").update(form).eq("id", editingId);
    } else {
      await supabase.from("titles").insert(form);
    }
    setSaving(false);
    setShowForm(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("titles").delete().eq("id", deleteId);
    setDeleteId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-14"} bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300`}>
        <div className="p-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setSidebarOpen(o => !o)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition flex-shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <img src={logoHorizontal} alt="Cinematic Lens" className="h-7" />
              <p className="text-[9px] text-muted-foreground tracking-wider">ADMIN CONSOLE</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-1.5 space-y-0.5">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              title={item.label}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-1.5 border-t border-border">
          <button onClick={handleSignOut} title="Sign Out" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition">
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`${sidebarOpen ? "ml-60" : "ml-14"} flex-1 p-6 md:p-8 transition-all duration-300`}>
        {loadingData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: `UGX ${totalRevenue.toLocaleString()}`, color: "text-primary" },
                    { label: "Total Deposits", value: `UGX ${totalDeposits.toLocaleString()}`, color: "text-foreground" },
                    { label: "Total Watches", value: totalWatches.toString(), color: "text-foreground" },
                    { label: "Registered Users", value: profiles.length.toString(), color: "text-foreground" },
                  ].map(s => (
                    <Card key={s.label} className="bg-card border-border">
                      <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-xs text-muted-foreground font-normal">{s.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="bg-card border-border">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Content Library</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-2xl font-bold text-foreground">{titles.length}</p><p className="text-xs text-muted-foreground">Total Titles</p></div>
                        <div><p className="text-2xl font-bold text-foreground">{titles.filter(t => t.is_vj).length}</p><p className="text-xs text-muted-foreground">VJ Content</p></div>
                        <div><p className="text-2xl font-bold text-foreground">{titles.filter(t => t.is_free).length}</p><p className="text-xs text-muted-foreground">Free Titles</p></div>
                        <div><p className="text-2xl font-bold text-foreground">{titles.filter(t => t.status === "live").length}</p><p className="text-xs text-muted-foreground">Live</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2">
                      {transactions.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">No transactions yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {transactions.slice(0, 10).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${tx.type === "deposit" ? "bg-green-500" : "bg-primary"}`} />
                                <span className="text-sm capitalize">{tx.type.replace("_", " ")}</span>
                              </div>
                              <span className={`text-sm font-semibold ${tx.type === "deposit" ? "text-green-500" : "text-foreground"}`}>
                                {tx.type === "deposit" ? "+" : "-"}UGX {tx.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ─── CONTENT LIBRARY ─── */}
            {tab === "content" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
                    <p className="text-sm text-muted-foreground">{titles.length} titles</p>
                  </div>
                  <Button onClick={openAdd} className="gap-2">
                    <Plus className="w-4 h-4" /> Add New Movie / Series
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Title</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Category</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Genre</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Price</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {titles.map(item => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.language} · {item.year}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {item.category.slice(0, 2).map(c => (
                                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{c}</span>
                              ))}
                              {item.category.length > 2 && <span className="text-[10px] text-muted-foreground">+{item.category.length - 2}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">{item.genre}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.is_free ? "bg-green-500/20 text-green-400" :
                              item.is_vj ? "bg-primary/20 text-primary" :
                              "bg-secondary text-secondary-foreground"
                            }`}>
                              {item.is_free ? "Free" : item.is_vj ? "VJ" : "Paid"}
                            </span>
                          </TableCell>
                          <TableCell className="text-primary font-semibold text-sm">
                            {item.is_free ? "Free" : `UGX ${item.price.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.status === "live" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {item.status === "live" ? "Live" : "Coming Soon"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ─── USERS ─── */}
            {tab === "users" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Users ({profiles.length})</h1>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Username</TableHead>
                        <TableHead className="text-muted-foreground">Wallet</TableHead>
                        <TableHead className="text-muted-foreground">Free Credits</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Referrals</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map(p => (
                        <TableRow key={p.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{p.username || "—"}</TableCell>
                          <TableCell className="text-primary font-semibold">UGX {p.wallet.toLocaleString()}</TableCell>
                          <TableCell>{p.free_credits}</TableCell>
                          <TableCell className="hidden md:table-cell">{p.referral_count}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell text-sm">
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ─── TRANSACTIONS ─── */}
            {tab === "transactions" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Transaction History</h1>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No transactions recorded yet.</p>
                ) : (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Date</TableHead>
                          <TableHead className="text-muted-foreground">Type</TableHead>
                          <TableHead className="text-muted-foreground hidden md:table-cell">Title</TableHead>
                          <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(tx => (
                          <TableRow key={tx.id} className="border-border">
                            <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                                tx.type === "deposit" ? "bg-green-500/20 text-green-400" :
                                tx.type === "watch" ? "bg-primary/20 text-primary" :
                                "bg-secondary text-secondary-foreground"
                              }`}>{tx.type.replace("_", " ")}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{tx.title_name || "—"}</TableCell>
                            <TableCell className="text-right font-semibold">
                              <span className={tx.type === "deposit" ? "text-green-400" : "text-foreground"}>
                                {tx.type === "deposit" ? "+" : "-"}UGX {tx.amount.toLocaleString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ─── REFERRALS ─── */}
            {tab === "referrals" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Referrals Overview</h1>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Referral Codes</p>
                      <p className="text-2xl font-bold text-foreground">{profiles.filter(p => p.referral_code).length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Users with Referrals</p>
                      <p className="text-2xl font-bold text-foreground">{profiles.filter(p => p.referral_count > 0).length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Referral Count</p>
                      <p className="text-2xl font-bold text-foreground">{profiles.reduce((s, p) => s + p.referral_count, 0)}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ─── ANALYTICS ─── */}
            {tab === "analytics" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Avg Wallet Balance</p>
                      <p className="text-xl font-bold text-foreground">
                        UGX {profiles.length ? Math.round(profiles.reduce((s, p) => s + p.wallet, 0) / profiles.length).toLocaleString() : 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">VJ Content %</p>
                      <p className="text-xl font-bold text-foreground">
                        {titles.length ? Math.round((titles.filter(t => t.is_vj).length / titles.length) * 100) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Free Content %</p>
                      <p className="text-xl font-bold text-foreground">
                        {titles.length ? Math.round((titles.filter(t => t.is_free).length / titles.length) * 100) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Revenue per User</p>
                      <p className="text-xl font-bold text-foreground">
                        UGX {profiles.length ? Math.round(totalRevenue / profiles.length).toLocaleString() : 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
                <Card className="bg-card border-border max-w-lg">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Platform</p>
                      <p className="text-foreground font-medium">Cinematic Lens</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="text-foreground font-medium">HADZ GROUP OF COMPANIES</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Default Price per Title</p>
                      <p className="text-foreground font-medium">UGX 400</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Deposit</p>
                      <p className="text-foreground font-medium">UGX 3,000</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ─── ADD/EDIT MODAL ─── */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Title" : "Add New Movie / Series"}</DialogTitle>
              <DialogDescription>Fill in the details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Genre" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="bg-secondary border-border" />
                <Input placeholder="Language" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="bg-secondary border-border" />
                <Input placeholder="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="bg-secondary border-border" />
                <Input placeholder="Rating" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <Input placeholder="Video URL" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Categories (comma-separated)" value={form.category.join(", ")} onChange={e => setForm(f => ({ ...f, category: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} className="bg-secondary border-border" />
              <Input type="number" placeholder="Price (UGX)" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="bg-secondary border-border" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="rounded" /> Free
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.is_vj} onChange={e => setForm(f => ({ ...f, is_vj: e.target.checked }))} className="rounded" /> VJ Content
                </label>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="live">Live</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveContent} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── DELETE CONFIRMATION ─── */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Title</DialogTitle>
              <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
