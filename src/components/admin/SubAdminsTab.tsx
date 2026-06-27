import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Loader2, DollarSign, Save, Link as LinkIcon, Copy, Mail, Clock } from "lucide-react";

const ALL_FEATURES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "transactions", label: "Transactions" },
  { id: "row_earnings", label: "Row Earnings" },
  { id: "content", label: "Content Library" },
  { id: "pricing", label: "Pricing" },
  { id: "manage_categories", label: "Categories" },
  { id: "manage_vjs", label: "VJ Narrators" },
  { id: "manage_rows", label: "Content Rows" },
  { id: "logo_intro", label: "Logo Animation" },
  { id: "marquee", label: "Marquee Ads" },
  { id: "squeeze", label: "Squeeze Back" },
  { id: "lower_third", label: "Lower Third" },
  { id: "music", label: "Background Music" },
  { id: "referrals", label: "Referrals" },
  { id: "wallet_promo", label: "Wallet Promo" },
  { id: "settings", label: "Settings" },
];

export default function SubAdminsTab() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const [sharedIncome, setSharedIncome] = useState<string>("0");
  const [savingIncome, setSavingIncome] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("sub_admins").select("*").order("created_at", { ascending: false });
    setAdmins(data || []);
  };

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("sub_admin_invites" as any)
      .select("*")
      .is("used_at", null)
      .order("created_at", { ascending: false });
    setInvites((data as any[]) || []);
  };

  const fetchSharedIncome = async () => {
    const { data } = await supabase
      .from("admin_dashboard_settings")
      .select("displayed_income")
      .order("id")
      .limit(1)
      .maybeSingle();
    setSharedIncome(String(data?.displayed_income ?? 0));
  };

  useEffect(() => {
    fetchAdmins();
    fetchInvites();
    fetchSharedIncome();
  }, []);

  const saveSharedIncome = async () => {
    setSavingIncome(true);
    const value = parseInt(sharedIncome) || 0;
    const { error } = await supabase
      .from("admin_dashboard_settings")
      .upsert({ id: 1, displayed_income: value, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message);
    else toast.success("Displayed income updated for all sub-admins");
    setSavingIncome(false);
  };

  const sendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setInviting(true);
    setLastInviteUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-sub-admin-invite", {
        body: {
          email,
          displayName: inviteName.trim(),
          appOrigin: "https://cinematiclens.cc",
        },
      });
      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || "Failed to send invite");
      }
      setLastInviteUrl(data.invite_url);
      if (data.email_sent) toast.success("Invitation email sent!");
      else toast.success("Invite link created (email failed — copy it below)");
      setInviteEmail("");
      setInviteName("");
      fetchInvites();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy. Long-press to select.");
    }
  };

  const revokeInvite = async (id: string) => {
    const { error } = await supabase
      .from("sub_admin_invites" as any)
      .update({ used_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Invite revoked"); fetchInvites(); }
  };

  const toggleFeature = async (adminId: string, featureId: string, currentFeatures: string[]) => {
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    const { error } = await supabase.from("sub_admins").update({ enabled_features: newFeatures }).eq("id", adminId);
    if (error) toast.error(error.message);
    else { toast.success("Permission updated"); fetchAdmins(); }
  };

  const toggleActive = async (adminId: string, current: boolean) => {
    const { error } = await supabase.from("sub_admins").update({ is_active: !current }).eq("id", adminId);
    if (error) toast.error(error.message);
    else fetchAdmins();
  };

  const deleteAdmin = async (adminId: string) => {
    const { error } = await supabase.from("sub_admins").delete().eq("id", adminId);
    if (error) toast.error(error.message);
    else { toast.success("Sub-admin removed"); fetchAdmins(); }
  };

  return (
    <div className="space-y-6">
      {/* Shared Displayed Income */}
      <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-display text-base">Shared Displayed Income</h3>
            <p className="text-xs text-muted-foreground">All sub-admins see this same number on their dashboard.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={sharedIncome}
            onChange={e => setSharedIncome(e.target.value)}
            className="bg-secondary"
            placeholder="0"
          />
          <span className="text-sm text-muted-foreground">UGX</span>
          <Button onClick={saveSharedIncome} disabled={savingIncome} className="gap-1">
            {savingIncome ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display">Sub-Admins</h2>
          <p className="text-sm text-muted-foreground">
            Invite team members by one-time link. They set their own password. New sub-admins start fully locked — you grant features here.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-1">
          <LinkIcon className="w-4 h-4" /> Invite by Link
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-card rounded-xl border border-primary/40 p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Send One-Time Invite Link
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="newadmin@example.com"
                className="bg-secondary"
              />
            </div>
            <div>
              <Label className="text-xs">Suggested Name (optional)</Label>
              <Input
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="John"
                className="bg-secondary"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            They'll receive an email with a secure link. The link expires in <strong>24 hours</strong> and can only be used once. They will set their own password.
          </p>
          <div className="flex gap-2">
            <Button onClick={sendInvite} disabled={inviting} className="gap-1">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Invite
            </Button>
            <Button variant="outline" onClick={() => { setShowInvite(false); setLastInviteUrl(null); }}>
              Close
            </Button>
          </div>

          {lastInviteUrl && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/60 border border-border space-y-2">
              <p className="text-[11px] text-muted-foreground">Backup invite link (in case email doesn't arrive):</p>
              <div className="flex gap-2">
                <Input readOnly value={lastInviteUrl} className="bg-background text-xs" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(lastInviteUrl)} className="gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Pending Invites ({invites.length})</h3>
          {invites.map(inv => {
            const expired = new Date(inv.expires_at).getTime() < Date.now();
            const url = `https://cinematiclens.cc/admin/claim-invite?token=${inv.token}`;
            return (
              <div key={inv.id} className={`rounded-lg border p-3 flex items-center justify-between gap-2 ${expired ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {expired ? "Expired" : `Expires ${new Date(inv.expires_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(url)} className="gap-1">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => revokeInvite(inv.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active sub-admins */}
      {admins.map(admin => {
        const features = Array.isArray(admin.enabled_features) ? admin.enabled_features : [];
        return (
          <div key={admin.id} className={`rounded-xl border p-4 space-y-3 ${admin.is_active ? "border-primary/30 bg-card" : "border-border bg-muted/30"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">{admin.display_name || admin.email}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={admin.is_active} onCheckedChange={() => toggleActive(admin.id, admin.is_active)} />
                <Button size="sm" variant="destructive" onClick={() => deleteAdmin(admin.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Permitted Features {features.length === 0 && <span className="text-destructive">(none — fully locked)</span>}:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_FEATURES.map(f => (
                  <label key={f.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch
                      checked={features.includes(f.id)}
                      onCheckedChange={() => toggleFeature(admin.id, f.id, features)}
                      className="scale-75"
                    />
                    <span className={features.includes(f.id) ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {admins.length === 0 && invites.length === 0 && !showInvite && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No sub-admins yet. Click <strong>Invite by Link</strong> to add one.
        </div>
      )}
    </div>
  );
}
