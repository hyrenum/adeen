// Headless render engine — shared types.
// The render pipeline is intentionally decoupled from the React/DOM preview.

export interface RenderVerse {
  verseNumber: number;
  arabic: string;
  words: string[];
  translation?: string;
  transliteration?: string;
}

export interface RenderScene {
  width: number;
  height: number;

  // Background
  bgColor: string;
  bgImage?: HTMLImageElement | ImageBitmap | null;

  // Container card
  containerBg: string;
  containerBgImage?: HTMLImageElement | ImageBitmap | null;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;

  // Typography
  arabicFontFamily: string;          // e.g. "Uthmani", "IndoPak", "Uthmani-V2-3"
  arabicSize: number;
  translationSize: number;
  transliterationSize: number;

  arabicColor: string;
  translationColor: string;
  transliterationColor: string;
  highlightColor: string;

  // Content
  verses: RenderVerse[];

  // Watermark / Logo
  watermark: string;                 // "Al-Din.org"
  logoImage?: HTMLImageElement | ImageBitmap | null;
  logoCorner?: "tl" | "tr" | "bl" | "br";

  // Intro / outro (video elements already loaded & seekable)
  introVideo?: HTMLVideoElement | null;
  outroVideo?: HTMLVideoElement | null;
}

/** Single word slice on the global timeline (ms, absolute from t=0). */
export interface TimelineWord {
  verseIdx: number;
  wordIdx: number;
  startMs: number;
  endMs: number;
}

export interface Timeline {
  introMs: number;
  outroMs: number;
  bodyStartMs: number;               // = introMs
  bodyEndMs: number;                 // = introMs + sum(words)
  totalMs: number;                   // = bodyEndMs + outroMs
  words: TimelineWord[];             // absolute timing (already includes introMs offset)
}

export type EngineTier = "webcodecs" | "mediarecorder" | "canvas";

export interface EncodeOptions {
  scene: RenderScene;
  timeline: Timeline;
  fps: number;
  format: "mp4" | "webm";
  videoBitrate?: number;             // bps; default 4_000_000
  onProgress?: (p: number) => void;  // 0..1
  shouldCancel?: () => boolean;
  preferredTier?: EngineTier;        // testing override
}

export interface EncodeResult {
  blob: Blob;
  ext: "mp4" | "webm";
  mime: string;
  tier: EngineTier;
  durationMs: number;
}
