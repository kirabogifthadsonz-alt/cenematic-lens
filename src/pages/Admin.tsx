import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import {
  LayoutDashboard, Film, Users, Receipt, Share2, BarChart3, Settings,
  Plus, Pencil, Trash2, LogOut, Loader2, Menu, X, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import logoHorizontal from "@/assets/logo-horizontal.jpg";

type SidebarTab = "dashboard" | "content" | "users" | "transactions" | "referrals" | "analytics" | "settings" | "blog";

const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "content", label: "Content Library", icon: <Film className="w-4 h-4" /> },
  { key: "blog", label: "Blog Posts", icon: <BookOpen className="w-4 h-4" /> },
  { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { key: "transactions", label: "Transactions", icon: <Receipt className="w-4 h-4" /> },
  { key: "referrals", label: "Referrals", icon: <Share2 className="w-4 h-4" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

const CATEGORIES = [
  "trending", "originals", "luganda", "nollywood", "kids", "new", "action", "comedy", "drama", "documentary", "romance", "horror", "music",
];

const VJ_NARRATORS = [
  "VJ Emmy", "VJ Jingo", "VJ Junior", "VJ Mark", "VJ Ice P", "VJ Kevo", "VJ Jones", "VJ Brian", "VJ Flick", "Other",
];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [tab, setTab] = useState<SidebarTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data
  const [titles, setTitles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Content form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Upload mode
  const [uploadMode, setUploadMode] = useState<"new" | "produce">("new");
  const [isSeries, setIsSeries] = useState(false);
  const [seriesMode, setSeriesMode] = useState<"new" | "continue">("new");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [selectedComingSoonId, setSelectedComingSoonId] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", genre: "", language: "English", year: 2025,
    duration: "", rating: "PG-13", is_free: false, is_vj: false,
    category: [] as string[], video_url: "", status: "live", price: 400,
    row: "", vj_narrator: "", thumbnail_url: "",
    is_series: false, series_id: null as string | null, season: 1, episode: 1,
    is_coming_soon: false,
  });

  // Blog form
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "", slug: "", excerpt: "", content: "", cover_image: "", author: "Cinematic Lens", published: true,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin/login");
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      const [t, p, tx, bp] = await Promise.all([
        supabase.from("titles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("blog_posts").select("*").order("created_at", { ascending: false }),
      ]);
      setTitles(t.data || []);
      setProfiles(p.data || []);
      setTransactions(tx.data || []);
      setBlogPosts(bp.data || []);
      setLoadingData(false);
    };
    fetchAll();

    const ch1 = supabase.channel("admin-titles").on("postgres_changes", { event: "*", schema: "public", table: "titles" }, (p) => {
      if (p.eventType === "INSERT") setTitles(prev => [p.new as any, ...prev]);
      else if (p.eventType === "UPDATE") setTitles(prev => prev.map(t => t.id === (p.new as any).id ? p.new : t));
      else if (p.eventType === "DELETE") setTitles(prev => prev.filter(t => t.id !== (p.old as any).id));
    }).subscribe();

    const ch2 = supabase.channel("admin-blog").on("postgres_changes", { event: "*", schema: "public", table: "blog_posts" }, (p) => {
      if (p.eventType === "INSERT") setBlogPosts(prev => [p.new as any, ...prev]);
      else if (p.eventType === "UPDATE") setBlogPosts(prev => prev.map(t => t.id === (p.new as any).id ? p.new : t));
      else if (p.eventType === "DELETE") setBlogPosts(prev => prev.filter(t => t.id !== (p.old as any).id));
    }).subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [isAdmin]);

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  const totalRevenue = transactions.filter(t => t.type === "watch").reduce((s: number, t: any) => s + t.amount, 0);
  const totalDeposits = transactions.filter(t => t.type === "deposit").reduce((s: number, t: any) => s + t.amount, 0);
  const totalWatches = transactions.filter(t => t.type === "watch" || t.type === "credit_used").length;

  const seriesList = titles.filter(t => t.is_series && !t.series_id);
  const comingSoonList = titles.filter(t => t.is_coming_soon && !t.video_url);

  const resetForm = () => {
    setForm({
      title: "", description: "", genre: "", language: "English", year: 2025,
      duration: "", rating: "PG-13", is_free: false, is_vj: false,
      category: [], video_url: "", status: "live", price: 400,
      row: "", vj_narrator: "", thumbnail_url: "",
      is_series: false, series_id: null, season: 1, episode: 1, is_coming_soon: false,
    });
    setUploadMode("new");
    setIsSeries(false);
    setSeriesMode("new");
    setSelectedSeriesId("");
    setSelectedComingSoonId("");
  };

  const openAdd = () => { setEditingId(null); resetForm(); setShowForm(true); };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      title: t.title, description: t.description, genre: t.genre, language: t.language, year: t.year,
      duration: t.duration, rating: t.rating, is_free: t.is_free, is_vj: t.is_vj,
      category: t.category || [], video_url: t.video_url, status: t.status, price: t.price,
      row: t.row || "", vj_narrator: t.vj_narrator || "", thumbnail_url: t.thumbnail_url || "",
      is_series: t.is_series, series_id: t.series_id, season: t.season || 1, episode: t.episode || 1,
      is_coming_soon: t.is_coming_soon || false,
    });
    setIsSeries(t.is_series);
    setShowForm(true);
  };

  const handleProduceSelect = (id: string) => {
    setSelectedComingSoonId(id);
    const t = titles.find(x => x.id === id);
    if (t) {
      setForm(f => ({
        ...f, title: t.title, description: t.description, row: t.row, category: t.category || [],
        vj_narrator: t.vj_narrator || "", genre: t.genre, language: t.language,
        thumbnail_url: t.thumbnail_url || "", is_coming_soon: false, status: "live",
      }));
    }
  };

  const handleSeriesSelect = (id: string) => {
    setSelectedSeriesId(id);
    const s = titles.find(x => x.id === id);
    if (s) {
      const parts = titles.filter(x => x.series_id === id);
      const maxEp = parts.length > 0 ? Math.max(...parts.map(p => p.episode)) : 0;
      setForm(f => ({
        ...f, series_id: id, title: s.title, thumbnail_url: s.thumbnail_url || "",
        category: s.category || [], row: s.row, vj_narrator: s.vj_narrator || "",
        genre: s.genre, language: s.language, description: s.description,
        episode: maxEp + 1, is_series: false,
      }));
    }
  };

  const saveContent = async () => {
    if (!form.title) return;
    setSaving(true);

    const payload: any = { ...form };
    if (isSeries && seriesMode === "new" && !editingId) {
      payload.is_series = true;
      payload.series_id = null;
    }

    if (uploadMode === "produce" && selectedComingSoonId && !editingId) {
      // Update existing coming soon item
      await supabase.from("titles").update({
        video_url: form.video_url, is_coming_soon: false, status: "live",
      }).eq("id", selectedComingSoonId);
    } else if (editingId) {
      await supabase.from("titles").update(payload).eq("id", editingId);
    } else {
      await supabase.from("titles").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("titles").delete().eq("id", deleteId);
    setDeleteId(null);
  };

  // Blog CRUD
  const openAddBlog = () => {
    setEditingBlogId(null);
    setBlogForm({ title: "", slug: "", excerpt: "", content: "", cover_image: "", author: "Cinematic Lens", published: true });
    setShowBlogForm(true);
  };
  const openEditBlog = (b: any) => {
    setEditingBlogId(b.id);
    setBlogForm({ title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, cover_image: b.cover_image, author: b.author, published: b.published });
    setShowBlogForm(true);
  };
  const saveBlog = async () => {
    if (!blogForm.title) return;
    setSaving(true);
    const slug = blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = { ...blogForm, slug };
    if (editingBlogId) {
      await supabase.from("blog_posts").update(payload).eq("id", editingBlogId);
    } else {
      await supabase.from("blog_posts").insert(payload);
    }
    setSaving(false);
    setShowBlogForm(false);
  };
  const confirmDeleteBlog = async () => {
    if (!deleteBlogId) return;
    await supabase.from("blog_posts").delete().eq("id", deleteBlogId);
    setDeleteBlogId(null);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      category: f.category.includes(cat) ? f.category.filter(c => c !== cat) : [...f.category, cat],
    }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-14"}`}>
        <div className="p-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground p-1 hover:bg-secondary rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {sidebarOpen && (
            <div>
              <img src={logoHorizontal} alt="Cinematic Lens" className="h-7" />
              <p className="text-[9px] text-muted-foreground tracking-wider">ADMIN CONSOLE</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              title={item.label}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
      <main className={`flex-1 p-6 md:p-8 transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-14"}`}>
        {loadingData ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* DASHBOARD */}
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
                      <CardHeader className="pb-2 p-4"><CardTitle className="text-xs text-muted-foreground font-normal">{s.label}</CardTitle></CardHeader>
                      <CardContent className="p-4 pt-0"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="bg-card border-border">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Content</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-2xl font-bold text-foreground">{titles.length}</p><p className="text-xs text-muted-foreground">Total Titles</p></div>
                        <div><p className="text-2xl font-bold text-foreground">{titles.filter(t => t.is_vj).length}</p><p className="text-xs text-muted-foreground">VJ Content</p></div>
                        <div><p className="text-2xl font-bold text-foreground">{titles.filter(t => t.is_free).length}</p><p className="text-xs text-muted-foreground">Free</p></div>
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
                          {transactions.slice(0, 10).map((tx: any) => (
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

            {/* CONTENT LIBRARY */}
            {tab === "content" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
                    <p className="text-sm text-muted-foreground">{titles.length} titles</p>
                  </div>
                  <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add New</Button>
                </div>
                <div className="bg-card border border-border rounded-xl overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Thumbnail</TableHead>
                        <TableHead className="text-muted-foreground">Title</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Row</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Category</TableHead>
                        <TableHead className="text-muted-foreground hidden lg:table-cell">VJ</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Price</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {titles.map((item: any) => (
                        <TableRow key={item.id} className="border-border">
                          <TableCell>
                            {item.thumbnail_url ? (
                              <img src={item.thumbnail_url} alt="" className="w-10 h-14 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-14 bg-secondary rounded" />
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.language} · {item.year}</p>
                            {item.series_id && <p className="text-[10px] text-primary">S{item.season}E{item.episode}</p>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.row || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(item.category || []).slice(0, 2).map((c: string) => (
                                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{c}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{item.vj_narrator || "—"}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.is_series ? "bg-primary/20 text-primary" :
                              item.series_id ? "bg-cinema-gold/20 text-cinema-gold" :
                              item.is_free ? "bg-green-500/20 text-green-400" :
                              "bg-secondary text-secondary-foreground"
                            }`}>
                              {item.is_series ? "Series" : item.series_id ? "Episode" : item.is_free ? "Free" : "Single"}
                            </span>
                          </TableCell>
                          <TableCell className="text-primary font-semibold text-sm">
                            {item.is_free ? "Free" : `UGX ${item.price.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.is_coming_soon ? "bg-cinema-gold/20 text-cinema-gold" :
                              item.status === "live" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {item.is_coming_soon ? "Coming Soon" : item.status === "live" ? "Live" : item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* BLOG */}
            {tab === "blog" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-foreground">Blog Posts ({blogPosts.length})</h1>
                  <Button onClick={openAddBlog} className="gap-2"><Plus className="w-4 h-4" /> New Post</Button>
                </div>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Title</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Author</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogPosts.map((b: any) => (
                        <TableRow key={b.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{b.title}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{b.author}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded ${b.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {b.published ? "Published" : "Draft"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openEditBlog(b)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteBlogId(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Users ({profiles.length})</h1>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Username</TableHead>
                      <TableHead className="text-muted-foreground">Wallet</TableHead>
                      <TableHead className="text-muted-foreground">Free Credits</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Referrals</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Joined</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {profiles.map((p: any) => (
                        <TableRow key={p.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{p.username || "—"}</TableCell>
                          <TableCell className="text-primary font-semibold">UGX {p.wallet.toLocaleString()}</TableCell>
                          <TableCell>{p.free_credits}</TableCell>
                          <TableCell className="hidden md:table-cell">{p.referral_count}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* TRANSACTIONS */}
            {tab === "transactions" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Transaction History</h1>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No transactions recorded yet.</p>
                ) : (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">Title</TableHead>
                        <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {transactions.map((tx: any) => (
                          <TableRow key={tx.id} className="border-border">
                            <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</TableCell>
                            <TableCell><span className={`text-xs px-2 py-0.5 rounded capitalize ${tx.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>{tx.type.replace("_", " ")}</span></TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{tx.title_name || "—"}</TableCell>
                            <TableCell className="text-right font-semibold"><span className={tx.type === "deposit" ? "text-green-400" : "text-foreground"}>{tx.type === "deposit" ? "+" : "-"}UGX {tx.amount.toLocaleString()}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* REFERRALS */}
            {tab === "referrals" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Referrals Overview</h1>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Referral Codes</p><p className="text-2xl font-bold text-foreground">{profiles.filter((p: any) => p.referral_code).length}</p></CardContent></Card>
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Users with Referrals</p><p className="text-2xl font-bold text-foreground">{profiles.filter((p: any) => p.referral_count > 0).length}</p></CardContent></Card>
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Referral Count</p><p className="text-2xl font-bold text-foreground">{profiles.reduce((s: number, p: any) => s + p.referral_count, 0)}</p></CardContent></Card>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {tab === "analytics" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Wallet</p><p className="text-xl font-bold text-foreground">UGX {profiles.length ? Math.round(profiles.reduce((s: number, p: any) => s + p.wallet, 0) / profiles.length).toLocaleString() : 0}</p></CardContent></Card>
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">VJ %</p><p className="text-xl font-bold text-foreground">{titles.length ? Math.round((titles.filter((t: any) => t.is_vj).length / titles.length) * 100) : 0}%</p></CardContent></Card>
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Free %</p><p className="text-xl font-bold text-foreground">{titles.length ? Math.round((titles.filter((t: any) => t.is_free).length / titles.length) * 100) : 0}%</p></CardContent></Card>
                  <Card className="bg-card border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rev/User</p><p className="text-xl font-bold text-foreground">UGX {profiles.length ? Math.round(totalRevenue / profiles.length).toLocaleString() : 0}</p></CardContent></Card>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab === "settings" && (
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
                <Card className="bg-card border-border max-w-lg">
                  <CardContent className="p-6 space-y-4">
                    <div><p className="text-sm text-muted-foreground">Platform</p><p className="text-foreground font-medium">Cinematic Lens</p></div>
                    <div><p className="text-sm text-muted-foreground">Company</p><p className="text-foreground font-medium">HADZ GROUP OF COMPANIES</p></div>
                    <div><p className="text-sm text-muted-foreground">Default Price</p><p className="text-foreground font-medium">UGX 400</p></div>
                    <div><p className="text-sm text-muted-foreground">Minimum Deposit</p><p className="text-foreground font-medium">UGX 3,000</p></div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ADD/EDIT CONTENT MODAL */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Title" : "Add New Movie / Series"}</DialogTitle>
              <DialogDescription>Fill in the details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Upload mode radio */}
              {!editingId && (
                <div className="flex gap-4 p-3 bg-secondary rounded-lg">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" checked={uploadMode === "new"} onChange={() => { setUploadMode("new"); resetForm(); }} className="accent-primary" />
                    New Movie / Series
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" checked={uploadMode === "produce"} onChange={() => setUploadMode("produce")} className="accent-primary" />
                    Produce Existing Coming Soon
                  </label>
                </div>
              )}

              {/* Produce coming soon dropdown */}
              {uploadMode === "produce" && !editingId && (
                <div>
                  <label className="text-sm text-muted-foreground">Select Coming Soon title</label>
                  <select value={selectedComingSoonId} onChange={e => handleProduceSelect(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                    <option value="">Choose...</option>
                    {comingSoonList.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}

              {/* Series checkbox */}
              {uploadMode === "new" && !editingId && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={isSeries} onChange={e => { setIsSeries(e.target.checked); setForm(f => ({ ...f, is_series: e.target.checked })); }} className="rounded accent-primary" />
                  This is a Series
                </label>
              )}

              {/* Series mode */}
              {isSeries && uploadMode === "new" && !editingId && (
                <div className="space-y-3">
                  <div className="flex gap-4 p-3 bg-secondary rounded-lg">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={seriesMode === "new"} onChange={() => setSeriesMode("new")} className="accent-primary" />
                      New Series
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={seriesMode === "continue"} onChange={() => setSeriesMode("continue")} className="accent-primary" />
                      Continue Existing Series
                    </label>
                  </div>
                  {seriesMode === "continue" && (
                    <div>
                      <label className="text-sm text-muted-foreground">Select Series</label>
                      <select value={selectedSeriesId} onChange={e => handleSeriesSelect(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                        <option value="">Choose...</option>
                        {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Season</label>
                      <Input type="number" min={1} max={100} value={form.season} onChange={e => setForm(f => ({ ...f, season: Number(e.target.value) }))} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Episode / Part</label>
                      <Input type="number" min={1} value={form.episode} onChange={e => setForm(f => ({ ...f, episode: Number(e.target.value) }))} className="bg-secondary border-border" />
                    </div>
                  </div>
                </div>
              )}

              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" readOnly={uploadMode === "produce" && !!selectedComingSoonId} />
              <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" readOnly={uploadMode === "produce" && !!selectedComingSoonId} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Genre" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="bg-secondary border-border" />
                <Input placeholder="Language" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="bg-secondary border-border" />
                <Input placeholder="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="bg-secondary border-border" />
                <Input placeholder="Rating" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="bg-secondary border-border" />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Row (where it appears on homepage)</label>
                <Input placeholder="e.g. trending, originals, luganda" value={form.row} onChange={e => setForm(f => ({ ...f, row: e.target.value }))} className="bg-secondary border-border" readOnly={uploadMode === "produce" && !!selectedComingSoonId} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { if (!(uploadMode === "produce" && selectedComingSoonId)) toggleCategory(cat); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        form.category.includes(cat) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">VJ Narrator</label>
                <select value={form.vj_narrator} onChange={e => setForm(f => ({ ...f, vj_narrator: e.target.value, is_vj: !!e.target.value }))} className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                  <option value="">None</option>
                  {VJ_NARRATORS.map(vj => <option key={vj} value={vj}>{vj}</option>)}
                </select>
              </div>

              <Input placeholder="Thumbnail URL" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Video URL (MP4 / TeraBox direct link)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="bg-secondary border-border" />

              <Input type="number" placeholder="Price (UGX)" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="bg-secondary border-border" />

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked, price: e.target.checked ? 0 : 400 }))} className="rounded accent-primary" /> Free
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.is_coming_soon} onChange={e => setForm(f => ({ ...f, is_coming_soon: e.target.checked, status: e.target.checked ? "coming_soon" : "live" }))} className="rounded accent-primary" /> Coming Soon
                </label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveContent} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE CONTENT */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader><DialogTitle>Delete Title</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADD/EDIT BLOG MODAL */}
        <Dialog open={showBlogForm} onOpenChange={setShowBlogForm}>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingBlogId ? "Edit Post" : "New Blog Post"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Slug (auto-generated)" value={blogForm.slug} onChange={e => setBlogForm(f => ({ ...f, slug: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Cover Image URL" value={blogForm.cover_image} onChange={e => setBlogForm(f => ({ ...f, cover_image: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Excerpt" value={blogForm.excerpt} onChange={e => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} className="bg-secondary border-border" />
              <Textarea placeholder="Content" value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} className="bg-secondary border-border min-h-[150px]" />
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={blogForm.published} onChange={e => setBlogForm(f => ({ ...f, published: e.target.checked }))} className="rounded accent-primary" /> Published
              </label>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowBlogForm(false)}>Cancel</Button>
              <Button onClick={saveBlog} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE BLOG */}
        <Dialog open={!!deleteBlogId} onOpenChange={() => setDeleteBlogId(null)}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader><DialogTitle>Delete Post</DialogTitle><DialogDescription>Are you sure?</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteBlogId(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDeleteBlog}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
