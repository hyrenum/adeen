#!/usr/bin/env node
/**
 * Optimized Script: Fetches all 114 Surahs from Quran.com API v4
 * Extracts and compiles ONLY Presentation-Form/B (font_v1_glyphs) with connected rendering.
 */
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://api.quran.com/api/v4";
const TOTAL_SURAHS = 114;

const PATH_V1 = path.resolve("Layer/Bottom/Data/Quran/Surah/Presentation-Form/B");

async function fetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function writeJsonFile(targetPath, surahNum, data) {
  await fs.mkdir(targetPath, { recursive: true });
  await fs.writeFile(
    path.join(targetPath, `${surahNum}.json`),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

async function processSurah(surahNum) {
  // Requesting only code_v1 to minimize payload size and processing overhead
  const url = `${API}/verses/by_chapter/${surahNum}?words=true&word_fields=code_v1&per_page=300`;
  
  const data = await fetchJson(url);
  if (!data || !data.verses) {
    return false;
  }

  const v1Array = [];

  for (const verse of data.verses) {
    // Join V1 glyph components with NO spaces to guarantee connected text rendering
    const v1Text = verse.words.map(w => w.code_v1 || "").join("").trim();
    v1Array.push(v1Text);
  }

  // Save exclusively to the Presentation-Form/B matrix
  await writeJsonFile(PATH_V1, surahNum, v1Array);
  return true;
}

async function main() {
  let done = 0;

  for (let i = 1; i <= TOTAL_SURAHS; i++) {
    const success = await processSurah(i);
    if (success) {
      done++;
    }
    console.log(`${done}/${TOTAL_SURAHS}`);
  }
}

main().catch(() => {
  process.exit(1);
});