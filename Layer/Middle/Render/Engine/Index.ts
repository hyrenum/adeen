// Render engine orchestrator. Picks the best tier available with graceful
// fallback. Preview (React/DOM) MUST NOT call into here — this is export-only.

import { encodeWithWebCodecs, isWebCodecsSupported } from "./Encode-WebCodecs";
import { encodeWithMediaRecorder, encodeWithCanvas, isMediaRecorderSupported } from "./Encode-MediaRecorder";
import type { EncodeOptions, EncodeResult, EngineTier } from "./Types";

export * from "./Types";
export { buildTimeline, activeWordAt } from "./Timeline";

export function detectTier(preferred?: EngineTier): EngineTier {
  if (preferred) return preferred;
  if (isWebCodecsSupported()) return "webcodecs";
  if (isMediaRecorderSupported()) return "mediarecorder";
  return "canvas";
}

export async function renderToVideo(opts: EncodeOptions): Promise<EncodeResult> {
  const order: EngineTier[] = (() => {
    const tier = detectTier(opts.preferredTier);
    if (tier === "webcodecs") return ["webcodecs", "mediarecorder", "canvas"];
    if (tier === "mediarecorder") return ["mediarecorder", "canvas"];
    return ["canvas"];
  })();

  let lastErr: unknown = null;
  for (const tier of order) {
    try {
      if (tier === "webcodecs") return await encodeWithWebCodecs(opts);
      if (tier === "mediarecorder") return await encodeWithMediaRecorder(opts);
      return await encodeWithCanvas(opts);
    } catch (e) {
      console.warn(`[render-engine] tier "${tier}" failed, falling back`, e);
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All render tiers failed");
}
