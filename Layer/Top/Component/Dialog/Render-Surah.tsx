// Layer/Top/Component/Dialog/Render-Surah.tsx
// Full-screen Render / Embed overlay.
// - Left: configuration (each group is its own Container)
// - Right: live preview (in a Container)
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
import { Maximize2, Minimize2, Plus, X } from "lucide-react";

// ====================== Types ======================
type Corner = "tl" | "tr" | "bl" | "br";
type RenderFont = "uthmani" | "indopak" | "uthmani_v1" | "uthmani_v2" | "uthmani_v4";

interface Config {
  resolution: "1080p" | "720p" | "vertical";
  reciter: string;
  surahId: number;
  ayahNumber: number | "all";

  bgKind: "color" | "image" | "video";
  bgColor: string;
  bgUrl: string;

  translations: string[];      // each may be "None"
  transliterations: string[];  // each may be "None"

  font: RenderFont;
  arabicSize: number;          // px
  translationSize: number;     // px
  transliterationSize: number; // px

  arabicColor: string;
  translationColor: string;
  transliterationColor: string;
  highlightColor: string;

  logoUrl: string;
  logoCorner: Corner;

  addIntro: boolean;
  introText: string;
  addOutro: boolean;
  outroText: string;
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

  const [cfg, setCfg] = useState<Config>(() => makeDefaults(surahId, ayahNumber));
  const [fullscreen, setFullscreen] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCfg((c) => ({ ...c, surahId, ayahNumber: ayahNumber ?? (mode === "embed" ? 1 : "all") }));
    }
  }, [open, surahId, ayahNumber, mode]);

  // Load Arabic content for the *currently selected font* in the dialog
  // (independent of the global app font).
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
    }).then((d) => {
      if (!cancelled) setSurahData(d);
    });
    return () => { cancelled = true; };
  }, [cfg.surahId, cfg.font, cfg.translations, cfg.transliterations]);

  // For multiple translations/transliterations, additionally fetch extras.
  const [extraTranslations, setExtraTranslations] = useState<Record<string, string[]>>({});
  const [extraTransliterations, setExtraTransliterations] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    const sources = cfg.translations.filter((t) => t !== "None");
    Promise.all(
      sources.map((src) =>
        getSurah(cfg.surahId, { fontType: fontToType(cfg.font), translation: src })
          .then((d) => [src, d.verses.map((v) => v.translation ?? "")] as const)
          .catch(() => [src, [] as string[]] as const)
      )
    ).then((entries) => {
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
    Promise.all(
      sources.map((src) =>
        getSurah(cfg.surahId, { fontType: fontToType(cfg.font), transliteration: src })
          .then((d) => [src, d.verses.map((v) => v.transliteration ?? "")] as const)
          .catch(() => [src, [] as string[]] as const)
      )
    ).then((entries) => {
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

  // Highlight animation
  const totalWords = useMemo(() => verses.reduce((a, v) => a + v.words.length, 0), [verses]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open || totalWords === 0) return;
    setTick(0);
    const i = setInterval(() => setTick((t) => (t + 1) % totalWords), 600);
    return () => clearInterval(i);
  }, [open, totalWords, cfg.surahId, cfg.ayahNumber, cfg.font]);

  const currentVerseIdx = useMemo(() => {
    let count = 0;
    for (let i = 0; i < verses.length; i++) {
      count += verses[i].words.length;
      if (tick < count) return i;
    }
    return 0;
  }, [tick, verses]);

  // File uploads
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

  const res = RESOLUTIONS[cfg.resolution];
  const previewAR = res.w / res.h;

  // Intro/Outro overlay: cycle when enabled
  const introVisible = cfg.addIntro && tick < 2;
  const outroVisible = cfg.addOutro && totalWords > 0 && tick >= totalWords - 2;

  if (!open) return null;

  // ====================== Render ======================
  return (
    <div className="fixed inset-0 z-40 bg-background">
      <ScrollArea className="h-full">
        <div className={cn("p-3 sm:p-4 pt-[72px] mx-auto w-full", fullscreen ? "max-w-none" : "max-w-7xl")}>
          {/* Title bar (no chrome buttons; closed via go-back) */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-base sm:text-lg font-semibold">
              {mode === "embed" ? "Embed Ayah" : "Render Surah"}
            </div>
            <Button size="sm" variant="outline" onClick={() => setFullscreen((v) => !v)} className="gap-1">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {fullscreen ? "Exit Full Screen" : "Full Screen"}
            </Button>
          </div>

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
                  <Row label="Reciter">
                    <Select value={cfg.reciter} onValueChange={(v) => setCfg((c) => ({ ...c, reciter: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECITERS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Row>
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

                {/* Background */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Background</SectionTitle>
                  <Row label="Color">
                    <input
                      type="color"
                      value={cfg.bgColor}
                      onChange={(e) => setCfg((c) => ({ ...c, bgColor: e.target.value, bgKind: "color" }))}
                      className="h-8 w-full rounded"
                    />
                  </Row>
                  <Row label="Image">
                    <Input type="file" accept="image/*" onChange={onFile("bgUrl", "image")} className="text-xs" />
                  </Row>
                  <Row label="Video">
                    <Input type="file" accept="video/*" onChange={onFile("bgUrl", "video")} className="text-xs" />
                  </Row>
                </Container>

                {/* Font (its own Container) */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Font</SectionTitle>
                  <Select value={cfg.font} onValueChange={(v: RenderFont) => setCfg((c) => ({ ...c, font: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONTS.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Container>

                {/* Translations (multi) */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Translations</SectionTitle>
                  <div className="space-y-2">
                    {cfg.translations.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={t}
                          onValueChange={(v) => setCfg((c) => {
                            const next = [...c.translations]; next[idx] = v; return { ...c, translations: next };
                          })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRANSLATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {cfg.translations.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() =>
                            setCfg((c) => ({ ...c, translations: c.translations.filter((_, i) => i !== idx) }))
                          } aria-label="Remove translation">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => setCfg((c) => ({ ...c, translations: [...c.translations, "None"] }))}>
                      <Plus className="h-3 w-3" /> Add Translation
                    </Button>
                  </div>
                </Container>

                {/* Transliterations (multi) */}
                <Container className="!px-4 !py-3">
                  <SectionTitle>Transliterations</SectionTitle>
                  <div className="space-y-2">
                    {cfg.transliterations.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={t}
                          onValueChange={(v) => setCfg((c) => {
                            const next = [...c.transliterations]; next[idx] = v; return { ...c, transliterations: next };
                          })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRANSLITERATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {cfg.transliterations.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() =>
                            setCfg((c) => ({ ...c, transliterations: c.transliterations.filter((_, i) => i !== idx) }))
                          } aria-label="Remove transliteration">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => setCfg((c) => ({ ...c, transliterations: [...c.transliterations, "None"] }))}>
                      <Plus className="h-3 w-3" /> Add Transliteration
                    </Button>
                  </div>
                </Container>

                {/* Sizes (slim container, like Text Layers) */}
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
                  <ColorRow label="Arabic" value={cfg.arabicColor}
                    onChange={(v) => setCfg((c) => ({ ...c, arabicColor: v }))} />
                  <ColorRow label="Translation" value={cfg.translationColor}
                    onChange={(v) => setCfg((c) => ({ ...c, translationColor: v }))} />
                  <ColorRow label="Transliteration" value={cfg.transliterationColor}
                    onChange={(v) => setCfg((c) => ({ ...c, transliterationColor: v }))} />
                  <ColorRow label="Highlight" value={cfg.highlightColor}
                    onChange={(v) => setCfg((c) => ({ ...c, highlightColor: v }))} />
                </Container>

                {/* Intro / Outro */}
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

                {/* Logo */}
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

                <Button className="w-full" onClick={() =>
                  alert(mode === "embed" ? "Embed snippet copied (prototype)" : "Render queued (prototype)")
                }>
                  {mode === "embed" ? "Copy Embed" : "Render Video"}
                </Button>
              </div>
            )}

            {/* ============ RIGHT: Preview ============ */}
            <Container className="!p-3">
              <div
                ref={previewWrapRef}
                className="relative w-full mx-auto rounded-lg overflow-hidden shadow-xl"
                style={{
                  aspectRatio: previewAR,
                  maxWidth: previewAR >= 1 ? "100%" : "min(70vh, 100%)",
                }}
              >
                {/* Background */}
                {cfg.bgKind === "video" && cfg.bgUrl ? (
                  <video src={cfg.bgUrl} autoPlay muted loop className="absolute inset-0 w-full h-full object-cover" />
                ) : cfg.bgKind === "image" && cfg.bgUrl ? (
                  <img src={cfg.bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: cfg.bgColor }} />
                )}
                <div className="absolute inset-0 bg-black/30" />

                {/* Our logo */}
                <div className={cn("absolute text-white/90 text-xs font-medium px-2 py-1 rounded bg-black/30", cornerCls[ourLogoCorner])}>
                  Al-Deen.org
                </div>
                {/* User logo */}
                {cfg.logoUrl && (
                  <img src={cfg.logoUrl} alt="logo"
                    className={cn("absolute h-10 w-auto object-contain", cornerCls[cfg.logoCorner])} />
                )}

                {/* Intro */}
                {introVisible && (
                  <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                    <div className="text-white text-2xl sm:text-4xl font-semibold animate-in fade-in duration-500">
                      {cfg.introText}
                    </div>
                  </div>
                )}

                {/* Outro */}
                {outroVisible && (
                  <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                    <div className="text-white text-2xl sm:text-4xl font-semibold animate-in fade-in duration-500">
                      {cfg.outroText}
                    </div>
                  </div>
                )}

                {/* Content */}
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
                      <div
                        dir="rtl"
                        className={cn("leading-relaxed px-3 py-1 rounded", fontClass(cfg.font))}
                        style={{ color: cfg.arabicColor, fontSize: cfg.arabicSize }}
                      >
                        {v.words.map((w, i) => (
                          <span key={i} style={i === currentWordIdx ? { color: cfg.highlightColor } : undefined}>
                            {w}{cfg.font === "uthmani_v1" ? "" : " "}
                          </span>
                        ))}
                      </div>

                      {activeTransliterations.map((src) => (
                        <div key={src} className="italic" style={{ color: cfg.transliterationColor, fontSize: cfg.transliterationSize }}>
                          {extraTransliterations[src]?.[v.verseNumber - 1] ?? ""}
                        </div>
                      ))}

                      {activeTranslations.map((src) => (
                        <div key={src} className="max-w-prose animate-in fade-in duration-500"
                          style={{ color: cfg.translationColor, fontSize: cfg.translationSize }}>
                          {extraTranslations[src]?.[v.verseNumber - 1] ?? ""}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </Container>
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

function makeDefaults(surahId: number, ayahNumber?: number): Config {
  return {
    resolution: "1080p",
    reciter: RECITERS[0],
    surahId,
    ayahNumber: ayahNumber ?? "all",
    bgKind: "color",
    bgColor: "#0b1f17",
    bgUrl: "",
    translations: ["Direct"],
    transliterations: ["None"],
    font: "uthmani",
    arabicSize: 40,
    translationSize: 18,
    transliterationSize: 16,
    arabicColor: "#ffffff",
    translationColor: "#d8d8d8",
    transliterationColor: "#cfcfcf",
    highlightColor: "#34d399",
    logoUrl: "",
    logoCorner: "tr",
    addIntro: false,
    introText: "Bismillah",
    addOutro: false,
    outroText: "Subscribe & Share",
  };
}
