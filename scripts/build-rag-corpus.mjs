#!/usr/bin/env node
// Build a flat RAG corpus from Quran (English), Hadith (English), and Aid data.
// Output: public/RAG/Corpus.json  -> [{id, src, ref, text}]
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "Layer/Bottom/Data");
const OUT_DIR = path.join(ROOT, "Layer/Bottom/Data/RAG");
const OUT_FILE = path.join(OUT_DIR, "Corpus.json");

const corpus = [];
let nextId = 0;
const push = (src, ref, text) => {
  if (!text) return;
  const t = String(text).replace(/\s+/g, " ").trim();
  if (!t) return;
  corpus.push({ i: nextId++, s: src, r: ref, t });
};

async function readJson(p) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return null; }
}

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile() && e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

function extractText(node, parts = []) {
  if (node == null) return parts;
  if (typeof node === "string") { parts.push(node); return parts; }
  if (typeof node === "number" || typeof node === "boolean") { parts.push(String(node)); return parts; }
  if (Array.isArray(node)) { for (const c of node) extractText(c, parts); return parts; }
  if (typeof node === "object") { for (const v of Object.values(node)) extractText(v, parts); return parts; }
  return parts;
}

// 1) Quran — Saheeh-International English translation, all 114 surahs
async function buildQuran() {
  const surahNames = await readJson(path.join(DATA, "Quran/Meta/Surah/Transliteration.json")) || [];
  const baseDir = path.join(DATA, "Quran/Surah/Translation/English/Saheeh-International");
  for (let s = 1; s <= 114; s++) {
    const verses = await readJson(path.join(baseDir, `${s}.json`));
    if (!Array.isArray(verses)) continue;
    const name = surahNames[s - 1] || `Surah ${s}`;
    verses.forEach((v, i) => {
      // Strip footnote markers like "Footnote-1"
      const clean = String(v).replace(/Footnote-\d+/g, "").replace(/\[.*?\]/g, m => m).trim();
      push("Quran", `${name} ${s}:${i + 1}`, clean);
    });
  }
}

// 2) Hadith — all English translations
async function buildHadith() {
  const root = path.join(DATA, "Hadith/Translation/English");
  const files = await walk(root);
  for (const f of files) {
    const rel = path.relative(root, f).replace(/\.json$/, "");
    const parts = rel.split(path.sep);
    // e.g. Arbain/Al-Nawawi/Forty-Hadith-of-an-Nawawi/1
    const num = parts[parts.length - 1];
    const collection = parts.slice(0, -1).join(" / ").replace(/-/g, " ");
    const data = await readJson(f);
    const text = extractText(data).join(" ");
    push("Hadith", `${collection} #${num}`, text);
  }
}

// 3) Aid — Schools, Dua, Tajweed, Alphabet, Arabic
async function buildAid() {
  const root = path.join(DATA, "Aid");
  const files = await walk(root);
  for (const f of files) {
    const rel = path.relative(root, f).replace(/\.json$/, "");
    const data = await readJson(f);
    if (!data) continue;
    // For Schools.json: split per school
    if (rel === "Schools" && data?.branches) {
      for (const b of data.branches) {
        push("Aid/Schools", `Branch: ${b.name}`, [b.summary, ...(b.schools || []).map(s => `${s.name}: ${s.summary || ""}`)].join(" "));
        for (const sch of b.schools || []) {
          push("Aid/Schools", `${b.name} > ${sch.name}`, [sch.founder, sch.summary, sch.principles?.join(" "), sch.regions].filter(Boolean).join(" "));
        }
      }
      continue;
    }
    const text = extractText(data).join(" ");
    push(`Aid/${rel.split(path.sep)[0]}`, rel.replace(/[\\/]/g, " / ").replace(/-/g, " "), text);
  }
}

await buildQuran();
console.log(`Quran: ${corpus.length}`);
const qEnd = corpus.length;
await buildHadith();
console.log(`Hadith: ${corpus.length - qEnd}`);
const hEnd = corpus.length;
await buildAid();
console.log(`Aid: ${corpus.length - hEnd}`);

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_FILE, JSON.stringify(corpus));
const stat = await fs.stat(OUT_FILE);
console.log(`Wrote ${OUT_FILE} (${corpus.length} docs, ${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
