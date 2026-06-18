// Pure canvas painter — no DOM. Draws one frame of the render scene
// onto any CanvasRenderingContext2D / OffscreenCanvasRenderingContext2D.
//
// During render this is the ONLY thing that puts pixels on screen — the
// React preview is irrelevant. That is the entire point of the rewrite.

import { activeWordAt } from "./Timeline";
import type { RenderScene, Timeline } from "./Types";

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawCover(
  ctx: Ctx,
  img: HTMLImageElement | ImageBitmap,
  x: number, y: number, w: number, h: number
) {
  const iw = (img as any).width;
  const ih = (img as any).height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale, dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img as any, dx, dy, dw, dh);
}

/**
 * Wrap Arabic words into RTL lines that fit `maxWidth`.
 * Returns lines as arrays of { word, idx, widthPx }.
 */
function layoutArabicLines(
  ctx: Ctx,
  words: string[],
  maxWidth: number,
  spaceWidth: number
): { word: string; idx: number; width: number }[][] {
  const lines: { word: string; idx: number; width: number }[][] = [];
  let current: { word: string; idx: number; width: number }[] = [];
  let used = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wWidth = ctx.measureText(w).width;
    const need = current.length === 0 ? wWidth : used + spaceWidth + wWidth;
    if (need > maxWidth && current.length > 0) {
      lines.push(current);
      current = [{ word: w, idx: i, width: wWidth }];
      used = wWidth;
    } else {
      current.push({ word: w, idx: i, width: wWidth });
      used = need;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

function wrapPlain(ctx: Ctx, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export interface PaintResult {
  phase: "intro" | "body" | "outro";
}

/**
 * Paint one frame. Returns which phase was painted (intro/body/outro) so the
 * encoder can decide whether to seek the intro/outro video before the next
 * paint call.
 */
export function paintFrame(
  ctx: Ctx,
  scene: RenderScene,
  timeline: Timeline,
  timeMs: number
): PaintResult {
  const { width: W, height: H } = scene;

  // ---------------- Intro ----------------
  if (timeMs < timeline.introMs && scene.introVideo) {
    drawCover(ctx as any, scene.introVideo as any, 0, 0, W, H);
    return { phase: "intro" };
  }
  // ---------------- Outro ----------------
  if (timeMs >= timeline.bodyEndMs && scene.outroVideo) {
    drawCover(ctx as any, scene.outroVideo as any, 0, 0, W, H);
    return { phase: "outro" };
  }

  // ---------------- Background ----------------
  ctx.fillStyle = scene.bgColor || "#000";
  ctx.fillRect(0, 0, W, H);
  if (scene.bgImage) drawCover(ctx, scene.bgImage, 0, 0, W, H);

  // ---------------- Container ----------------
  const padX = Math.round(W * 0.06);
  const padY = Math.round(H * 0.08);
  const cx = padX, cy = padY;
  const cw = W - padX * 2, ch = H - padY * 2;

  ctx.save();
  roundRectPath(ctx, cx, cy, cw, ch, scene.borderRadius);
  ctx.fillStyle = scene.containerBg || "rgba(0,0,0,0.4)";
  ctx.fill();
  if (scene.containerBgImage) {
    ctx.save();
    roundRectPath(ctx, cx, cy, cw, ch, scene.borderRadius);
    ctx.clip();
    drawCover(ctx, scene.containerBgImage, cx, cy, cw, ch);
    ctx.restore();
  }
  if (scene.borderWidth > 0) {
    ctx.lineWidth = scene.borderWidth;
    ctx.strokeStyle = scene.borderColor;
    roundRectPath(ctx, cx, cy, cw, ch, scene.borderRadius);
    ctx.stroke();
  }
  ctx.restore();

  // ---------------- Active verse ----------------
  const active = activeWordAt(timeline, timeMs);
  const verseIdx = active ? active.verseIdx : 0;
  const activeWordIdx = active ? active.wordIdx : -1;
  const verse = scene.verses[verseIdx];
  if (!verse) return { phase: "body" };

  const innerX = cx + Math.round(cw * 0.05);
  const innerW = cw - Math.round(cw * 0.05) * 2;
  let y = cy + Math.round(ch * 0.12);

  // -------- Arabic (RTL) --------
  ctx.font = `${scene.arabicSize}px "${scene.arabicFontFamily}", "Uthmani", serif`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "right";
  (ctx as any).direction = "rtl";

  const spaceWidth = ctx.measureText(" ").width;
  const lines = layoutArabicLines(ctx, verse.words, innerW, spaceWidth);
  const arabicLineHeight = Math.round(scene.arabicSize * 1.9);

  for (const line of lines) {
    let xRight = innerX + innerW;
    for (const tok of line) {
      const isActive = tok.idx === activeWordIdx;
      ctx.fillStyle = isActive ? scene.highlightColor : scene.arabicColor;
      ctx.fillText(tok.word, xRight, y + scene.arabicSize);
      xRight -= tok.width + spaceWidth;
    }
    y += arabicLineHeight;
  }

  // -------- Transliteration --------
  if (verse.transliteration) {
    y += Math.round(scene.arabicSize * 0.4);
    ctx.font = `italic ${scene.transliterationSize}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = "center";
    (ctx as any).direction = "ltr";
    ctx.fillStyle = scene.transliterationColor;
    const tLines = wrapPlain(ctx, verse.transliteration, innerW);
    const tLH = Math.round(scene.transliterationSize * 1.5);
    for (const line of tLines) {
      ctx.fillText(line, innerX + innerW / 2, y + scene.transliterationSize);
      y += tLH;
    }
  }

  // -------- Translation --------
  if (verse.translation) {
    y += Math.round(scene.translationSize * 0.5);
    ctx.font = `${scene.translationSize}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = "center";
    (ctx as any).direction = "ltr";
    ctx.fillStyle = scene.translationColor;
    const tLines = wrapPlain(ctx, verse.translation, innerW);
    const tLH = Math.round(scene.translationSize * 1.5);
    for (const line of tLines) {
      ctx.fillText(line, innerX + innerW / 2, y + scene.translationSize);
      y += tLH;
    }
  }

  // -------- Watermark (no background pill) --------
  if (scene.watermark) {
    const wmSize = Math.round(Math.min(W, H) * 0.022);
    ctx.font = `600 ${wmSize}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    (ctx as any).direction = "ltr";
    ctx.fillStyle = scene.arabicColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(scene.watermark, W - Math.round(W * 0.03), H - Math.round(H * 0.03));
    ctx.globalAlpha = 1;
  }

  return { phase: "body" };
}
