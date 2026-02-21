import { useState } from "react";
import { useStore } from "@/lib/store";
import { titles as seedTitles, Title } from "@/lib/content-data";
import { ArrowLeft, Plus, Pencil, Trash2, Film, Users, Wallet, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Tab = "overview" | "content" | "transactions";

export default function Admin() {
  const { wallet, freeCredits, transactions, username, isLoggedIn } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [contentList, setContentList] = useState<Title[]>(seedTitles);
  const [editing, setEditing] = useState<Title | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<Title>>({
    title: "", description: "", genre: "", language: "English", year: 2025,
    duration: "", rating: "PG-13", isFree: false, isVJ: false, category: [],
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  });

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "content", label: "Content", icon: <Film className="w-4 h-4" /> },
    { key: "transactions", label: "Transactions", icon: <Wallet className="w-4 h-4" /> },
  ];

  // Stats
  const totalDeposits = transactions.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalWatches = transactions.filter(t => t.type === "watch" || t.type === "credit_used").length;
  const totalRevenue = transactions.filter(t => t.type === "watch").reduce((s, t) => s + t.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "", description: "", genre: "", language: "English", year: 2025,
      duration: "", rating: "PG-13", isFree: false, isVJ: false, category: [],
      videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    });
    setShowForm(true);
  };

  const openEdit = (t: Title) => {
    setEditing(t);
    setForm({ ...t });
    setShowForm(true);
  };

  const saveContent = () => {
    if (!form.title) return;
    if (editing) {
      setContentList(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } as Title : c));
    } else {
      const newTitle: Title = {
        ...(form as Title),
        id: Date.now().toString(),
        thumbnail: "",
        category: form.category || [],
      };
      setContentList(prev => [...prev, newTitle]);
    }
    setShowForm(false);
  };

  const deleteContent = (id: string) => {
    setContentList(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="bg-background min-h-screen pt-20 px-4 md:px-12 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-display text-3xl md:text-4xl mb-1">Admin Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage content, track users & revenue.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-card border border-border rounded-lg p-1 max-w-md">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 flex-1 px-3 py-2 rounded text-sm font-medium transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs text-muted-foreground font-normal">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl text-display text-cinema-gold">UGX {totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs text-muted-foreground font-normal">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl text-display">UGX {totalDeposits.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs text-muted-foreground font-normal">Watches</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl text-display">{totalWatches}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs text-muted-foreground font-normal">Current User</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-lg text-display">{isLoggedIn ? username : "Guest"}</p>
                <p className="text-xs text-muted-foreground">Bal: UGX {wallet.toLocaleString()} · {freeCredits} credits</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue breakdown chart placeholder */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-foreground">Transaction Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No transactions yet. Activity will appear here.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {[...transactions].reverse().map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tx.type === "deposit" ? "bg-cinema-gold" :
                          tx.type === "watch" ? "bg-primary" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="text-sm capitalize">{tx.type.replace("_", " ")}</p>
                          {tx.titleName && <p className="text-xs text-muted-foreground">{tx.titleName}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tx.type === "deposit" ? "text-cinema-gold" : "text-foreground"}`}>
                          {tx.type === "deposit" ? "+" : "-"}UGX {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content library count */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-foreground">Content Library</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl text-display">{contentList.length}</p>
                  <p className="text-xs text-muted-foreground">Total Titles</p>
                </div>
                <div>
                  <p className="text-2xl text-display">{contentList.filter(c => c.isVJ).length}</p>
                  <p className="text-xs text-muted-foreground">VJ Content</p>
                </div>
                <div>
                  <p className="text-2xl text-display">{contentList.filter(c => c.isFree).length}</p>
                  <p className="text-xs text-muted-foreground">Free Titles</p>
                </div>
                <div>
                  <p className="text-2xl text-display">{new Set(contentList.map(c => c.genre)).size}</p>
                  <p className="text-xs text-muted-foreground">Genres</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── CONTENT MANAGEMENT ─── */}
      {tab === "content" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display text-xl">All Content ({contentList.length})</h2>
            <Button onClick={openAdd} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Title
            </Button>
          </div>

          {/* Form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-display text-lg mb-4">{editing ? "Edit Title" : "Add New Title"}</h3>
                <div className="space-y-3">
                  <Input placeholder="Title" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Input placeholder="Description" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Genre" value={form.genre || ""} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
                    <Input placeholder="Language" value={form.language || ""} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input type="number" placeholder="Year" value={form.year || ""} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
                    <Input placeholder="Duration" value={form.duration || ""} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                    <Input placeholder="Rating" value={form.rating || ""} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
                  </div>
                  <Input placeholder="Video URL" value={form.videoUrl || ""} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
                  <Input placeholder="Categories (comma-separated)" value={(form.category || []).join(", ")} onChange={e => setForm(f => ({ ...f, category: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.isFree || false} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} className="rounded" />
                      Free
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.isVJ || false} onChange={e => setForm(f => ({ ...f, isVJ: e.target.checked }))} className="rounded" />
                      VJ Content
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button onClick={saveContent} className="flex-1">Save</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* Content table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Genre</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Language</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentList.map(item => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{item.genre}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{item.language}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.isFree ? "bg-cinema-gold/20 text-cinema-gold" :
                        item.isVJ ? "bg-primary/20 text-primary" :
                        "bg-secondary text-secondary-foreground"
                      }`}>
                        {item.isFree ? "Free" : item.isVJ ? "VJ" : "Paid"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteContent(item.id)}>
                          <Trash2 className="w-4 h-4 text-primary" />
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

      {/* ─── TRANSACTIONS ─── */}
      {tab === "transactions" && (
        <div>
          <h2 className="text-display text-xl mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No transactions recorded yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                  {[...transactions].reverse().map(tx => (
                    <TableRow key={tx.id} className="border-border">
                      <TableCell className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                          tx.type === "deposit" ? "bg-cinema-gold/20 text-cinema-gold" :
                          tx.type === "watch" ? "bg-primary/20 text-primary" :
                          "bg-secondary text-secondary-foreground"
                        }`}>
                          {tx.type.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{tx.titleName || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={tx.type === "deposit" ? "text-cinema-gold" : "text-foreground"}>
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
    </div>
  );
}
