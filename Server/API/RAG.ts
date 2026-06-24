// Lightweight client-side BM25 retrieval over the prebuilt RAG corpus.
// Corpus is externalized via lovable-assets and lazy-loaded on first use.
import asset from "Server/Data/RAG/Corpus.asset.json";

export type CorpusDoc = { i: number; s: string; r: string; t: string };
export type RetrievedDoc = CorpusDoc & { score: number };

const STOP = new Set([
  "a","an","the","is","are","was","were","be","been","being","of","to","in","on","at","by","for","with","and","or","but","if","then","else","as","that","this","these","those","it","its","i","you","he","she","we","they","me","him","her","us","them","my","your","his","our","their","do","does","did","done","have","has","had","not","no","so","than","too","very","can","will","would","should","could","may","might","just","about","into","over","under","up","down","out","s","t"
]);

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

type Index = {
  docs: CorpusDoc[];
  N: number;
  avgdl: number;
  dl: Float32Array;
  postings: Map<string, { df: number; entries: { d: number; tf: number }[] }>;
  idf: Map<string, number>;
};

let buildPromise: Promise<Index> | null = null;

async function build(): Promise<Index> {
  const url = (asset as { url: string }).url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAG corpus fetch failed: ${res.status}`);
  const docs = (await res.json()) as CorpusDoc[];

  const N = docs.length;
  const dl = new Float32Array(N);
  const postings = new Map<string, { df: number; entries: { d: number; tf: number }[] }>();
  let total = 0;
  for (let d = 0; d < N; d++) {
    const toks = tokenize(docs[d].t);
    dl[d] = toks.length;
    total += toks.length;
    const tfMap = new Map<string, number>();
    for (const w of toks) tfMap.set(w, (tfMap.get(w) || 0) + 1);
    for (const [w, tf] of tfMap) {
      let p = postings.get(w);
      if (!p) { p = { df: 0, entries: [] }; postings.set(w, p); }
      p.df += 1;
      p.entries.push({ d, tf });
    }
  }
  const avgdl = total / Math.max(N, 1);
  const idf = new Map<string, number>();
  for (const [w, p] of postings) {
    // BM25 idf with +1 smoothing
    idf.set(w, Math.log(1 + (N - p.df + 0.5) / (p.df + 0.5)));
  }
  return { docs, N, avgdl, dl, postings, idf };
}

export function ensureIndex(): Promise<Index> {
  if (!buildPromise) buildPromise = build();
  return buildPromise;
}

const K1 = 1.4;
const B = 0.75;

export async function search(query: string, k = 8): Promise<RetrievedDoc[]> {
  const idx = await ensureIndex();
  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0) return [];
  const scores = new Map<number, number>();
  for (const w of qTokens) {
    const p = idx.postings.get(w);
    if (!p) continue;
    const idf = idx.idf.get(w)!;
    for (const { d, tf } of p.entries) {
      const len = idx.dl[d] || 1;
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * len / idx.avgdl));
      scores.set(d, (scores.get(d) || 0) + idf * norm);
    }
  }
  const top = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([d, score]) => ({ ...idx.docs[d], score }));
  return top;
}

// Pre-warm in background (optional)
export function prefetch() {
  ensureIndex().catch(() => {});
}
