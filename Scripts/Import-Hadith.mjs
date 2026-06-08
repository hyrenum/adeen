#!/usr/bin/env node
/**
 * Import Hadith from fawazahmed0/hadith-api and write JSON files
 * in our project structure:
 *   Layer/Bottom/Data/Hadith/Sahih/al-Bukhari/<Chapter-Name>/<id>.json
 *
 * File format: [arabic, transliteration (string|string[]), translation, wbw? (string[]), narrator]
 * Transliteration/WBW are left empty as the source API does not provide them.
 *
 * Usage:
 *   node Scripts/Import-Hadith.mjs [bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah]
 * Default: bukhari
 */
import fs from "node:fs/promises";
import path from "node:path";

const BOOK = process.argv[2] || "bukhari";

const BOOK_MAP = {
  bukhari: { ar: "ara-bukhari", en: "eng-bukhari", folder: "al-Bukhari" },
  muslim: { ar: "ara-muslim", en: "eng-muslim", folder: "Muslim" },
  abudawud: { ar: "ara-abudawud", en: "eng-abudawud", folder: "Abu-Dawud" },
  tirmidhi: { ar: "ara-tirmidhi", en: "eng-tirmidhi", folder: "Tirmidhi" },
  nasai: { ar: "ara-nasai", en: "eng-nasai", folder: "An-Nasai" },
  ibnmajah: { ar: "ara-ibnmajah", en: "eng-ibnmajah", folder: "Ibn-Majah" },
};

const cfg = BOOK_MAP[BOOK];
if (!cfg) {
  console.error("Unknown book:", BOOK);
  process.exit(1);
}

const BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const ROOT = path.resolve("Layer/Bottom/Data/Hadith/Sahih", cfg.folder);

const slug = (s) =>
  s
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const extractNarrator = (text) => {
  const m = text.match(/^Narrated\s+([^:]+):\s*/i);
  if (m) return [text.slice(m[0].length).trim(), m[1].trim()];
  return [text, ""];
};

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function main() {
  console.log(`Fetching ${cfg.ar} + ${cfg.en} ...`);
  const [ar, en] = await Promise.all([
    fetchJSON(`${BASE}/${cfg.ar}.json`),
    fetchJSON(`${BASE}/${cfg.en}.json`),
  ]);

  const enMap = new Map(en.hadiths.map((h) => [h.hadithnumber, h]));
  const chapters = new Map(en.metadata.sections ? Object.entries(en.metadata.sections) : []);
  const sectionDetails = en.metadata.section_details || {};

  await fs.mkdir(ROOT, { recursive: true });

  let written = 0;
  for (const h of ar.hadiths) {
    const enH = enMap.get(h.hadithnumber);
    if (!enH) continue;

    const arabic = (h.text || "").trim();
    const [translation, narrator] = extractNarrator((enH.text || "").trim());

    const chapterId = String(enH.reference?.book ?? "0");
    const chapterName = chapters.get(chapterId) || `Chapter-${chapterId}`;
    const folder = path.join(ROOT, slug(chapterName));
    await fs.mkdir(folder, { recursive: true });

    const data = [arabic, "", translation, narrator];
    await fs.writeFile(
      path.join(folder, `${h.hadithnumber}.json`),
      JSON.stringify(data, null, 2),
      "utf8"
    );
    written++;
    if (written % 200 === 0) console.log(`  wrote ${written}...`);
  }
  console.log(`Done. ${written} hadith written to ${ROOT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
