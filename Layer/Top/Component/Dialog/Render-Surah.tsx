// Layer/Top/Component/Dialog/Render-Surah.tsx
// Full-screen Render / Embed overlay.
// - Render mode: configures a video render (left config, right live preview).
// - Embed mode: configures an <iframe> embed snippet for external websites.
// - Closed by go-back button (registered via useBackHandler), like Tafsir/Surah-Info.

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/Top/Component/UI/Button";
import { Input } from "@/Top/Component/UI/Input";
import { Label } from "@/Top/Component/UI/Label";
import { Container } from "@/Top/Component/UI/Container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Top/Component/UI/Select";
import { Switch } from "@/Top/Component/UI/Switch";
import { ScrollArea } from "@/Top/Component/UI/Scroll-Area";
import { Slider } from "@/Top/Component/UI/Slider";
import {
  surahList,
  getSurah,
  type AssembledSurah,
  type AssembledVerse,
  type QuranFontType,
} from "@/Bottom/API/Quran";
import { useBackHandler } from "@/Middle/Hook/Use-Back-Handler";
import { cn } from "@/Middle/Library/utils";
import { Maximize2, Minimize2, Plus, X, Copy } from "lucide-react";

// ====================== Types ======================
type Corner = "tl" | "tr" | "bl" | "br";
type RenderFont = "uthmani" | "indopak" | "uthmani_v1" | "uthmani_v2" | "uthmani_v4";

interface Config {
  // Render: 1080p/720p/vertical. Embed: custom W/H.
  resolution: "1080p" | "720p" | "vertical";
  width: number;
  height: number;

  reciter: string;
  surahId: number;
  ayahNumber: number | "all";

  bgKind: "color" | "image" | "video";
  bgColor: string;
  bgUrl: string;

  translations: string[];
  transliterations: string[];
  showWBW: boolean;

  font: RenderFont;
  arabicSize: number;
  translationSize: number;
  transliterationSize: number;

  arabicColor: string;
  translationColor: string;
  transliterationColor: string;
  highlightColor: string;
  autoContrast: boolean;

  logoUrl: string;
  logoCorner: Corner;

  addIntro: boolean;
  introText: string;
  addOutro: boolean;
  outroText: string;

  // Embed-only
  audioPlayback: boolean;
  showTafsir: boolean;
  showCopy: boolean;
  showShare: boolean;
}

const RECITERS = ["Mishary Rashid Alafasy", "Sa'd al-Ghamdi", "Maher al-Muaiqly"];

const FONTS: { id: RenderFont; label: string }[] = [
  { id: "uthmani", label: "Uthmani (Hafs)" },
  { id: "indopak", label: "IndoPak" },
  { id: "uthmani_v1", label: "King Fahad Complex V1" },
  { id: "uthmani_v2", label: "King Fahad Complex V2" },
  { id: "uthmani_v4", label: "King Fahad Complex V4" },
];

const TRANSLATIONS = ["None", "Direct", "Saheeh-International"];
const TRANSLITERATIONS = ["None", "Standard"];

const RESOLUTIONS: Record<Config["resolution"], { w: number; h: number; label: string }> = {
  "1080p": { w: 1920, h: 1080, label: "1080p (16:9)" },
  "720p": { w: 1280, h: 720, label: "720p (16:9)" },
  vertical: { w: 1080, h: 1920, label: "Vertical (9:16)" },
};

function fontToType(f: RenderFont): QuranFontType {
  if (f === "uthmani_v1") return "V1";
  if (f === "uthmani_v2" || f === "uthmani_v4") return "V2";
  return "Standard";
}

function fontClass(f: RenderFont): string {
  switch (f) {
    case "indopak":    return "font-indopak";
    case "uthmani_v1": return "font-uthmani_v1";
    case "uthmani_v2": return "font-uthmani_v2";
    case "uthmani_v4": return "font-uthmani_v4";
    default:           return "font-uthmani";
  }
}

// ---- Color helpers (auto contrast) ----
function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (x: number) => x.toString(16).padStart(2, "0");
  return `#${h(Math.round(r))}${h(Math.round(g))}${h(Math.round(b))}`;
}
function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a: string, b: string): number {
  const L1 = relLuminance(hexToRgb(a));
  const L2 = relLuminance(hexToRgb(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
/** If color blends with bg, shift it toward white or black until readable. */
function ensureReadable(color: string, bg: string, minRatio = 3.5): string {
  try {
    if (contrastRatio(color, bg) >= minRatio) return color;
    const bgLum = relLuminance(hexToRgb(bg));
    const target: [number, number, number] = bgLum > 0.5 ? [0, 0, 0] : [255, 255, 255];
    let [r, g, b] = hexToRgb(color);
    for (let t = 0.1; t <= 1; t += 0.1) {
      const nr = r + (target[0] - r) * t;
      const ng = g + (target[1] - g) * t;
      const nb = b + (target[2] - b) * t;
      const cand = rgbToHex(nr, ng, nb);
      if (contrastRatio(cand, bg) >= minRatio) return cand;
    }
    return rgbToHex(target[0], target[1], target[2]);
  } catch {
    return color;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  surahId: number;
  ayahNumber?: number;
  mode?: "render" | "embed";
}

// ====================== Component ======================
export function RenderSurahDialog({
  open,
  onOpenChange,
  surahId,
  ayahNumber,
  mode = "render",
}: Props) {
  useBackHandler(open, () => onOpenChange(false));

  const [cfg, setCfg] = useState<Config>(() => makeDefaults(surahId, ayahNumber, mode));
  const [fullscreen, setFullscreen] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCfg((c) => ({ ...c, surahId, ayahNumber: ayahNumber ?? (mode === "embed" ? 1 : "all") }));
    }
  }, [open, surahId, ayahNumber, mode]);

  // Load Arabic content for the *currently selected font*.
  const [surahData, setSurahData] = useState<AssembledSurah | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSurahData(null);
    const primaryTr = cfg.translations.find((t) => t !== "None");
    const primaryTl = cfg.transliterations.find((t) => t !== "None");
    getSurah(cfg.surahId, {
      fontType: fontToType(cfg.font),
      translation: primaryTr,
      transliteration: primaryTl,
    }).then((d) => { if (!cancelled) setSurahData(d); });
    return () => { cancelled = true; };
  }, [cfg.surahId, cfg.font, cfg.translations, cfg.transliterations]);

  const [extraTranslations, setExtraTranslations] = useState<Record<string, string[]>>({});
  const [extraTransliterations, setExtraTransliterations] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    const sources = cfg.translations.filter((t) => t !== "None");
    Promise.all(sources.map((src) =>
      getSurah(cfg.surahId, { fontType: fontToType(cfg.font), translation: src })
        .then((d) => [src, d.verses.map((v) => v.translation ?? "")] as const)
        .catch(() => [src, [] as string[]] as const)
    )).then((entries) => {
      if (cancelled) return;
      const m: Record<string, string[]> = {};
      entries.forEach(([k, v]) => (m[k] = v));
      setExtraTranslations(m);
    });
    return () => { cancelled = true; };
  }, [cfg.translations, cfg.surahId, cfg.font]);
  useEffect(() => {
    let cancelled = false;
    const sources = cfg.transliterations.filter((t) => t !== "None");
    Promise.all(sources.map((src) =>
      getSurah(cfg.surahId, { fontType: fontToType(cfg.font), transliteration: src })
        .then((d) => [src, d.verses.map((v) => v.transliteration ?? "")] as const)
        .catch(() => [src, [] as string[]] as const)
    )).then((entries) => {
      if (cancelled) return;
      const m: Record<string, string[]> = {};
      entries.forEach(([k, v]) => (m[k] = v));
      setExtraTransliterations(m);
    });
    return () => { cancelled = true; };
  }, [cfg.transliterations, cfg.surahId, cfg.font]);

  const allVerses: AssembledVerse[] = surahData?.verses ?? [];
  const verses = useMemo(
    () => (cfg.ayahNumber === "all" ? allVerses : allVerses.filter((v) => v.verseNumber === cfg.ayahNumber)),
    [allVerses, cfg.ayahNumber]
  );

  // Auto-contrast resolved colors
  const arabicCol         = cfg.autoContrast ? ensureReadable(cfg.arabicColor, cfg.bgColor)         : cfg.arabicColor;
  const translationCol    = cfg.autoContrast ? ensureReadable(cfg.translationColor, cfg.bgColor)    : cfg.translationColor;
  const transliterationCol= cfg.autoContrast ? ensureReadable(cfg.transliterationColor, cfg.bgColor): cfg.transliterationColor;
  const highlightCol      = cfg.autoContrast ? ensureReadable(cfg.highlightColor, cfg.bgColor)      : cfg.highlightColor;

  // Render-mode: highlight cycling
  const totalWords = useMemo(() => verses.reduce((a, v) => a + v.words.length, 0), [verses]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open || totalWords === 0 || mode !== "render") return;
    setTick(0);
    const i = setInterval(() => setTick((t) => (t + 1) % totalWords), 600);
    return () => clearInterval(i);
  }, [open, totalWords, cfg.surahId, cfg.ayahNumber, cfg.font, mode]);

  const currentVerseIdx = useMemo(() => {
    let count = 0;
    for (let i = 0; i < verses.length; i++) {
      count += verses[i].words.length;
      if (tick < count) return i;
    }
    return 0;
  }, [tick, verses]);

  const onFile = (field: "bgUrl" | "logoUrl", kindField?: "image" | "video") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      setCfg((c) => ({
        ...c,
        [field]: url,
        ...(kindField && field === "bgUrl" ? { bgKind: kindField } : {}),
      }));
    };

  const cornerCls: Record<Corner, string> = {
    tl: "top-3 left-3",
    tr: "top-3 right-3",
    bl: "bottom-3 left-3",
    br: "bottom-3 right-3",
  };
  const ourLogoCorner: Corner = cfg.logoUrl && cfg.logoCorner === "tr" ? "tl" : "tr";

  const previewSize = useMemo(() => {
    if (mode === "embed") return { w: cfg.width, h: cfg.height };
    const r = RESOLUTIONS[cfg.resolution];
    return { w: r.w, h: r.h };
  }, [mode, cfg.resolution, cfg.width, cfg.height]);
  const previewAR = previewSize.w / previewSize.h;

  const introVisible = cfg.addIntro && tick < 2;
  const outroVisible = cfg.addOutro && totalWords > 0 && tick >= totalWords - 2;

  // ---- Embed snippet ----
  const embedSnippet = useMemo(() => {
    const params = new URLSearchParams();
    params.set("surah", String(cfg.surahId));
    if (cfg.ayahNumber !== "all") params.set("ayah", String(cfg.ayahNumber));
    params.set("font", cfg.font);
    const trs = cfg.translations.filter((t) => t !== "None");
    const tls = cfg.transliterations.filter((t) => t !== "None");
    if (trs.length) params.set("translation", trs.join(","));
    if (tls.length) params.set("transliteration", tls.join(","));
    if (cfg.showWBW) params.set("wbw", "1");
    if (cfg.audioPlayback) params.set("audio", "1");
    if (cfg.showTafsir) params.set("tafsir", "1");
    if (cfg.showCopy) params.set("copy", "1");
    if (cfg.showShare) params.set("share", "1");
    const url = `https://al-deen.org/embed?${params.toString()}`;
    return `<iframe src="${url}" width="${cfg.width}" height="${cfg.height}" style="border:0;border-radius:12px" allow="autoplay" loading="lazy"></iframe>`;
  }, [cfg]);

  if (!open) return null;

  // ====================== Render ======================
  return (
    <div className="fixed inset-0 z-40 bg-background">
      <ScrollArea className="h-full">
        <div className={cn("p-3 sm:p-4 pt-[72px] mx-auto w-full", fullscreen ? "max-w-none" : "max-w-7xl")}>
          <div className={cn(
            "grid gap-3",
            fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[360px_1fr]"
          )}>
            {/* ============ LEFT: Configuration ============ */}
            {!fullscreen && (
              <div className="space-y-3">
                {/* Output */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Output</SectionTitle>
                  {mode === "render" ? (
                    <Row label="Resolution">
                      <Select value={cfg.resolution} onValueChange={(v: Config["resolution"]) => setCfg((c) => ({ ...c, resolution: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(RESOLUTIONS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Row>
                  ) : (
                    <>
                      <Row label="Width">
                        <Input type="number" value={cfg.width}
                          onChange={(e) => setCfg((c) => ({ ...c, width: Math.max(120, parseInt(e.target.value || "0") || 0) }))} />
                      </Row>
                      <Row label="Height">
                        <Input type="number" value={cfg.height}
                          onChange={(e) => setCfg((c) => ({ ...c, height: Math.max(120, parseInt(e.target.value || "0") || 0) }))} />
                      </Row>
                    </>
                  )}
                  {mode === "render" && (
                    <Row label="Reciter">
                      <Select value={cfg.reciter} onValueChange={(v) => setCfg((c) => ({ ...c, reciter: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RECITERS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Row>
                  )}
                  <Row label="Surah">
                    <Select value={String(cfg.surahId)} onValueChange={(v) => setCfg((c) => ({ ...c, surahId: parseInt(v), ayahNumber: "all" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {surahList.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.id}. {s.englishName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Ayah">
                    <Select
                      value={String(cfg.ayahNumber)}
                      onValueChange={(v) => setCfg((c) => ({ ...c, ayahNumber: v === "all" ? "all" : parseInt(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {mode === "render" && <SelectItem value="all">All</SelectItem>}
                        {allVerses.map((v) => (
                          <SelectItem key={v.verseNumber} value={String(v.verseNumber)}>{v.verseNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                </Container>

                {/* Background (render only) */}
                {mode === "render" && (
                  <Container className="!px-4 !py-3">
                    <SectionTitle>Background</SectionTitle>
                    <Row label="Color">
                      <input type="color" value={cfg.bgColor}
                        onChange={(e) => setCfg((c) => ({ ...c, bgColor: e.target.value, bgKind: "color" }))}
                        className="h-8 w-full rounded" />
                    </Row>
                    <Row label="Image">
                      <Input type="file" accept="image/*" onChange={onFile("bgUrl", "image")} className="text-xs" />
                    </Row>
                    <Row label="Video">
                      <Input type="file" accept="video/*" onChange={onFile("bgUrl", "video")} className="text-xs" />
                    </Row>
                  </Container>
                )}

                {/* Font */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Font</SectionTitle>
                  <Select value={cfg.font} onValueChange={(v: RenderFont) => setCfg((c) => ({ ...c, font: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONTS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Container>

                {/* WBW (both modes) */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Word-by-Word</SectionTitle>
                  <ToggleRow label="Show WBW" value={cfg.showWBW}
                    onChange={(v) => setCfg((c) => ({ ...c, showWBW: v }))} />
                </Container>

                {/* Translations */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Translations</SectionTitle>
                  <div className="space-y-2">
                    {cfg.translations.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select value={t} onValueChange={(v) => setCfg((c) => {
                          const next = [...c.translations]; next[idx] = v; return { ...c, translations: next };
                        })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRANSLATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {cfg.translations.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() =>
                            setCfg((c) => ({ ...c, translations: c.translations.filter((_, i) => i !== idx) }))
                          } aria-label="Remove translation"><X className="h-4 w-4" /></Button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => setCfg((c) => ({ ...c, translations: [...c.translations, "None"] }))}>
                      <Plus className="h-3 w-3" /> Add Translation
                    </Button>
                  </div>
                </Container>

                {/* Transliterations */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Transliterations</SectionTitle>
                  <div className="space-y-2">
                    {cfg.transliterations.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select value={t} onValueChange={(v) => setCfg((c) => {
                          const next = [...c.transliterations]; next[idx] = v; return { ...c, transliterations: next };
                        })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRANSLITERATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {cfg.transliterations.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() =>
                            setCfg((c) => ({ ...c, transliterations: c.transliterations.filter((_, i) => i !== idx) }))
                          } aria-label="Remove transliteration"><X className="h-4 w-4" /></Button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => setCfg((c) => ({ ...c, transliterations: [...c.transliterations, "None"] }))}>
                      <Plus className="h-3 w-3" /> Add Transliteration
                    </Button>
                  </div>
                </Container>

                {/* Sizes */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Sizes</SectionTitle>
                  <SliderRow label="Arabic" value={cfg.arabicSize} min={16} max={96}
                    onChange={(v) => setCfg((c) => ({ ...c, arabicSize: v }))} />
                  <SliderRow label="Translation" value={cfg.translationSize} min={10} max={48}
                    onChange={(v) => setCfg((c) => ({ ...c, translationSize: v }))} />
                  <SliderRow label="Transliteration" value={cfg.transliterationSize} min={10} max={48}
                    onChange={(v) => setCfg((c) => ({ ...c, transliterationSize: v }))} />
                </Container>

                {/* Colors */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Colors</SectionTitle>
                  <ToggleRow label="Auto contrast" value={cfg.autoContrast}
                    onChange={(v) => setCfg((c) => ({ ...c, autoContrast: v }))} />
                  <ColorRow label="Arabic" value={cfg.arabicColor}
                    onChange={(v) => setCfg((c) => ({ ...c, arabicColor: v }))} />
                  <ColorRow label="Translation" value={cfg.translationColor}
                    onChange={(v) => setCfg((c) => ({ ...c, translationColor: v }))} />
                  <ColorRow label="Transliteration" value={cfg.transliterationColor}
                    onChange={(v) => setCfg((c) => ({ ...c, transliterationColor: v }))} />
                  <ColorRow label="Highlight" value={cfg.highlightColor}
                    onChange={(v) => setCfg((c) => ({ ...c, highlightColor: v }))} />
                </Container>

                {/* Render-only: Intro/Outro + Logo */}
                {mode === "render" && (
                  <>
                    <Container className="!px-4 !py-3">
                      <SectionTitle>Intro / Outro</SectionTitle>
                      <ToggleRow label="Add Intro" value={cfg.addIntro}
                        onChange={(v) => setCfg((c) => ({ ...c, addIntro: v }))} />
                      {cfg.addIntro && (
                        <Input value={cfg.introText} onChange={(e) => setCfg((c) => ({ ...c, introText: e.target.value }))}
                          placeholder="Intro text" className="text-xs mt-1" />
                      )}
                      <ToggleRow label="Add Outro" value={cfg.addOutro}
                        onChange={(v) => setCfg((c) => ({ ...c, addOutro: v }))} />
                      {cfg.addOutro && (
                        <Input value={cfg.outroText} onChange={(e) => setCfg((c) => ({ ...c, outroText: e.target.value }))}
                          placeholder="Outro text" className="text-xs mt-1" />
                      )}
                    </Container>

                    <Container className="!px-4 !py-3">
                      <SectionTitle>Logo</SectionTitle>
                      <Row label="Upload">
                        <Input type="file" accept="image/*" onChange={onFile("logoUrl")} className="text-xs" />
                      </Row>
                      <Row label="Corner">
                        <Select value={cfg.logoCorner} onValueChange={(v: Corner) => setCfg((c) => ({ ...c, logoCorner: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tl">Top Left</SelectItem>
                            <SelectItem value="tr">Top Right</SelectItem>
                            <SelectItem value="bl">Bottom Left</SelectItem>
                            <SelectItem value="br">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </Row>
                    </Container>
                  </>
                )}

                {/* Embed-only options */}
                {mode === "embed" && (
                  <Container className="!px-4 !py-3">
                    <SectionTitle>Embed Options</SectionTitle>
                    <ToggleRow label="Audio Playback" value={cfg.audioPlayback}
                      onChange={(v) => setCfg((c) => ({ ...c, audioPlayback: v }))} />
                    <ToggleRow label="Show Tafsir Button" value={cfg.showTafsir}
                      onChange={(v) => setCfg((c) => ({ ...c, showTafsir: v }))} />
                    <ToggleRow label="Show Copy Button" value={cfg.showCopy}
                      onChange={(v) => setCfg((c) => ({ ...c, showCopy: v }))} />
                    <ToggleRow label="Show Share Button" value={cfg.showShare}
                      onChange={(v) => setCfg((c) => ({ ...c, showShare: v }))} />
                  </Container>
                )}

                <Button className="w-full" onClick={() => {
                  if (mode === "embed") {
                    navigator.clipboard?.writeText(embedSnippet);
                    alert("Embed snippet copied to clipboard");
                  } else {
                    alert("Render queued (prototype)");
                  }
                }}>
                  {mode === "embed" ? "Copy Embed" : "Render Video"}
                </Button>
              </div>
            )}

            {/* ============ RIGHT: Preview ============ */}
            <div className="space-y-3">
              <Container className="!p-3">
                <div
                  ref={previewWrapRef}
                  className="relative w-full mx-auto rounded-lg overflow-hidden shadow-xl"
                  style={{
                    aspectRatio: previewAR,
                    maxWidth: previewAR >= 1 ? "100%" : "min(70vh, 100%)",
                  }}
                >
                  {mode === "embed" ? (
                    <iframe
                      title="Embed preview"
                      srcDoc={buildEmbedPreviewDoc(cfg, verses, { arabicCol, translationCol, transliterationCol, highlightCol })}
                      className="absolute inset-0 w-full h-full bg-white"
                    />
                  ) : (
                    <>
                      {/* Background */}
                      {cfg.bgKind === "video" && cfg.bgUrl ? (
                        <video src={cfg.bgUrl} autoPlay muted loop className="absolute inset-0 w-full h-full object-cover" />
                      ) : cfg.bgKind === "image" && cfg.bgUrl ? (
                        <img src={cfg.bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: cfg.bgColor }} />
                      )}
                      <div className="absolute inset-0 bg-black/30" />

                      <div className={cn("absolute text-white/90 text-xs font-medium px-2 py-1 rounded bg-black/30", cornerCls[ourLogoCorner])}>
                        Al-Deen.org
                      </div>
                      {cfg.logoUrl && (
                        <img src={cfg.logoUrl} alt="logo"
                          className={cn("absolute h-10 w-auto object-contain", cornerCls[cfg.logoCorner])} />
                      )}

                      {introVisible && (
                        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                          <div className="text-white text-2xl sm:text-4xl font-semibold animate-in fade-in duration-500">
                            {cfg.introText}
                          </div>
                        </div>
                      )}
                      {outroVisible && (
                        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                          <div className="text-white text-2xl sm:text-4xl font-semibold animate-in fade-in duration-500">
                            {cfg.outroText}
                          </div>
                        </div>
                      )}

                      {!introVisible && !outroVisible && (() => {
                        const v = verses[currentVerseIdx];
                        if (!v) return null;
                        let before = 0;
                        for (let i = 0; i < currentVerseIdx; i++) before += verses[i].words.length;
                        const currentWordIdx = tick - before;
                        const activeTranslations = cfg.translations.filter((t) => t !== "None");
                        const activeTransliterations = cfg.transliterations.filter((t) => t !== "None");

                        return (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
                            <div dir="rtl"
                              className={cn("leading-relaxed px-3 py-1 rounded", fontClass(cfg.font))}
                              style={{ color: arabicCol, fontSize: cfg.arabicSize }}>
                              {v.words.map((w, i) => (
                                <span key={i} style={i === currentWordIdx ? { color: highlightCol } : undefined}>
                                  {w}{cfg.font === "uthmani_v1" ? "" : " "}
                                </span>
                              ))}
                            </div>

                            {cfg.showWBW && (
                              <div dir="rtl" className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs opacity-90"
                                style={{ color: transliterationCol }}>
                                {v.words.map((w, i) => <span key={i}>{w}</span>)}
                              </div>
                            )}

                            {activeTransliterations.map((src) => (
                              <div key={src} className="italic" style={{ color: transliterationCol, fontSize: cfg.transliterationSize }}>
                                {extraTransliterations[src]?.[v.verseNumber - 1] ?? ""}
                              </div>
                            ))}

                            {activeTranslations.map((src) => (
                              <div key={src} className="max-w-prose animate-in fade-in duration-500"
                                style={{ color: translationCol, fontSize: cfg.translationSize }}>
                                {extraTranslations[src]?.[v.verseNumber - 1] ?? ""}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Full-screen button (render only) — bottom right inside preview */}
                  {mode === "render" && (
                    <button
                      type="button"
                      onClick={() => setFullscreen((v) => !v)}
                      className="absolute bottom-3 right-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                      aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                    >
                      {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </Container>

              {/* Embed snippet */}
              {mode === "embed" && (
                <Container className="!px-4 !py-3">
                  <div className="flex items-center justify-between mb-2">
                    <SectionTitle>Embed Snippet</SectionTitle>
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => { navigator.clipboard?.writeText(embedSnippet); }}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
{embedSnippet}
                  </pre>
                </Container>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ====================== Sub-bits ======================
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 mb-2">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 mb-2">
      <Label className="text-xs">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded" />
    </div>
  );
}
function SliderRow({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}px</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function buildEmbedPreviewDoc(
  cfg: Config,
  verses: AssembledVerse[],
  cols: { arabicCol: string; translationCol: string; transliterationCol: string; highlightCol: string }
): string {
  const v = verses[0];
  const arabic = v ? v.words.join(cfg.font === "uthmani_v1" ? "" : " ") : "";
  const tr = v?.translation ?? "";
  const tl = v?.transliteration ?? "";
  const btn = (label: string) =>
    `<button style="border:1px solid #ddd;background:#fff;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer">${label}</button>`;
  const buttons = [
    cfg.audioPlayback ? btn("▶ Play") : "",
    cfg.showTafsir    ? btn("Tafsir") : "",
    cfg.showCopy      ? btn("Copy")   : "",
    cfg.showShare     ? btn("Share")  : "",
  ].filter(Boolean).join("");

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#fff;color:#111;padding:16px;box-sizing:border-box;height:100vh;display:flex;flex-direction:column;gap:10px}
  .ar{direction:rtl;text-align:center;line-height:1.8}
  .meta{text-align:center;font-size:12px;color:#666}
  .actions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:auto}
  .wbw{direction:rtl;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;font-size:12px;color:#555}
</style></head><body>
  <div class="meta">Surah ${cfg.surahId} · Ayah ${cfg.ayahNumber === "all" ? "1" : cfg.ayahNumber}</div>
  <div class="ar" style="color:${cols.arabicCol};font-size:${cfg.arabicSize}px">${arabic}</div>
  ${cfg.showWBW && v ? `<div class="wbw">${v.words.map((w) => `<span>${w}</span>`).join("")}</div>` : ""}
  ${tl ? `<div style="text-align:center;font-style:italic;color:${cols.transliterationCol};font-size:${cfg.transliterationSize}px">${tl}</div>` : ""}
  ${tr ? `<div style="text-align:center;color:${cols.translationCol};font-size:${cfg.translationSize}px">${tr}</div>` : ""}
  <div class="actions">${buttons}</div>
</body></html>`;
}

function makeDefaults(surahId: number, ayahNumber: number | undefined, mode: "render" | "embed"): Config {
  return {
    resolution: "1080p",
    width: 600,
    height: 400,
    reciter: RECITERS[0],
    surahId,
    ayahNumber: ayahNumber ?? (mode === "embed" ? 1 : "all"),
    bgKind: "color",
    bgColor: "#0b1f17",
    bgUrl: "",
    translations: ["Direct"],
    transliterations: ["None"],
    showWBW: false,
    font: "uthmani",
    arabicSize: 40,
    translationSize: 18,
    transliterationSize: 16,
    arabicColor: "#ffffff",
    translationColor: "#d8d8d8",
    transliterationColor: "#cfcfcf",
    highlightColor: "#34d399",
    autoContrast: true,
    logoUrl: "",
    logoCorner: "tr",
    addIntro: false,
    introText: "Bismillah",
    addOutro: false,
    outroText: "Subscribe & Share",
    audioPlayback: true,
    showTafsir: true,
    showCopy: true,
    showShare: false,
  };
}
