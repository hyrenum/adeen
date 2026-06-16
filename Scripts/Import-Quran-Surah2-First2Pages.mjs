#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("Layer/Bottom/Data/Quran/Training/Safhah-2-3-Surah-2");
const API = "https://api.alquran.cloud/v1";
const ayahs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function main() {
  await fs.mkdir(ROOT, { recursive: true });
  const [ar, en, tl] = await Promise.all([
    fetchJson(`${API}/surah/2/quran-uthmani`),
    fetchJson(`${API}/surah/2/en.sahih`),
    fetchJson(`${API}/surah/2/en.transliteration`),
  ]);
  const pick = (data) => data.data.ayahs.filter((a) => ayahs.includes(a.numberInSurah)).map((a) => a.text);
  const records = ayahs.map((n, i) => ({ surah: 2, ayah: n, arabic: pick(ar)[i], translation: pick(en)[i], transliteration: pick(tl)[i] }));
  await fs.writeFile(path.join(ROOT, "arabic.json"), JSON.stringify(records.map((r) => r.arabic), null, 2), "utf8");
  await fs.writeFile(path.join(ROOT, "translation-direct.json"), JSON.stringify(records.map((r) => r.translation), null, 2), "utf8");
  await fs.writeFile(path.join(ROOT, "transliteration-standard.json"), JSON.stringify(records.map((r) => r.transliteration), null, 2), "utf8");
  await fs.writeFile(path.join(ROOT, "combined.json"), JSON.stringify(records, null, 2), "utf8");
  console.log(`Wrote Surah 2 first two pages data to ${ROOT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });