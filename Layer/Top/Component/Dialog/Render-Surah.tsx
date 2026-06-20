// Layer/Top/Component/Dialog/Render-Surah.tsx
// Full-screen Render / Embed overlay.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/Top/Component/UI/Button";
import { Input } from "@/Top/Component/UI/Input";
import { Label } from "@/Top/Component/UI/Label";
// Container removed — sidebar uses local Box component below.
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Top/Component/UI/Select";
import { Switch } from "@/Top/Component/UI/Switch";
import { ScrollArea } from "@/Top/Component/UI/Scroll-Area";
import { Slider } from "@/Top/Component/UI/Slider";
import {
  surahList,
  getSurah,
  getPageSegments,
  type AssembledSurah,
  type AssembledVerse,
  type QuranFontType,
} from "@/Bottom/API/Quran";
import { useBackHandler } from "@/Middle/Hook/Use-Back-Handler";
import { cn } from "@/Middle/Library/utils";
import { Maximize2, Minimize2, Plus, X, Copy, Download, Loader2 } from "lucide-react";
import { toast } from "@/Middle/Hook/Use-Toast";
import { useApp } from "@/Middle/Context/App";
import {
  renderToVideo,
  buildTimeline,
  detectTier,
  type RenderScene,
  type RenderVerse,
} from "@/Middle/Render/Engine/Index";

// ====================== Types ======================
type Corner = "tl" | "tr" | "bl" | "br";
type RenderFont = "uthmani" | "indopak" | "uthmani_v1" | "uthmani_v2" | "uthmani_v4";
type Position =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const POSITIONS: { id: Position; label: string }[] = [
  { id: "top-left",      label: "Top Left" },
  { id: "top-center",    label: "Top Center" },
  { id: "top-right",     label: "Top Right" },
  { id: "center-left",   label: "Center Left" },
  { id: "center",        label: "Center" },
  { id: "center-right",  label: "Center Right" },
  { id: "bottom-left",   label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right",  label: "Bottom Right" },
];

function posClasses(p: Position): string {
  const v = p.startsWith("top-") ? "items-start" : p.startsWith("bottom-") ? "items-end" : "items-center";
  const h = p.endsWith("-left") ? "justify-start text-left"
        : p.endsWith("-right") ? "justify-end text-right"
        : "justify-center text-center";
  return `${v} ${h}`;
}

interface Config {
  resolution: "1080p" | "720p" | "vertical";
  width: number;
  height: number;
  exportFormat: "webm" | "mp4";

  reciter: string;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;

  bgKind: "color" | "image" | "video";
  bgColor: string;
  bgUrl: string;

  // Container (the inner card around the content)
  containerBgKind: "color" | "image";
  containerBg: string;
  containerBgUrl: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;

  arabicColor: string;
  translationColor: string;
  transliterationColor: string;
  highlightColor: string;
  autoContrast: boolean;

  // Positioning
  arabicPosition: Position;
  translationPosition: Position;
  transliterationPosition: Position;

  // Overlays
  showLines: boolean;
  linesCount: number;
  showWatermark: boolean;
  watermarkText: string;

  logoUrl: string;
  logoCorner: Corner;

  addIntro: boolean;
  introUrl: string;
  addOutro: boolean;
  outroUrl: string;

  // Embed-only
  audioPlayback: boolean;
  showTafsir: boolean;
  showCopy: boolean;
  showShare: boolean;
  hoverTooltip: boolean;
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
/** Return per-page font family name (e.g. "Uthmani-V2-3") for KFC variants. */
function pageFontFamily(font: RenderFont, surahId: number, verseNumber: number): string | undefined {
  if (font === "uthmani_v1" || font === "uthmani_v2" || font === "uthmani_v4") {
    const version = font === "uthmani_v1" ? "1" : font === "uthmani_v2" ? "2" : "4";
    // Walk pages until we find this verse's segment.
    for (let pageNum = 1; pageNum <= 604; pageNum++) {
      const segs = getPageSegments(pageNum);
      if (!segs) continue;
      const s = segs.find((x) => x.surah === surahId);
      if (s && verseNumber >= s.startVerse && verseNumber <= s.endVerse) {
        return `Uthmani-V${version}-${pageNum}`;
      }
    }
    return `Uthmani-V${version}`;
  }
  if (font === "indopak") return "IndoPak";
  return "Uthmani";
}

// ---- Color helpers ----
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
  open, onOpenChange, surahId, ayahNumber, mode = "render",
}: Props) {
  useBackHandler(open, () => onOpenChange(false));

  const app = useApp();
  const [cfg, setCfg] = useState<Config>(() => makeDefaults(surahId, ayahNumber, mode));
  const [fullscreen, setFullscreen] = useState(false);
  const [rendering, setRendering] = useState(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  // Derived from user Settings — not exposed in this dialog.
  const ecfg = useMemo(() => {
    const trs = (app.selectedTranslations && app.selectedTranslations.length > 0)
      ? app.selectedTranslations.map((t) => t === "translation" ? "Direct" : t)
      : ["None"];
    const tls = app.selectedAyahTransliterator && app.selectedAyahTransliterator !== "None"
      ? [app.selectedAyahTransliterator] : ["None"];
    return {
      ...cfg,
      font: app.quranFont as RenderFont,
      translations: trs,
      transliterations: tls,
      showWBW: true, // honor WBW transliteration/translation visibility
      arabicSize: 16 + (app.fontSize ?? 3) * 6,
      translationSize: 12 + (app.translationFontSize ?? 3) * 3,
      transliterationSize: 12 + (app.transliterationSize ?? 3) * 3,
    };
  }, [cfg, app.quranFont, app.selectedTranslations, app.selectedAyahTransliterator, app.fontSize, app.translationFontSize, app.transliterationSize]);

  const inlineWbwTr = (app as any).inlineTranslation && (app as any).inlineTranslation !== "None" ? (app as any).inlineTranslation : undefined;
  const inlineWbwTl = (app as any).inlineTransliteration && (app as any).inlineTransliteration !== "None" ? (app as any).inlineTransliteration : undefined;

  // Load surah data first (so we can clamp range to count)
  const [surahData, setSurahData] = useState<AssembledSurah | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSurahData(null);
    const primaryTr = ecfg.translations.find((t) => t !== "None");
    const primaryTl = ecfg.transliterations.find((t) => t !== "None");
    getSurah(cfg.surahId, {
      fontType: fontToType(ecfg.font),
      translation: primaryTr,
      transliteration: primaryTl,
      wbwTranslationInline: inlineWbwTr,
      wbwTransliterationInline: inlineWbwTl,
    }).then((d) => { if (!cancelled) setSurahData(d); });
    return () => { cancelled = true; };
  }, [cfg.surahId, ecfg.font, ecfg.translations, ecfg.transliterations, inlineWbwTr, inlineWbwTl]);

  // Sync when caller props change
  useEffect(() => {
    if (!open) return;
    setCfg((c) => ({
      ...c,
      surahId,
      ayahStart: ayahNumber ?? 1,
      ayahEnd: ayahNumber ?? c.ayahEnd,
    }));
  }, [open, surahId, ayahNumber]);

  const totalAyahs = surahData?.verses.length ?? 0;
  useEffect(() => {
    if (!totalAyahs) return;
    setCfg((c) => {
      const start = Math.max(1, Math.min(c.ayahStart, totalAyahs));
      const end = Math.max(start, Math.min(c.ayahEnd || totalAyahs, totalAyahs));
      if (start === c.ayahStart && end === c.ayahEnd) return c;
      return { ...c, ayahStart: start, ayahEnd: end };
    });
  }, [totalAyahs]);

  // Extra translations / transliterations (loaded per font)
  const [extraTranslations, setExtraTranslations] = useState<Record<string, string[]>>({});
  const [extraTransliterations, setExtraTransliterations] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    const sources = ecfg.translations.filter((t) => t !== "None");
    Promise.all(sources.map((src) =>
      getSurah(cfg.surahId, { fontType: fontToType(ecfg.font), translation: src })
        .then((d) => [src, d.verses.map((v) => v.translation ?? "")] as const)
        .catch(() => [src, [] as string[]] as const)
    )).then((entries) => {
      if (cancelled) return;
      const m: Record<string, string[]> = {};
      entries.forEach(([k, v]) => (m[k] = v));
      setExtraTranslations(m);
    });
    return () => { cancelled = true; };
  }, [ecfg.translations, cfg.surahId, ecfg.font]);

  useEffect(() => {
    let cancelled = false;
    const sources = ecfg.transliterations.filter((t) => t !== "None");
    Promise.all(sources.map((src) =>
      getSurah(cfg.surahId, { fontType: fontToType(ecfg.font), transliteration: src })
        .then((d) => [src, d.verses.map((v) => v.transliteration ?? "")] as const)
        .catch(() => [src, [] as string[]] as const)
    )).then((entries) => {
      if (cancelled) return;
      const m: Record<string, string[]> = {};
      entries.forEach(([k, v]) => (m[k] = v));
      setExtraTransliterations(m);
    });
    return () => { cancelled = true; };
  }, [ecfg.transliterations, cfg.surahId, ecfg.font]);

  const allVerses: AssembledVerse[] = surahData?.verses ?? [];
  const verses = useMemo(
    () => allVerses.filter((v) => v.verseNumber >= cfg.ayahStart && v.verseNumber <= cfg.ayahEnd),
    [allVerses, cfg.ayahStart, cfg.ayahEnd]
  );

  // Auto-contrast
  const containerBgColorForContrast = cfg.containerBgKind === "color" ? cfg.containerBg : cfg.bgColor;
  const arabicCol         = cfg.autoContrast ? ensureReadable(cfg.arabicColor, containerBgColorForContrast)         : cfg.arabicColor;
  const translationCol    = cfg.autoContrast ? ensureReadable(cfg.translationColor, containerBgColorForContrast)    : cfg.translationColor;
  const transliterationCol= cfg.autoContrast ? ensureReadable(cfg.transliterationColor, containerBgColorForContrast): cfg.transliterationColor;
  const highlightCol      = cfg.autoContrast ? ensureReadable(cfg.highlightColor, containerBgColorForContrast)      : cfg.highlightColor;

  // Highlight cycling (render only)
  // Static preview — no cycling. We always show the first verse in range.
  const tick = 0;
  useEffect(() => { /* static preview, no interval */ }, [open, totalWords, cfg.surahId, cfg.ayahStart, cfg.ayahEnd, ecfg.font, mode, rendering]);

  const currentVerseIdx = 0;

  const currentVerseIdx = useMemo(() => {
    let count = 0;
    for (let i = 0; i < verses.length; i++) {
      count += verses[i].words.length;
      if (tick < count) return i;
    }
    return 0;
  }, [tick, verses]);

  const onFile = (field: "bgUrl" | "logoUrl" | "containerBgUrl", kindField?: "image" | "video") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      setCfg((c) => ({
        ...c,
        [field]: url,
        ...(kindField && field === "bgUrl" ? { bgKind: kindField } : {}),
        ...(field === "containerBgUrl" ? { containerBgKind: "image" as const } : {}),
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
    params.set("from", String(cfg.ayahStart));
    params.set("to", String(cfg.ayahEnd));
    params.set("font", ecfg.font);
    const trs = ecfg.translations.filter((t) => t !== "None");
    const tls = ecfg.transliterations.filter((t) => t !== "None");
    if (trs.length) params.set("translation", trs.join(","));
    if (tls.length) params.set("transliteration", tls.join(","));
    if (ecfg.showWBW) params.set("wbw", "1");
    if (cfg.audioPlayback) params.set("audio", "1");
    if (cfg.showTafsir) params.set("tafsir", "1");
    if (cfg.showCopy) params.set("copy", "1");
    if (cfg.showShare) params.set("share", "1");
    const origin = typeof window !== "undefined" ? window.location.origin : "https://al-deen.org";
    const url = `${origin}/Embed?${params.toString()}`;
    return `<iframe src="${url}" width="${cfg.width}" height="${cfg.height}" style="border:0;border-radius:12px" allow="autoplay" loading="lazy"></iframe>`;
  }, [cfg]);

  // ---- Result state ----
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultExt, setResultExt] = useState<string>("webm");
  const [resultSize, setResultSize] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  // ---- Headless render (WebCodecs → MediaRecorder → Canvas fallback) ----
  const handleRender = useCallback(async () => {
    if (rendering) return;
    if (!surahData || verses.length === 0) {
      toast({ title: "Content still loading", variant: "destructive" });
      return;
    }
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    cancelRef.current = false;
    setRendering(true);
    setProgress(0);

    // Load a video file (intro/outro) and wait for metadata.
    const loadVideo = (url: string): Promise<HTMLVideoElement | null> => {
      if (!url) return Promise.resolve(null);
      return new Promise((resolve) => {
        const v = document.createElement("video");
        v.src = url; v.muted = true; v.playsInline = true; v.preload = "auto";
        v.crossOrigin = "anonymous";
        const onReady = () => resolve(v);
        v.addEventListener("loadeddata", onReady, { once: true });
        v.addEventListener("error", () => resolve(null), { once: true });
        // Safety timeout
        setTimeout(() => resolve(v), 2500);
      });
    };
    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
      if (!url) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    try {
      const [introVideo, outroVideo, bgImg, containerImg, logoImg] = await Promise.all([
        cfg.addIntro ? loadVideo(cfg.introUrl) : Promise.resolve(null),
        cfg.addOutro ? loadVideo(cfg.outroUrl) : Promise.resolve(null),
        cfg.bgKind === "image" ? loadImage(cfg.bgUrl) : Promise.resolve(null),
        cfg.containerBgKind === "image" ? loadImage(cfg.containerBgUrl) : Promise.resolve(null),
        cfg.logoUrl ? loadImage(cfg.logoUrl) : Promise.resolve(null),
      ]);

      // Pull translation/transliteration text from already-loaded extras.
      const primaryTr = ecfg.translations.find((t) => t !== "None");
      const primaryTl = ecfg.transliterations.find((t) => t !== "None");
      const trArr = primaryTr ? (extraTranslations[primaryTr] ?? []) : [];
      const tlArr = primaryTl ? (extraTransliterations[primaryTl] ?? []) : [];

      const renderVerses: RenderVerse[] = verses.map((v) => ({
        verseNumber: v.verseNumber,
        arabic: v.arabic,
        words: v.words,
        translation: primaryTr ? (trArr[v.verseNumber - 1] ?? v.translation) : v.translation,
        transliteration: primaryTl ? (tlArr[v.verseNumber - 1] ?? v.transliteration) : v.transliteration,
      }));

      // Arabic font family of the first verse (KFC pages are per-page; v1).
      const arabicFontFamily =
        pageFontFamily(ecfg.font, cfg.surahId, verses[0].verseNumber) ?? "Uthmani";

      const reciterFolder = cfg.reciter.replace(/\s+/g, "_").replace(/'/g, "");

      const introMs = introVideo?.duration ? Math.round(introVideo.duration * 1000) : 0;
      const outroMs = outroVideo?.duration ? Math.round(outroVideo.duration * 1000) : 0;

      const timeline = await buildTimeline({
        surahId: cfg.surahId,
        verses: renderVerses,
        reciter: reciterFolder,
        fallbackPerWordMs: 450,
        introMs,
        outroMs,
      });

      const scene: RenderScene = {
        width: previewSize.w,
        height: previewSize.h,
        bgColor: cfg.bgColor,
        bgImage: bgImg,
        containerBg: cfg.containerBg,
        containerBgImage: containerImg,
        borderColor: cfg.borderColor,
        borderWidth: cfg.borderWidth,
        borderRadius: cfg.borderRadius,
        arabicFontFamily,
        arabicSize: Math.round((previewSize.h / 1080) * ecfg.arabicSize * 3),
        translationSize: Math.round((previewSize.h / 1080) * ecfg.translationSize * 2),
        transliterationSize: Math.round((previewSize.h / 1080) * ecfg.transliterationSize * 2),
        arabicColor: arabicCol,
        translationColor: translationCol,
        transliterationColor: transliterationCol,
        highlightColor: highlightCol,
        verses: renderVerses,
        watermark: "Al-Din.org",
        logoImage: logoImg,
        logoCorner: cfg.logoCorner,
        introVideo,
        outroVideo,
      };

      const tier = detectTier();
      toast({ title: "Rendering…", description: `Engine: ${tier.toUpperCase()}` });

      const result = await renderToVideo({
        scene,
        timeline,
        fps: cfg.exportFormat === "mp4" ? 30 : 24,
        format: cfg.exportFormat,
        videoBitrate: 4_000_000,
        onProgress: setProgress,
        shouldCancel: () => cancelRef.current,
      });

      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultExt(result.ext);
      setResultSize(result.blob.size);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Surah-${cfg.surahId}-${cfg.ayahStart}-${cfg.ayahEnd}.${result.ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      toast({
        title: "Video ready",
        description: `${result.tier.toUpperCase()} · ${(result.blob.size / 1024 / 1024).toFixed(1)} MB · ${result.ext.toUpperCase()}`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Render failed", description: String((err as Error)?.message || err), variant: "destructive" });
    } finally {
      setRendering(false);
    }
  }, [
    rendering, surahData, verses, resultUrl, cfg, ecfg.font, ecfg.translations, ecfg.transliterations,
    ecfg.arabicSize, ecfg.translationSize, ecfg.transliterationSize,
    extraTranslations, extraTransliterations,
    arabicCol, translationCol, transliterationCol, highlightCol, previewSize,
  ]);


  if (!open) return null;


  return (
    <div className="fixed inset-0 z-40 bg-background">
      <ScrollArea className="h-full">
        <div className={cn("p-3 sm:p-4 pt-16 sm:pt-20 mx-auto w-full", fullscreen ? "max-w-none" : "max-w-7xl")}>
          <div className={cn(
            "grid gap-3",
            fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[360px_1fr]"
          )}>
            {/* ============ LEFT: Configuration ============ */}
            {!fullscreen && (
              <div className="space-y-3">
                {/* Output */}
                <Box>
                  <SectionTitle>Output</SectionTitle>
                  {mode === "render" && (
                    <>
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
                      <Row label="Format">
                        <Select value={cfg.exportFormat} onValueChange={(v: Config["exportFormat"]) => setCfg((c) => ({ ...c, exportFormat: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="webm">WebM (VP9)</SelectItem>
                            <SelectItem value="mp4">MP4</SelectItem>
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
                    </>
                  )}
                  <Row label="Surah">
                    <Select value={String(cfg.surahId)} onValueChange={(v) => setCfg((c) => ({ ...c, surahId: parseInt(v), ayahStart: 1, ayahEnd: 1 }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {surahList.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.id}. {s.englishName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="From Ayah">
                    <Select value={String(cfg.ayahStart)} onValueChange={(v) => setCfg((c) => {
                      const s = parseInt(v); return { ...c, ayahStart: s, ayahEnd: Math.max(s, c.ayahEnd) };
                    })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {allVerses.map((v) => (
                          <SelectItem key={v.verseNumber} value={String(v.verseNumber)}>{v.verseNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="To Ayah">
                    <Select value={String(cfg.ayahEnd)} onValueChange={(v) => setCfg((c) => ({ ...c, ayahEnd: parseInt(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {allVerses.filter((v) => v.verseNumber >= cfg.ayahStart).map((v) => (
                          <SelectItem key={v.verseNumber} value={String(v.verseNumber)}>{v.verseNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                </Box>

                {/* Background (render only) */}
                {mode === "render" && (
                  <Box>
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
                  </Box>
                )}

                {mode === "embed" && (
                  <Box>
                    <SectionTitle>Size</SectionTitle>
                    <Row label="Width"><Input type="number" value={cfg.width}
                      onChange={(e) => setCfg((c) => ({ ...c, width: Math.max(120, parseInt(e.target.value || "0") || 0) }))} /></Row>
                    <Row label="Height"><Input type="number" value={cfg.height}
                      onChange={(e) => setCfg((c) => ({ ...c, height: Math.max(120, parseInt(e.target.value || "0") || 0) }))} /></Row>
                  </Box>
                )}


                {/* Colors */}
                <Box>
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
                </Box>

                {/* Render-only: Intro/Outro + Logo */}
                {mode === "render" && (
                  <>
                    <Box>
                      <SectionTitle>Intro / Outro</SectionTitle>
                      <ToggleRow label="Add Intro" value={cfg.addIntro}
                        onChange={(v) => setCfg((c) => ({ ...c, addIntro: v }))} />
                      {cfg.addIntro && (
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setCfg((c) => ({ ...c, introUrl: url }));
                          }}
                          className="text-xs mt-1"
                        />
                      )}
                      <ToggleRow label="Add Outro" value={cfg.addOutro}
                        onChange={(v) => setCfg((c) => ({ ...c, addOutro: v }))} />
                      {cfg.addOutro && (
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setCfg((c) => ({ ...c, outroUrl: url }));
                          }}
                          className="text-xs mt-1"
                        />
                      )}
                    </Box>

                    <Box>
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
                    </Box>
                  </>
                )}

                {/* Embed-only options */}
                {mode === "embed" && (
                  <Box>
                    <SectionTitle>Embed Options</SectionTitle>
                    <ToggleRow label="Audio Playback" value={cfg.audioPlayback}
                      onChange={(v) => setCfg((c) => ({ ...c, audioPlayback: v }))} />
                    <ToggleRow label="Show Tafsir Button" value={cfg.showTafsir}
                      onChange={(v) => setCfg((c) => ({ ...c, showTafsir: v }))} />
                    <ToggleRow label="Show Copy Button" value={cfg.showCopy}
                      onChange={(v) => setCfg((c) => ({ ...c, showCopy: v }))} />
                    <ToggleRow label="Show Share Button" value={cfg.showShare}
                      onChange={(v) => setCfg((c) => ({ ...c, showShare: v }))} />
                    <ToggleRow label="Hover Tooltip" value={cfg.hoverTooltip}
                      onChange={(v) => setCfg((c) => ({ ...c, hoverTooltip: v }))} />
                  </Box>
                )}

                {mode === "render" ? (
                  <div className="space-y-2">
                    <Button className="w-full gap-2" onClick={handleRender} disabled={rendering}>
                      {rendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {rendering ? `Rendering… ${Math.round(progress * 100)}%` : "Render & Download"}
                    </Button>
                    {rendering && (
                      <>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-foreground transition-all" style={{ width: `${progress * 100}%` }} />
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => { cancelRef.current = true; }}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {resultUrl && !rendering && (
                      <div className="space-y-2 pt-2 border-t border-border/30">
                        <video src={resultUrl} controls className="w-full rounded-lg bg-black" />
                        <div className="text-xs text-muted-foreground text-center">
                          {(resultSize / 1024 / 1024).toFixed(1)} MB • .{resultExt}
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                          const a = document.createElement("a");
                          a.href = resultUrl; a.download = `Surah-${cfg.surahId}-${cfg.ayahStart}-${cfg.ayahEnd}.${resultExt}`;
                          document.body.appendChild(a); a.click(); a.remove();
                        }}><Download className="h-3 w-3" /> Download again</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button className="w-full gap-2" onClick={() => {
                    navigator.clipboard?.writeText(embedSnippet);
                    toast({ title: "Embed snippet copied" });
                  }}><Copy className="h-4 w-4" /> Copy Embed Snippet</Button>
                )}
              </div>
            )}

            {/* ============ RIGHT: Preview ============ */}
            <div className="space-y-3">
              <div className="w-full">
                <div
                  ref={previewWrapRef}
                  className="relative w-full mx-auto overflow-hidden shadow-xl"
                  style={{
                    aspectRatio: previewAR,
                    maxWidth: previewAR >= 1 ? "100%" : "min(70vh, 100%)",
                    borderRadius: cfg.borderRadius,
                  }}
                >
                  {mode === "embed" ? (
                    <iframe
                      title="Embed preview"
                      srcDoc={buildEmbedPreviewDoc(ecfg as unknown as Config, verses, { arabicCol, translationCol, transliterationCol, highlightCol }, extraTranslations, extraTransliterations)}
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
                      {/* No tint overlay — preview matches the rendered output */}

                      <div className={cn("absolute text-white text-xs font-medium", cornerCls[ourLogoCorner])}>
                        Al-Din.org
                      </div>
                      {cfg.logoUrl && (
                        <img src={cfg.logoUrl} alt="logo"
                          className={cn("absolute h-10 w-auto object-contain", cornerCls[cfg.logoCorner])} />
                      )}

                      {introVisible && cfg.introUrl && (
                        <video src={cfg.introUrl} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
                      )}
                      {outroVisible && cfg.outroUrl && (
                        <video src={cfg.outroUrl} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
                      )}

                      {!introVisible && !outroVisible && (() => {
                        const v = verses[currentVerseIdx];
                        if (!v) return null;
                        let before = 0;
                        for (let i = 0; i < currentVerseIdx; i++) before += verses[i].words.length;
                        const currentWordIdx = tick - before;
                        const activeTranslations = ecfg.translations.filter((t) => t !== "None");
                        const activeTransliterations = ecfg.transliterations.filter((t) => t !== "None");
                        const ff = pageFontFamily(ecfg.font, cfg.surahId, v.verseNumber);

                        return (
                          <div className="absolute inset-0 flex items-center justify-center p-6">
                            <div className="w-full max-w-3xl px-6 py-6">

                              {(() => {
                                const hasInlineTr = !!v.wbwTranslationInline?.length;
                                const hasInlineTl = !!v.wbwTransliterationInline?.length;
                                const anyInline = hasInlineTr || hasInlineTl;

                                if (anyInline) {
                                  return (
                                    <div dir="rtl" className={cn("flex flex-wrap justify-center items-start gap-x-3 gap-y-2", fontClass(ecfg.font))}>
                                      {v.words.map((w, i) => {
                                        const isLast = i === v.words.length - 1;
                                        return (
                                          <div key={i} className="flex flex-col items-center" style={{ minWidth: "2.5rem" }}>
                                            <span style={{ color: i === currentWordIdx ? highlightCol : arabicCol, fontSize: ecfg.arabicSize, fontFamily: ff, lineHeight: 1.6 }}>{w}</span>
                                            {!isLast && (
                                              <div className="flex flex-col items-center gap-y-0.5 mt-1 w-full" dir="ltr" style={{ fontFamily: "system-ui, sans-serif" }}>
                                                {hasInlineTr && v.wbwTranslationInline?.[i] && (
                                                  <span style={{ color: translationCol, fontSize: 12, textAlign: "center", lineHeight: 1.2 }}>{v.wbwTranslationInline[i]}</span>
                                                )}
                                                {hasInlineTl && v.wbwTransliterationInline?.[i] && (
                                                  <span style={{ color: transliterationCol, fontSize: 12, fontStyle: "italic", textAlign: "center", lineHeight: 1.2 }}>{v.wbwTransliterationInline[i]}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                return (
                                  <div dir="rtl"
                                    className={cn("leading-relaxed text-center", fontClass(ecfg.font))}
                                    style={{ color: arabicCol, fontSize: ecfg.arabicSize, fontFamily: ff }}>
                                    {v.words.map((w, i) => (
                                      <span key={i} style={i === currentWordIdx ? { color: highlightCol } : undefined}>
                                        {w}{ecfg.font === "uthmani_v1" ? "" : " "}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}

                              {activeTransliterations.map((src) => (
                                <div key={src} className="italic text-center mt-3" style={{ color: transliterationCol, fontSize: ecfg.transliterationSize }}>
                                  {extraTransliterations[src]?.[v.verseNumber - 1] ?? ""}
                                </div>
                              ))}

                              {activeTranslations.map((src) => (
                                <div key={src} className="text-center mt-3"
                                  style={{ color: translationCol, fontSize: ecfg.translationSize }}>
                                  {extraTranslations[src]?.[v.verseNumber - 1] ?? ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

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
              </div>


              {mode === "embed" && (
                <Box>
                  <div className="flex items-center justify-between mb-2">
                    <SectionTitle>Embed Snippet</SectionTitle>
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => { navigator.clipboard?.writeText(embedSnippet); toast({ title: "Copied" }); }}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
{embedSnippet}
                  </pre>
                </Box>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ====================== Sub-bits ======================
function Box({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/40 p-3", className)}>
      {children}
    </div>
  );
}
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

// ====================== Embed preview (Verse-Card style) ======================
function buildEmbedPreviewDoc(
  cfg: Config & Record<string, any>,
  verses: AssembledVerse[],
  cols: { arabicCol: string; translationCol: string; transliterationCol: string; highlightCol: string },
  extraTr: Record<string, string[]>,
  extraTl: Record<string, string[]>,
): string {
  const containerBg = cfg.containerBgKind === "image" && cfg.containerBgUrl
    ? `center/cover no-repeat url("${cfg.containerBgUrl}")`
    : cfg.containerBg;
  const border = `${cfg.borderWidth}px solid ${cfg.borderColor}`;

  const cardFor = (v: AssembledVerse): string => {
    const arabicWords = v.words.map((w) => `<span>${escapeHtml(w)}</span>`).join(cfg.font === "uthmani_v1" ? "" : " ");
    const actions: string[] = [];
    if (cfg.audioPlayback) actions.push(btn("▶ Play"));
    if (cfg.showTafsir)    actions.push(btn("Tafsir"));
    if (cfg.showCopy)      actions.push(btn("Copy"));
    if (cfg.showShare)     actions.push(btn("Share"));

    const trBlocks = cfg.translations.filter((t) => t !== "None").map((src) =>
      `<div class="tr" style="color:${cols.translationCol};font-size:${cfg.translationSize}px">${escapeHtml(extraTr[src]?.[v.verseNumber - 1] ?? "")}</div>`
    ).join("");
    const tlBlocks = cfg.transliterations.filter((t) => t !== "None").map((src) =>
      `<div class="tl" style="color:${cols.transliterationCol};font-size:${cfg.transliterationSize}px">${escapeHtml(extraTl[src]?.[v.verseNumber - 1] ?? "")}</div>`
    ).join("");
    const wbw = cfg.showWBW
      ? `<div class="wbw" dir="rtl">${v.words.map((w) => `<span>${escapeHtml(w)}</span>`).join("")}</div>`
      : "";

    return `<div class="card" style="background:${containerBg};border:${border};border-radius:${cfg.borderRadius}px">
      <div class="head"><span class="badge">${cfg.surahId}:${v.verseNumber}</span><div class="acts">${actions.join("")}</div></div>
      <div class="ar" dir="rtl" style="color:${cols.arabicCol};font-size:${cfg.arabicSize}px">${arabicWords}</div>
      ${wbw}
      ${tlBlocks}
      ${trBlocks}
    </div>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,sans-serif;background:transparent;padding:14px;display:flex;flex-direction:column;gap:14px}
  .card{padding:18px 20px;display:flex;flex-direction:column;gap:10px}
  .head{display:flex;justify-content:space-between;align-items:center}
  .badge{font-size:12px;color:#666;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:999px}
  .acts{display:flex;gap:6px;flex-wrap:wrap}
  .ar{line-height:2;text-align:right}
  .wbw{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#666;justify-content:flex-end}
  .tl{font-style:italic;text-align:left}
  .tr{text-align:left;line-height:1.5}
</style></head><body>
  ${verses.map(cardFor).join("")}
</body></html>`;
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function btn(label: string): string {
  return `<button style="border:1px solid #ddd;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer">${label}</button>`;
}

// ====================== Real render (canvas + MediaRecorder → webm download) ======================
async function renderToWebm(args: {
  verses: AssembledVerse[];
  cfg: Config & Record<string, any>;
  arabicCol: string;
  translationCol: string;
  transliterationCol: string;
  highlightCol: string;
  extraTranslations: Record<string, string[]>;
  extraTransliterations: Record<string, string[]>;
}): Promise<void> {
  const { verses, cfg, arabicCol, translationCol, transliterationCol, highlightCol, extraTranslations, extraTransliterations } = args;
  if (!verses.length) throw new Error("No ayahs in range");
  const res = RESOLUTIONS[cfg.resolution];
  const W = res.w, H = res.h;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Pre-load background image if any
  let bgImg: HTMLImageElement | null = null;
  if (cfg.bgKind === "image" && cfg.bgUrl) {
    bgImg = await loadImage(cfg.bgUrl);
  }
  let containerImg: HTMLImageElement | null = null;
  if (cfg.containerBgKind === "image" && cfg.containerBgUrl) {
    containerImg = await loadImage(cfg.containerBgUrl);
  }
  let logoImg: HTMLImageElement | null = null;
  if (cfg.logoUrl) {
    logoImg = await loadImage(cfg.logoUrl).catch(() => null);
  }

  const fps = 30;
  const stream = canvas.captureStream(fps);
  const wantMp4 = (cfg as any).exportFormat === "mp4";
  const mp4Mime = "video/mp4;codecs=avc1.42E01E";
  let mime: string;
  if (wantMp4 && MediaRecorder.isTypeSupported(mp4Mime)) mime = mp4Mime;
  else if (wantMp4 && MediaRecorder.isTypeSupported("video/mp4")) mime = "video/mp4";
  else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mime = "video/webm;codecs=vp9";
  else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) mime = "video/webm;codecs=vp8";
  else mime = "video/webm";
  const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const chunks: BlobPart[] = [];
  const rec = new MediaRecorder(stream, { mimeType: mime });
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] }));
  });

  rec.start();

  const perWord = 0.6; // seconds
  const totalWords = verses.reduce((a, v) => a + v.words.length, 0);
  const introSec = cfg.addIntro ? 1.2 : 0;
  const outroSec = cfg.addOutro ? 1.2 : 0;
  const totalSec = introSec + totalWords * perWord + outroSec;
  const totalFrames = Math.ceil(totalSec * fps);

  const drawBg = () => {
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, W, H);
  };

  const drawContainerCard = (cardX: number, cardY: number, cardW: number, cardH: number) => {
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, cfg.borderRadius);
    if (containerImg) {
      ctx.clip();
      ctx.drawImage(containerImg, cardX, cardY, cardW, cardH);
    } else {
      ctx.fillStyle = cfg.containerBg;
      ctx.fill();
    }
    ctx.restore();
    if (cfg.borderWidth > 0) {
      ctx.save();
      ctx.strokeStyle = cfg.borderColor;
      ctx.lineWidth = cfg.borderWidth;
      roundRect(ctx, cardX, cardY, cardW, cardH, cfg.borderRadius);
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawCenteredText = (text: string, x: number, y: number, maxW: number, size: number, color: string, font: string, align: CanvasTextAlign = "center") => {
    ctx.fillStyle = color;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    const lines = wrapText(ctx, text, maxW);
    const lineHeight = size * 1.4;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight));
    return lines.length * lineHeight;
  };

  const drawFrame = (frameIdx: number) => {
    const t = frameIdx / fps;
    drawBg();

    // Branding
    if (logoImg) {
      const h = 80; const w = (logoImg.width / logoImg.height) * h;
      ctx.drawImage(logoImg, W - w - 40, 40, w, h);
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 28px sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = logoImg ? "left" : "right";
    ctx.fillText("Al-Din.org", logoImg ? 40 : W - 40, 40);

    // Intro/Outro are now videos rendered via DOM-snapshot path; canvas fallback skips them.
    if (t < introSec && cfg.addIntro) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; }
    if (t > introSec + totalWords * perWord && cfg.addOutro) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; }

    const tick = Math.min(totalWords - 1, Math.max(0, Math.floor((t - introSec) / perWord)));
    let vIdx = 0, before = 0;
    for (let i = 0; i < verses.length; i++) {
      if (tick < before + verses[i].words.length) { vIdx = i; break; }
      before += verses[i].words.length;
    }
    const v = verses[vIdx];
    const wordIdx = tick - before;

    // Card
    const cardW = Math.min(W * 0.85, 1400);
    const cardH = H * 0.7;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;
    drawContainerCard(cardX, cardY, cardW, cardH);

    // Arabic line (no per-word highlight in canvas to keep things robust; whole text in arabicCol, current word in highlight)
    const ff = pageFontFamily(cfg.font, cfg.surahId, v.verseNumber) || "serif";
    ctx.save();
    ctx.font = `${cfg.arabicSize * 2}px ${ff}, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const arabicY = cardY + cardH * 0.35;
    const fullText = v.words.join(cfg.font === "uthmani_v1" ? "" : " ");
    ctx.fillStyle = arabicCol;
    const arLines = wrapText(ctx, fullText, cardW - 80);
    const arLH = cfg.arabicSize * 2 * 1.4;
    arLines.forEach((ln, i) => ctx.fillText(ln, W / 2, arabicY - ((arLines.length - 1) * arLH) / 2 + i * arLH));
    // Highlight current word at top
    ctx.fillStyle = highlightCol;
    ctx.font = `${cfg.arabicSize * 2}px ${ff}, serif`;
    ctx.fillText(v.words[wordIdx] || "", W / 2, cardY + 60);
    ctx.restore();

    // Translations
    let yCursor = cardY + cardH * 0.62;
    const activeTr = cfg.translations.filter((t) => t !== "None");
    const activeTl = cfg.transliterations.filter((t) => t !== "None");
    activeTl.forEach((src) => {
      const text = extraTransliterations[src]?.[v.verseNumber - 1] ?? "";
      if (!text) return;
      const used = drawCenteredText(text, W / 2, yCursor, cardW - 80, cfg.transliterationSize * 2, transliterationCol, "italic sans-serif");
      yCursor += used + 16;
    });
    activeTr.forEach((src) => {
      const text = extraTranslations[src]?.[v.verseNumber - 1] ?? "";
      if (!text) return;
      const used = drawCenteredText(text, W / 2, yCursor, cardW - 80, cfg.translationSize * 2, translationCol, "sans-serif");
      yCursor += used + 16;
    });
  };

  for (let f = 0; f < totalFrames; f++) {
    drawFrame(f);
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }
  rec.stop();
  const blob = await done;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Surah-${cfg.surahId}-${cfg.ayahStart}-${cfg.ayahEnd}.${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makeDefaults(surahId: number, ayahNumber: number | undefined, mode: "render" | "embed"): Config {
  return {
    resolution: "1080p",
    width: 600,
    height: 480,
    exportFormat: "webm",
    reciter: RECITERS[0],
    surahId,
    ayahStart: ayahNumber ?? 1,
    ayahEnd: ayahNumber ?? 1,
    bgKind: "color",
    bgColor: "#0b1f17",
    bgUrl: "",
    containerBgKind: "color",
    containerBg: "transparent",
    containerBgUrl: "",
    borderColor: "#ffffff",
    borderWidth: 0,
    borderRadius: 24,
    arabicColor: "#111827",
    translationColor: "#374151",
    transliterationColor: "#6b7280",
    highlightColor: "#16a34a",
    autoContrast: true,
    logoUrl: "",
    logoCorner: "tr",
    addIntro: false,
    introUrl: "",
    addOutro: false,
    outroUrl: "",
    audioPlayback: true,
    showTafsir: true,
    showCopy: true,
    showShare: false,
    hoverTooltip: true,

    arabicPosition: "center",
    translationPosition: "bottom-center",
    transliterationPosition: "bottom-center",

    showLines: false,
    linesCount: 8,
    showWatermark: true,
    watermarkText: "Al-Din.org",
  };
}

// (old DOM-snapshot renderer removed — see Layer/Middle/Render/Engine/)
