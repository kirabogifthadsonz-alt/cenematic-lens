import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Type, Image, Square, AlignLeft, Layers, Eye, EyeOff, Upload, Loader2, ChevronUp, ChevronDown, Sparkles, Clock, Wand2, Smile, Copy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eraser } from "lucide-react";
import type { LowerThirdLayer, AnimationType, FilterPreset } from "./LowerThirdOverlay";

const FONTS = ["Inter", "Bebas Neue", "Arial", "Georgia", "Courier New", "Impact", "Comic Sans MS", "Verdana"];

const ANIMATIONS: { value: AnimationType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade In" },
  { value: "slideLeft", label: "Slide from Left" },
  { value: "slideRight", label: "Slide from Right" },
  { value: "slideUp", label: "Slide Up" },
  { value: "slideDown", label: "Slide Down" },
  { value: "zoomIn", label: "Zoom In" },
  { value: "bounce", label: "Bounce" },
  { value: "flipIn", label: "Flip In" },
  { value: "popUp", label: "Pop Up" },
  { value: "shake", label: "Shake" },
  { value: "rotate", label: "Rotate In" },
  { value: "elastic", label: "Elastic" },
  { value: "swing", label: "Swing" },
  { value: "rubberBand", label: "Rubber Band" },
  { value: "jello", label: "Jello" },
  { value: "heartbeat", label: "Heartbeat" },
  { value: "flash", label: "Flash" },
];

const FILTER_PRESETS: { value: FilterPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia" },
  { value: "blur", label: "Blur" },
  { value: "brightness", label: "Bright" },
  { value: "contrast", label: "High Contrast" },
  { value: "hueRotate", label: "Hue Shift" },
  { value: "saturate", label: "Saturated" },
  { value: "invert", label: "Invert" },
];

const STICKER_EMOJIS = ["⭐", "🔥", "❤️", "💯", "🎬", "🎥", "🎵", "💎", "👑", "🦁", "🐯", "🦊", "🐻", "🦅", "🐲", "🎉", "✨", "💫", "🌟", "🏆", "🎯", "💪", "🚀", "⚡", "🌈", "🍿", "📺", "🎭", "🎪", "🎨"];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function defaultLayer(type: LowerThirdLayer["type"]): LowerThirdLayer {
  const base = {
    id: generateId(), type, x: 5, y: 10, width: 90, height: 80,
    entranceAnimation: "fadeIn" as AnimationType, exitAnimation: "fadeIn" as AnimationType,
    animationDuration: 0.5, animationDelay: 0,
    layerStartOffset: 0, layerEndOffset: 0,
  };
  if (type === "text") return { ...base, content: "Your text here", fontSize: 18, fontFamily: "Inter", color: "#ffffff", bold: false, italic: false, textAlign: "left" };
  if (type === "image") return { ...base, url: "", objectFit: "contain", borderRadius: 0, width: 30, height: 80, x: 2, y: 10, filterPreset: "none", filterBrightness: 100, filterContrast: 100, filterBlur: 0, filterHueRotate: 0, filterSaturate: 100, filterGrayscale: 0 };
  if (type === "shape") return { ...base, shape: "rect", backgroundColor: "#cc0000", opacity: 0.6, borderRadius: 8, x: 0, y: 0, width: 100, height: 100 };
  if (type === "sticker") return { ...base, sticker: "⭐", stickerRotation: 0, stickerScale: 1, width: 15, height: 50, x: 80, y: 25 };
  // marquee
  return { ...base, content: "Scrolling text here", fontSize: 14, fontFamily: "Inter", color: "#ffffff", bold: true, speed: 50, y: 60, height: 30 };
}

export default function LowerThirdEditorTab() {
  const [ads, setAds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);

  const [adTitle, setAdTitle] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [startTime, setStartTime] = useState("60");
  const [endTime, setEndTime] = useState("90");
  const [heightPct, setHeightPct] = useState("25");
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState("0.7");
  const [layers, setLayers] = useState<LowerThirdLayer[]>([]);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editorTab, setEditorTab] = useState<"props" | "animation" | "filters" | "timeline">("props");

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    const { data } = await supabase.from("lower_third_ads").select("*").order("created_at", { ascending: false });
    setAds(data || []);
  };

  const resetForm = () => {
    setAdTitle(""); setIsEnabled(true); setStartTime("60"); setEndTime("90");
    setHeightPct("25"); setBgColor("#000000"); setBgOpacity("0.7");
    setLayers([]); setSelectedLayerIdx(null); setEditingAd(null); setEditorTab("props");
  };

  const openEdit = (ad: any) => {
    setAdTitle(ad.title); setIsEnabled(ad.is_enabled);
    setStartTime(String(ad.start_time_seconds)); setEndTime(String(ad.end_time_seconds));
    setHeightPct(String(ad.height_percent)); setBgColor(ad.background_color);
    setBgOpacity(String(ad.background_opacity));
    const parsedLayers = Array.isArray(ad.layers) ? ad.layers : JSON.parse(ad.layers || "[]");
    setLayers(parsedLayers); setSelectedLayerIdx(null);
    setEditingAd(ad); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: adTitle, is_enabled: isEnabled,
      start_time_seconds: parseInt(startTime) || 60,
      end_time_seconds: parseInt(endTime) || 90,
      height_percent: Math.min(50, Math.max(10, parseInt(heightPct) || 25)),
      background_color: bgColor,
      background_opacity: Math.min(1, Math.max(0, parseFloat(bgOpacity) || 0.7)),
      layers: layers as any,
    };
    if (editingAd) {
      const { error } = await supabase.from("lower_third_ads").update(payload as any).eq("id", editingAd.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Lower third ad updated!");
    } else {
      const { error } = await supabase.from("lower_third_ads").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Lower third ad created!");
    }
    setShowForm(false); resetForm(); fetchAds();
  };

  const toggleEnabled = async (ad: any) => {
    await supabase.from("lower_third_ads").update({ is_enabled: !ad.is_enabled }).eq("id", ad.id);
    fetchAds();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("lower_third_ads").delete().eq("id", id);
    toast.success("Deleted"); fetchAds();
  };

  const addLayer = (type: LowerThirdLayer["type"]) => {
    const newLayer = defaultLayer(type);
    setLayers([...layers, newLayer]);
    setSelectedLayerIdx(layers.length);
  };

  const updateLayer = (idx: number, updates: Partial<LowerThirdLayer>) => {
    setLayers(layers.map((l, i) => i === idx ? { ...l, ...updates } : l));
  };

  const removeLayer = (idx: number) => {
    setLayers(layers.filter((_, i) => i !== idx));
    setSelectedLayerIdx(null);
  };

  const duplicateLayer = (idx: number) => {
    const clone = { ...layers[idx], id: generateId() };
    const newLayers = [...layers];
    newLayers.splice(idx + 1, 0, clone);
    setLayers(newLayers);
    setSelectedLayerIdx(idx + 1);
  };

  const moveLayer = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= layers.length) return;
    const newLayers = [...layers];
    [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
    setLayers(newLayers);
    setSelectedLayerIdx(newIdx);
  };

  const fmtTime = (secs: string) => {
    const s = parseInt(secs) || 0;
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const selectedLayer = selectedLayerIdx !== null ? layers[selectedLayerIdx] : null;
  const adDuration = (parseInt(endTime) || 90) - (parseInt(startTime) || 60);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display">Lower Third Ads</h2>
          <p className="text-sm text-muted-foreground">In-video overlay ads with text, images, shapes, stickers & scrolling text.</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Ad
        </Button>
      </div>

      {/* Ad list */}
      <div className="space-y-3">
        {ads.map((ad) => (
          <div key={ad.id} className={`flex items-center gap-4 p-4 rounded-xl border ${ad.is_enabled ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
            <Layers className="w-8 h-8 text-primary/60 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ad.title || "Untitled Ad"}</p>
              <p className="text-xs text-muted-foreground">
                {fmtTime(String(ad.start_time_seconds))} – {fmtTime(String(ad.end_time_seconds))} • 
                {(Array.isArray(ad.layers) ? ad.layers : []).length} layers • 
                {ad.height_percent}% height • 
                {ad.is_enabled ? " ✅ Enabled" : " ⏸ Disabled"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleEnabled(ad)}>{ad.is_enabled ? "Disable" : "Enable"}</Button>
              <Button size="sm" variant="outline" onClick={() => openEdit(ad)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(ad.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No lower third ads yet. Create one to get started!</div>
        )}
      </div>

      {/* Editor modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-5xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display">{editingAd ? "Edit Lower Third Ad" : "New Lower Third Ad"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic settings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Label>Ad Title</Label>
                  <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="e.g. MTN Promo" className="bg-secondary" />
                </div>
                <div>
                  <Label>Start Time (sec)</Label>
                  <Input type="number" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-secondary" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(startTime)}</p>
                </div>
                <div>
                  <Label>End Time (sec)</Label>
                  <Input type="number" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-secondary" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(endTime)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Height %</Label>
                  <Input type="number" min="10" max="50" value={heightPct} onChange={(e) => setHeightPct(e.target.value)} className="bg-secondary" />
                </div>
                <div>
                  <Label>BG Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="bg-secondary flex-1" />
                  </div>
                </div>
                <div>
                  <Label>BG Opacity</Label>
                  <Input type="number" min="0" max="1" step="0.1" value={bgOpacity} onChange={(e) => setBgOpacity(e.target.value)} className="bg-secondary" />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                    <Label className="text-sm">Enabled</Label>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Live Preview</Label>
                  <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-xs text-muted-foreground flex items-center gap-1">
                    {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPreview ? "Hide" : "Show"}
                  </button>
                </div>
                {showPreview && (
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/20 text-sm">Video Player Area</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: `${parseInt(heightPct) || 25}%` }}>
                      <div className="absolute inset-0" style={{ backgroundColor: bgColor, opacity: parseFloat(bgOpacity) || 0.7 }} />
                      <div className="absolute inset-0">
                        {layers.map((layer, idx) => (
                          <PreviewLayer key={layer.id} layer={layer} isSelected={selectedLayerIdx === idx} onClick={() => setSelectedLayerIdx(idx)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer management */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Layers ({layers.length})</Label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => addLayer("text")} className="gap-1">
                    <Type className="w-3.5 h-3.5" /> Text
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => addLayer("image")} className="gap-1">
                    <Image className="w-3.5 h-3.5" /> Image
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => addLayer("shape")} className="gap-1">
                    <Square className="w-3.5 h-3.5" /> Shape
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => addLayer("marquee")} className="gap-1">
                    <AlignLeft className="w-3.5 h-3.5" /> Marquee
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => addLayer("sticker")} className="gap-1">
                    <Smile className="w-3.5 h-3.5" /> Sticker
                  </Button>
                </div>

                {/* Layer list */}
                <div className="space-y-1 mb-3">
                  {layers.map((layer, idx) => (
                    <div
                      key={layer.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${selectedLayerIdx === idx ? "bg-primary/20 border border-primary/40" : "bg-secondary/50 border border-transparent hover:bg-secondary"}`}
                      onClick={() => setSelectedLayerIdx(idx)}
                    >
                      {layer.type === "text" && <Type className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(210 80% 60%)" }} />}
                      {layer.type === "image" && <Image className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(130 60% 50%)" }} />}
                      {layer.type === "shape" && <Square className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(30 80% 55%)" }} />}
                      {layer.type === "marquee" && <AlignLeft className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(270 60% 60%)" }} />}
                      {layer.type === "sticker" && <span className="text-sm shrink-0">{layer.sticker || "⭐"}</span>}
                      <span className="flex-1 truncate">{layer.type}: {layer.content || layer.url || layer.sticker || layer.shape || "layer"}</span>
                      {layer.entranceAnimation && layer.entranceAnimation !== "none" && <Sparkles className="w-3 h-3 text-accent shrink-0" />}
                      <div className="flex items-center gap-0.5">
                        <button type="button" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveLayer(idx, -1); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" disabled={idx === layers.length - 1} onClick={(e) => { e.stopPropagation(); moveLayer(idx, 1); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); duplicateLayer(idx); }} className="text-muted-foreground hover:text-foreground" title="Duplicate">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeLayer(idx); }} className="text-destructive hover:text-destructive/80" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Selected layer editor */}
                {selectedLayer && selectedLayerIdx !== null && (
                  <div className="border border-border rounded-lg bg-secondary/30 overflow-hidden">
                    {/* Sub-tabs */}
                    <div className="flex border-b border-border">
                      {[
                        { key: "props", label: "Properties", icon: <Wand2 className="w-3.5 h-3.5" /> },
                        { key: "animation", label: "Animation", icon: <Sparkles className="w-3.5 h-3.5" /> },
                        ...(selectedLayer.type === "image" ? [{ key: "filters", label: "Filters", icon: <Eye className="w-3.5 h-3.5" /> }] : []),
                        { key: "timeline", label: "Timeline", icon: <Clock className="w-3.5 h-3.5" /> },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${editorTab === tab.key ? "bg-primary/15 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                          onClick={() => setEditorTab(tab.key as any)}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit {selectedLayer.type} Layer</p>

                      {/* Properties Tab */}
                      {editorTab === "props" && (
                        <>
                          {/* Position controls */}
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs">X %</Label>
                              <Input type="number" min="0" max="100" value={selectedLayer.x} onChange={(e) => updateLayer(selectedLayerIdx, { x: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
                            </div>
                            <div>
                              <Label className="text-xs">Y %</Label>
                              <Input type="number" min="0" max="100" value={selectedLayer.y} onChange={(e) => updateLayer(selectedLayerIdx, { y: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
                            </div>
                            <div>
                              <Label className="text-xs">W %</Label>
                              <Input type="number" min="1" max="100" value={selectedLayer.width} onChange={(e) => updateLayer(selectedLayerIdx, { width: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
                            </div>
                            <div>
                              <Label className="text-xs">H %</Label>
                              <Input type="number" min="1" max="100" value={selectedLayer.height} onChange={(e) => updateLayer(selectedLayerIdx, { height: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
                            </div>
                          </div>

                          {/* Nudge buttons */}
                          <div>
                            <Label className="text-xs mb-1.5 block">Nudge Position</Label>
                            <div className="flex items-center gap-2">
                              <div className="grid grid-cols-3 gap-1 w-fit">
                                <div />
                                <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateLayer(selectedLayerIdx, { y: Math.max(0, selectedLayer.y - 1) })} title="Move Up">
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <div />
                                <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateLayer(selectedLayerIdx, { x: Math.max(0, selectedLayer.x - 1) })} title="Move Left">
                                  <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateLayer(selectedLayerIdx, { y: Math.min(100, selectedLayer.y + 1) })} title="Move Down">
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateLayer(selectedLayerIdx, { x: Math.min(100, selectedLayer.x + 1) })} title="Move Right">
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground ml-2">
                                <p>Move 1% per click</p>
                                <p className="text-[10px] opacity-60">X: {selectedLayer.x}% • Y: {selectedLayer.y}%</p>
                              </div>
                            </div>
                          </div>

                          {/* Global opacity */}
                          <div>
                            <Label className="text-xs">Layer Opacity</Label>
                            <div className="flex items-center gap-2">
                              <Slider value={[selectedLayer.opacity ?? 1]} min={0} max={1} step={0.05} onValueChange={([v]) => updateLayer(selectedLayerIdx, { opacity: v })} className="flex-1" />
                              <span className="text-xs text-muted-foreground w-10 text-right">{((selectedLayer.opacity ?? 1) * 100).toFixed(0)}%</span>
                            </div>
                          </div>

                          {(selectedLayer.type === "text" || selectedLayer.type === "marquee") && (
                            <TextLayerProps layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx, u)} />
                          )}

                          {/* Image */}
                          {selectedLayer.type === "image" && (
                            <ImageLayerEditor layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx, u)} />
                          )}

                          {/* Shape */}
                          {selectedLayer.type === "shape" && (
                            <ShapeLayerProps layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx, u)} />
                          )}

                          {/* Sticker */}
                          {selectedLayer.type === "sticker" && (
                            <StickerLayerProps layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx, u)} />
                          )}
                        </>
                      )}

                      {/* Animation Tab */}
                      {editorTab === "animation" && (
                        <AnimationEditor layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx!, u)} />
                      )}

                      {/* Filters Tab (Image only) */}
                      {editorTab === "filters" && selectedLayer.type === "image" && (
                        <FilterEditor layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx!, u)} />
                      )}

                      {/* Timeline Tab */}
                      {editorTab === "timeline" && (
                        <TimelineEditor layer={selectedLayer} onUpdate={(u) => updateLayer(selectedLayerIdx!, u)} adDuration={adDuration} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingAd ? "Update Ad" : "Create Ad"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Sub-components ========== */

function TextLayerProps({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  return (
    <>
      <div>
        <Label className="text-xs">Content</Label>
        <Textarea value={layer.content || ""} onChange={(e) => onUpdate({ content: e.target.value })} className="bg-secondary text-xs min-h-[60px]" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Font Size</Label>
          <Input type="number" min="8" max="72" value={layer.fontSize || 16} onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">Font</Label>
          <Select value={layer.fontFamily || "Inter"} onValueChange={(v) => onUpdate({ fontFamily: v })}>
            <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-1">
            <input type="color" value={layer.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Input value={layer.color || "#ffffff"} onChange={(e) => onUpdate({ color: e.target.value })} className="bg-secondary h-8 text-xs flex-1" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={layer.bold || false} onChange={(e) => onUpdate({ bold: e.target.checked })} /> Bold
        </label>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={layer.italic || false} onChange={(e) => onUpdate({ italic: e.target.checked })} /> Italic
        </label>
        {layer.type === "text" && (
          <Select value={layer.textAlign || "left"} onValueChange={(v) => onUpdate({ textAlign: v as any })}>
            <SelectTrigger className="bg-secondary h-7 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        )}
        {layer.type === "marquee" && (
          <div className="flex items-center gap-1">
            <Label className="text-xs">Speed</Label>
            <Input type="number" min="10" max="200" value={layer.speed || 50} onChange={(e) => onUpdate({ speed: Number(e.target.value) })} className="bg-secondary h-7 text-xs w-16" />
          </div>
        )}
      </div>
      <div>
        <Label className="text-xs">Text Shadow</Label>
        <Select value={layer.textShadow || ""} onValueChange={(v) => onUpdate({ textShadow: v })}>
          <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">None</SelectItem>
            <SelectItem value="1px 1px 2px rgba(0,0,0,0.8)">Subtle</SelectItem>
            <SelectItem value="2px 2px 4px rgba(0,0,0,0.9)">Medium</SelectItem>
            <SelectItem value="0 0 10px rgba(255,255,255,0.8)">Glow</SelectItem>
            <SelectItem value="3px 3px 0px rgba(0,0,0,1)">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ImageLayerEditor({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|jpg|gif|webp|svg\+xml)$/)) {
      toast.error("Only image files are allowed"); return;
    }
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from("lower-third-images").upload(fileName, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("lower-third-images").getPublicUrl(fileName);
      onUpdate({ url: urlData.publicUrl });
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally { setUploading(false); e.target.value = ""; }
  };

  const handleRemoveBackground = async () => {
    if (!layer.url) { toast.error("Upload an image first"); return; }
    setRemovingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageUrl: layer.url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        onUpdate({ url: data.url });
        toast.success("Background removed!");
      } else {
        throw new Error("No result returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Background removal failed");
    } finally { setRemovingBg(false); }
  };

  return (
    <>
      <div>
        <Label className="text-xs">Image</Label>
        <div className="flex gap-2 mt-1">
          <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          <Input value={layer.url || ""} onChange={(e) => onUpdate({ url: e.target.value })} placeholder="or paste URL..." className="bg-secondary text-xs flex-1" />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {layer.url && (
        <div className="flex items-end gap-3">
          <div className="w-20 h-20 rounded border border-border overflow-hidden">
            <img src={layer.url} alt="" className="w-full h-full object-contain" />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={removingBg}
            onClick={handleRemoveBackground}
          >
            {removingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eraser className="w-3.5 h-3.5" />}
            {removingBg ? "Removing..." : "Remove Background"}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Fit</Label>
          <Select value={layer.objectFit || "contain"} onValueChange={(v) => onUpdate({ objectFit: v as any })}>
            <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input type="number" min="0" max="100" value={layer.borderRadius || 0} onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
        </div>
      </div>
    </>
  );
}

function ShapeLayerProps({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">Shape</Label>
        <Select value={layer.shape || "rect"} onValueChange={(v) => onUpdate({ shape: v as any })}>
          <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rect">Rectangle</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Color</Label>
        <div className="flex gap-1">
          <input type="color" value={layer.backgroundColor || "#cc0000"} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
          <Input value={layer.backgroundColor || "#cc0000"} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="bg-secondary h-8 text-xs flex-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Opacity</Label>
        <Input type="number" min="0" max="1" step="0.1" value={layer.opacity ?? 0.5} onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
      </div>
      <div>
        <Label className="text-xs">Border Radius</Label>
        <Input type="number" min="0" max="100" value={layer.borderRadius || 0} onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })} className="bg-secondary h-8 text-xs" />
      </div>
    </div>
  );
}

function StickerLayerProps({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  return (
    <>
      <div>
        <Label className="text-xs mb-1 block">Choose Sticker</Label>
        <div className="flex flex-wrap gap-1.5">
          {STICKER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${layer.sticker === emoji ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-secondary hover:bg-secondary/80"}`}
              onClick={() => onUpdate({ sticker: emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Rotation (°)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[layer.stickerRotation || 0]}
              min={-180} max={180} step={5}
              onValueChange={([v]) => onUpdate({ stickerRotation: v })}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{layer.stickerRotation || 0}°</span>
          </div>
        </div>
        <div>
          <Label className="text-xs">Scale</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[layer.stickerScale || 1]}
              min={0.3} max={3} step={0.1}
              onValueChange={([v]) => onUpdate({ stickerScale: v })}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{(layer.stickerScale || 1).toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </>
  );
}

function AnimationEditor({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium">Entrance Animation</Label>
          <Select value={layer.entranceAnimation || "none"} onValueChange={(v) => onUpdate({ entranceAnimation: v as AnimationType })}>
            <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{ANIMATIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium">Exit Animation</Label>
          <Select value={layer.exitAnimation || "none"} onValueChange={(v) => onUpdate({ exitAnimation: v as AnimationType })}>
            <SelectTrigger className="bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{ANIMATIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Duration (sec)</Label>
          <div className="flex items-center gap-2">
            <Slider value={[layer.animationDuration || 0.5]} min={0.1} max={3} step={0.1} onValueChange={([v]) => onUpdate({ animationDuration: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{(layer.animationDuration || 0.5).toFixed(1)}s</span>
          </div>
        </div>
        <div>
          <Label className="text-xs">Delay (sec)</Label>
          <div className="flex items-center gap-2">
            <Slider value={[layer.animationDelay || 0]} min={0} max={5} step={0.1} onValueChange={([v]) => onUpdate({ animationDelay: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{(layer.animationDelay || 0).toFixed(1)}s</span>
          </div>
        </div>
        <div>
          <Label className="text-xs">Speed</Label>
          <div className="flex items-center gap-2">
            <Slider value={[layer.animationSpeed || 1]} min={0.25} max={3} step={0.25} onValueChange={([v]) => onUpdate({ animationSpeed: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{(layer.animationSpeed || 1).toFixed(2)}x</span>
          </div>
        </div>
      </div>
      {/* Speed presets */}
      <div>
        <Label className="text-xs mb-1.5 block">Speed Presets</Label>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "0.25x Slow-mo", value: 0.25 },
            { label: "0.5x Slow", value: 0.5 },
            { label: "1x Normal", value: 1 },
            { label: "1.5x Fast", value: 1.5 },
            { label: "2x Faster", value: 2 },
            { label: "3x Rapid", value: 3 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${(layer.animationSpeed || 1) === preset.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}
              onClick={() => onUpdate({ animationSpeed: preset.value })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {/* Animation preview hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
        <Sparkles className="w-4 h-4 text-accent" />
        Animations play when the overlay appears/disappears during video playback.
      </div>
    </div>
  );
}

function FilterEditor({ layer, onUpdate }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void }) {
  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Filter Presets</Label>
        <div className="flex gap-2 flex-wrap">
          {FILTER_PRESETS.map((fp) => (
            <button
              key={fp.value}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${layer.filterPreset === fp.value ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}
              onClick={() => onUpdate({ filterPreset: fp.value })}
            >
              {fp.label}
            </button>
          ))}
        </div>
      </div>
      {/* Manual sliders */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Or fine-tune manually (overrides preset when changed):</p>
        {[
          { key: "filterBrightness", label: "Brightness", min: 0, max: 200, def: 100 },
          { key: "filterContrast", label: "Contrast", min: 0, max: 200, def: 100 },
          { key: "filterSaturate", label: "Saturation", min: 0, max: 200, def: 100 },
          { key: "filterBlur", label: "Blur (px)", min: 0, max: 20, def: 0 },
          { key: "filterHueRotate", label: "Hue Rotate (°)", min: 0, max: 360, def: 0 },
          { key: "filterGrayscale", label: "Grayscale", min: 0, max: 100, def: 0 },
        ].map((ctrl) => (
          <div key={ctrl.key} className="flex items-center gap-3">
            <Label className="text-xs w-28 shrink-0">{ctrl.label}</Label>
            <Slider
              value={[(layer as any)[ctrl.key] ?? ctrl.def]}
              min={ctrl.min} max={ctrl.max} step={1}
              onValueChange={([v]) => onUpdate({ [ctrl.key]: v, filterPreset: "none" })}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{(layer as any)[ctrl.key] ?? ctrl.def}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEditor({ layer, onUpdate, adDuration }: { layer: LowerThirdLayer; onUpdate: (u: Partial<LowerThirdLayer>) => void; adDuration: number }) {
  const startOffset = layer.layerStartOffset || 0;
  const endOffset = layer.layerEndOffset || 0;
  const effectiveEnd = endOffset > 0 ? endOffset : adDuration;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Control when this layer appears within the ad (0 = ad start, {adDuration}s = ad end).</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start Offset (sec)</Label>
          <div className="flex items-center gap-2">
            <Slider value={[startOffset]} min={0} max={adDuration} step={1} onValueChange={([v]) => onUpdate({ layerStartOffset: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{startOffset}s</span>
          </div>
        </div>
        <div>
          <Label className="text-xs">End Offset (sec, 0=full)</Label>
          <div className="flex items-center gap-2">
            <Slider value={[endOffset]} min={0} max={adDuration} step={1} onValueChange={([v]) => onUpdate({ layerEndOffset: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{endOffset === 0 ? "full" : `${endOffset}s`}</span>
          </div>
        </div>
      </div>
      {/* Visual timeline bar */}
      <div>
        <Label className="text-xs mb-1 block">Visual Timeline</Label>
        <div className="relative h-8 bg-secondary rounded-lg overflow-hidden border border-border">
          <div
            className="absolute top-0 bottom-0 bg-primary/30 border-x border-primary/60 rounded"
            style={{
              left: `${(startOffset / adDuration) * 100}%`,
              width: `${((effectiveEnd - startOffset) / adDuration) * 100}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            {startOffset}s → {endOffset === 0 ? `${adDuration}s` : `${endOffset}s`} ({effectiveEnd - startOffset}s visible)
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== Preview Layer ========== */

function PreviewLayer({ layer, isSelected, onClick }: { layer: LowerThirdLayer; isSelected: boolean; onClick: () => void }) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}%`,
    height: `${layer.height}%`,
    cursor: "pointer",
    outline: isSelected ? "2px solid hsl(var(--primary))" : "none",
    outlineOffset: "1px",
  };

  if (layer.type === "text") {
    return (
      <div onClick={onClick} style={{
        ...baseStyle,
        fontSize: `clamp(6px, ${(layer.fontSize || 16) * 0.5}px, 24px)`,
        fontFamily: layer.fontFamily || "Inter, sans-serif",
        color: layer.color || "#ffffff",
        fontWeight: layer.bold ? "bold" : "normal",
        fontStyle: layer.italic ? "italic" : "normal",
        textAlign: layer.textAlign || "left",
        textShadow: layer.textShadow || undefined,
        display: "flex", alignItems: "center", lineHeight: 1.2,
        overflow: "hidden", whiteSpace: "pre-wrap", padding: "1px 2px",
      }}>
        {layer.content}
      </div>
    );
  }

  if (layer.type === "image") {
    const filterParts: string[] = [];
    if (layer.filterPreset && layer.filterPreset !== "none") {
      const presets: Record<string, string> = { grayscale: "grayscale(100%)", sepia: "sepia(100%)", blur: "blur(2px)", brightness: "brightness(1.4)", contrast: "contrast(1.5)", hueRotate: "hue-rotate(90deg)", saturate: "saturate(2)", invert: "invert(100%)" };
      if (presets[layer.filterPreset]) filterParts.push(presets[layer.filterPreset]);
    }
    return (
      <div onClick={onClick} style={baseStyle} className="overflow-hidden">
        {layer.url ? (
          <img src={layer.url} alt="" className="w-full h-full" style={{
            objectFit: layer.objectFit || "contain",
            borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
            filter: filterParts.join(" ") || undefined,
          }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/10 text-[8px] text-white/40">No image</div>
        )}
      </div>
    );
  }

  if (layer.type === "shape") {
    return (
      <div onClick={onClick} style={{
        ...baseStyle,
        backgroundColor: layer.backgroundColor || "#ffffff",
        opacity: layer.opacity ?? 0.5,
        borderRadius: layer.shape === "circle" ? "50%" : `${layer.borderRadius || 0}px`,
      }} />
    );
  }

  if (layer.type === "marquee") {
    return (
      <div onClick={onClick} style={{ ...baseStyle, overflow: "hidden" }}>
        <div style={{
          fontSize: `clamp(6px, ${(layer.fontSize || 14) * 0.5}px, 20px)`,
          fontFamily: layer.fontFamily || "Inter, sans-serif",
          color: layer.color || "#ffffff",
          fontWeight: layer.bold ? "bold" : "normal",
          whiteSpace: "nowrap", lineHeight: 1, display: "flex", alignItems: "center", height: "100%",
        }}>
          ⟵ {layer.content} ⟶
        </div>
      </div>
    );
  }

  if (layer.type === "sticker") {
    return (
      <div onClick={onClick} style={{
        ...baseStyle,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `${(layer.stickerScale || 1) * 20}px`,
        transform: `rotate(${layer.stickerRotation || 0}deg)`,
      }}>
        {layer.sticker || "⭐"}
      </div>
    );
  }

  return null;
}
