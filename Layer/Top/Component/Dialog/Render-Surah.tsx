// Layer/Top/Component/Dialog/Render-Surah.tsx
// PROTOTYPE: a simple two-pane dialog for configuring a Surah/Ayah video
// render. Left = configuration; Right = live preview. Renders an HTML preview
// with the current-word highlight + cross-faded translations; export is a
// placeholder for the future video pipeline.

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Top/Component/UI/Dialog";
import { Button } from "@/Top/Component/UI/Button";
import { Input } from "@/Top/Component/UI/Input";
import { Label } from "@/Top/Component/UI/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Top/Component/UI/Select";
import { Switch } from "@/Top/Component/UI/Switch";
import { surahList } from "@/Bottom/API/Quran";
import { useQuranData } from "@/Middle/Hook/Use-Quran-Data";
import { cn } from "@/Middle/Library/utils";

type Corner = "tl" | "tr" | "bl" | "br";
type Config = {
  resolution: "1080p" | "720p" | "vertical";
  reciter: string;
  surahId: number;
  ayahNumber: number | "all";
  bgUrl: string;
  bgKind: "image" | "video" | "color";
  bgColor: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  logoUrl: string;
  logoCorner: Corner;
  arabicColor: string;
  arabicBg: string;
  translationColor: string;
  translationBg: string;
  transliterationColor: string;
  transliterationBg: string;
  highlightColor: string;
  fontFamily: string;
};

const RECITERS = ["Mishary Rashid Alafasy", "Sa'd al-Ghamdi", "Maher al-Muaiqly"];
const FONTS = ["Uthmani", "IndoPak", "Uthmani-V2", "Uthmani-V4"];

const RESOLUTIONS: Record<Config["resolution"], { w: number; h: number; label: string }> = {
  "1080p": { w: 1920, h: 1080, label: "1080p (16:9)" },
  "720p": { w: 1280, h: 720, label: "720p (16:9)" },
  vertical: { w: 1080, h: 1920, label: "Vertical (9:16)" },
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  surahId: number;
  ayahNumber?: number;
  mode?: "render" | "embed";
}

export function RenderSurahDialog({
  open,
  onOpenChange,
  surahId,
  ayahNumber,
  mode = "render",
}: Props) {
  const [cfg, setCfg] = useState<Config>({
    resolution: "1080p",
    reciter: RECITERS[0],
    surahId,
    ayahNumber: ayahNumber ?? "all",
    bgUrl: "",
    bgKind: "color",
    bgColor: "#0b1f17",
    showTranslation: true,
    showTransliteration: false,
    logoUrl: "",
    logoCorner: "tl",
    arabicColor: "#ffffff",
    arabicBg: "transparent",
    translationColor: "#d8d8d8",
    translationBg: "transparent",
    transliterationColor: "#cfcfcf",
    transliterationBg: "transparent",
    highlightColor: "#34d399",
    fontFamily: "Uthmani",
  });

  useEffect(() => {
    if (open) setCfg((c) => ({ ...c, surahId, ayahNumber: ayahNumber ?? "all" }));
  }, [open, surahId, ayahNumber]);

  const { data: surahData } = useQuranData(cfg.surahId);
  const allVerses = surahData?.verses ?? [];
  const verses = useMemo(
    () =>
      cfg.ayahNumber === "all"
        ? allVerses
        : allVerses.filter((v) => v.verseNumber === cfg.ayahNumber),
    [allVerses, cfg.ayahNumber]
  );

  // Animate current-word highlight in the preview
  const totalWords = useMemo(
    () => verses.reduce((acc, v) => acc + v.words.length, 0),
    [verses]
  );
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open || totalWords === 0) return;
    const i = setInterval(() => setTick((t) => (t + 1) % totalWords), 600);
    return () => clearInterval(i);
  }, [open, totalWords]);

  // Cross-fade current verse translation
  const currentVerseIdx = useMemo(() => {
    let count = 0;
    for (let i = 0; i < verses.length; i++) {
      count += verses[i].words.length;
      if (tick < count) return i;
    }
    return 0;
  }, [tick, verses]);

  const handleFile =
    (field: "bgUrl" | "logoUrl", kindField?: "image" | "video") =>
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

  // Built-in Al-Deen.org logo. If user supplies own logo, shift ours to TL.
  const ourLogoCorner: Corner =
    cfg.logoUrl && cfg.logoCorner === "tr" ? "tl" : "tr";

  const res = RESOLUTIONS[cfg.resolution];
  const previewAR = res.w / res.h;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>
            {mode === "embed" ? "Embed Ayah" : "Render Surah"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0">
          {/* Config */}
          <div className="overflow-y-auto p-3 space-y-3 border-r text-sm">
            <Section title="Output">
              <Row label="Resolution">
                <Select
                  value={cfg.resolution}
                  onValueChange={(v: Config["resolution"]) =>
                    setCfg((c) => ({ ...c, resolution: v }))
                  }
                >
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
            </Section>

            <Section title="Background">
              <Row label="Color">
                <input type="color" value={cfg.bgColor} onChange={(e) => setCfg((c) => ({ ...c, bgColor: e.target.value, bgKind: "color" }))} className="h-8 w-full rounded" />
              </Row>
              <Row label="Image">
                <Input type="file" accept="image/*" onChange={handleFile("bgUrl", "image")} className="text-xs" />
              </Row>
              <Row label="Video">
                <Input type="file" accept="video/*" onChange={handleFile("bgUrl", "video")} className="text-xs" />
              </Row>
            </Section>

            <Section title="Text Layers">
              <ToggleRow label="Translation" value={cfg.showTranslation} onChange={(v) => setCfg((c) => ({ ...c, showTranslation: v }))} />
              <ToggleRow label="Transliteration" value={cfg.showTransliteration} onChange={(v) => setCfg((c) => ({ ...c, showTransliteration: v }))} />
              <Row label="Font">
                <Select value={cfg.fontFamily} onValueChange={(v) => setCfg((c) => ({ ...c, fontFamily: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Row>
            </Section>

            <Section title="Colors">
              <ColorPair label="Arabic" color={cfg.arabicColor} bg={cfg.arabicBg}
                onColor={(v) => setCfg((c) => ({ ...c, arabicColor: v }))}
                onBg={(v) => setCfg((c) => ({ ...c, arabicBg: v }))} />
              <ColorPair label="Translation" color={cfg.translationColor} bg={cfg.translationBg}
                onColor={(v) => setCfg((c) => ({ ...c, translationColor: v }))}
                onBg={(v) => setCfg((c) => ({ ...c, translationBg: v }))} />
              <ColorPair label="Transliteration" color={cfg.transliterationColor} bg={cfg.transliterationBg}
                onColor={(v) => setCfg((c) => ({ ...c, transliterationColor: v }))}
                onBg={(v) => setCfg((c) => ({ ...c, transliterationBg: v }))} />
              <Row label="Highlight">
                <input type="color" value={cfg.highlightColor} onChange={(e) => setCfg((c) => ({ ...c, highlightColor: e.target.value }))} className="h-8 w-full rounded" />
              </Row>
            </Section>

            <Section title="Logo">
              <Row label="Upload">
                <Input type="file" accept="image/*" onChange={handleFile("logoUrl")} className="text-xs" />
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
            </Section>

            <div className="pt-2 flex gap-2">
              <Button className="flex-1" onClick={() => alert(mode === "embed" ? "Embed snippet copied (prototype)" : "Render queued (prototype)")}>
                {mode === "embed" ? "Copy Embed" : "Render Video"}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-auto p-4 flex items-center justify-center bg-muted/30">
            <div
              className="relative shadow-xl rounded-lg overflow-hidden w-full"
              style={{ aspectRatio: previewAR, maxWidth: previewAR >= 1 ? "100%" : "60vh" }}
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
                <img
                  src={cfg.logoUrl}
                  alt="logo"
                  className={cn("absolute h-10 w-auto object-contain", cornerCls[cfg.logoCorner])}
                />
              )}

              {/* Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
                {(() => {
                  const v = verses[currentVerseIdx];
                  if (!v) return null;
                  // Build word offset within current verse
                  let before = 0;
                  for (let i = 0; i < currentVerseIdx; i++) before += verses[i].words.length;
                  const currentWordIdx = tick - before;
                  return (
                    <>
                      <div
                        dir="rtl"
                        style={{
                          color: cfg.arabicColor,
                          background: cfg.arabicBg,
                          fontFamily: cfg.fontFamily,
                        }}
                        className="text-2xl sm:text-4xl leading-relaxed px-3 py-1 rounded"
                      >
                        {v.words.map((w, i) => (
                          <span
                            key={i}
                            style={i === currentWordIdx ? { color: cfg.highlightColor } : undefined}
                          >
                            {w}{" "}
                          </span>
                        ))}
                      </div>
                      {cfg.showTransliteration && v.transliteration && (
                        <div
                          style={{ color: cfg.transliterationColor, background: cfg.transliterationBg }}
                          className="text-sm sm:text-base italic px-2 py-0.5 rounded"
                        >
                          {v.transliteration}
                        </div>
                      )}
                      {cfg.showTranslation && v.translation && (
                        <div
                          key={`tr-${currentVerseIdx}`}
                          style={{ color: cfg.translationColor, background: cfg.translationBg }}
                          className="text-sm sm:text-lg max-w-prose px-3 py-1 rounded animate-in fade-in duration-500"
                        >
                          {v.translation}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function ColorPair({
  label, color, bg, onColor, onBg,
}: { label: string; color: string; bg: string; onColor: (v: string) => void; onBg: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[100px_1fr_1fr] items-center gap-2">
      <Label className="text-xs">{label}</Label>
      <input type="color" value={color} onChange={(e) => onColor(e.target.value)} className="h-7 w-full rounded" title="Text" />
      <input
        type="color"
        value={bg === "transparent" ? "#000000" : bg}
        onChange={(e) => onBg(e.target.value)}
        className="h-7 w-full rounded"
        title="Background"
      />
    </div>
  );
}
