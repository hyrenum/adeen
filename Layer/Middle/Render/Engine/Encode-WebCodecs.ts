// Primary encoder: OffscreenCanvas + WebCodecs VideoEncoder (H.264) + mp4-muxer.
// Hardware accelerated where the platform allows. No DOM, no MediaRecorder.

import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { paintFrame } from "./Painter";
import type { EncodeOptions, EncodeResult } from "./Types";

declare const VideoEncoder: any;
declare const VideoFrame: any;

export function isWebCodecsSupported(): boolean {
  return (
    typeof (globalThis as any).VideoEncoder !== "undefined" &&
    typeof (globalThis as any).OffscreenCanvas !== "undefined"
  );
}

async function pickCodec(width: number, height: number, fps: number) {
  // Try High → Main → Baseline at the requested resolution.
  const tryConfigs = [
    { codec: "avc1.640028", profile: "high" },     // High@4.0
    { codec: "avc1.4D4028", profile: "main" },     // Main@4.0
    { codec: "avc1.42E01F", profile: "baseline" }, // Baseline@3.1
  ];
  for (const c of tryConfigs) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c.codec,
        width, height,
        framerate: fps,
        bitrate: 4_000_000,
        avc: { format: "avc" },
      });
      if (support?.supported) return c.codec;
    } catch { /* try next */ }
  }
  return null;
}

export async function encodeWithWebCodecs(opts: EncodeOptions): Promise<EncodeResult> {
  const { scene, timeline, fps, onProgress, shouldCancel } = opts;
  const bitrate = opts.videoBitrate ?? 4_000_000;

  const codec = await pickCodec(scene.width, scene.height, fps);
  if (!codec) throw new Error("No supported H.264 codec for this resolution");

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: scene.width,
      height: scene.height,
      frameRate: fps,
    },
    fastStart: "in-memory",
  });

  const encoder = new VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: Error) => { throw e; },
  });

  encoder.configure({
    codec,
    width: scene.width,
    height: scene.height,
    framerate: fps,
    bitrate,
    avc: { format: "avc" },
  });

  const canvas = new OffscreenCanvas(scene.width, scene.height);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("OffscreenCanvas 2D context unavailable");

  const totalFrames = Math.max(1, Math.round((timeline.totalMs / 1000) * fps));
  const frameDurUs = Math.round(1_000_000 / fps);
  let lastPhase: "intro" | "body" | "outro" | null = null;

  // Pre-attach video elements to DOM (offscreen) so they can decode frames.
  const attachVideo = (v: HTMLVideoElement | null | undefined) => {
    if (!v) return;
    if (!v.isConnected) {
      v.muted = true;
      v.playsInline = true;
      v.style.position = "fixed";
      v.style.left = "-9999px";
      v.style.top = "0";
      v.style.width = "2px";
      v.style.height = "2px";
      document.body.appendChild(v);
    }
  };
  const detachVideo = (v: HTMLVideoElement | null | undefined) => {
    if (v && v.isConnected) v.remove();
  };
  attachVideo(scene.introVideo);
  attachVideo(scene.outroVideo);

  try {
    for (let f = 0; f < totalFrames; f++) {
      if (shouldCancel?.()) break;
      const tMs = (f / fps) * 1000;

      // Seek intro/outro videos in lock-step (best-effort).
      if (tMs < timeline.introMs && scene.introVideo) {
        try { scene.introVideo.currentTime = tMs / 1000; } catch { /* ignore */ }
        // Wait a microtask for the frame to be ready.
        await new Promise((r) => setTimeout(r, 0));
      } else if (tMs >= timeline.bodyEndMs && scene.outroVideo) {
        const off = (tMs - timeline.bodyEndMs) / 1000;
        try { scene.outroVideo.currentTime = off; } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 0));
      }

      const res = paintFrame(ctx as any, scene, timeline, tMs);
      lastPhase = res.phase;

      const vf = new VideoFrame(canvas as any, {
        timestamp: f * frameDurUs,
        duration: frameDurUs,
      });
      // Keyframe every 1s.
      encoder.encode(vf, { keyFrame: f % fps === 0 });
      vf.close();

      // Throttle queue so we don't blow memory on slow encoders.
      if (encoder.encodeQueueSize > fps * 2) {
        await new Promise((r) => setTimeout(r, 8));
      }
      if (f % 4 === 0) onProgress?.(f / totalFrames);
    }

    await encoder.flush();
    encoder.close();
    muxer.finalize();
  } finally {
    detachVideo(scene.introVideo);
    detachVideo(scene.outroVideo);
  }

  onProgress?.(1);
  const buf = (muxer.target as ArrayBufferTarget).buffer;
  const blob = new Blob([buf], { type: "video/mp4" });
  if (!blob.size) throw new Error("WebCodecs produced an empty file");
  return {
    blob,
    ext: "mp4",
    mime: "video/mp4",
    tier: "webcodecs",
    durationMs: timeline.totalMs,
  };
}
