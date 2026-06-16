#!/usr/bin/env python3
import json, math, re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "Training-Data.jsonl"
OUT = ROOT / "Model" / "al-din-ai-model.json"

def tok(text):
    return re.findall(r"[\w\u0600-\u06FF]+", text.lower())

rows = [json.loads(line) for line in DATA.read_text(encoding="utf8").splitlines() if line.strip()]
docs = [" ".join(str(r.get(k, "")) for k in ("reference", "arabic", "english", "prompt", "completion")) for r in rows]
df = defaultdict(int)
vectors = []
for doc in docs:
    c = Counter(tok(doc))
    vectors.append(c)
    for term in c:
        df[term] += 1

n = max(1, len(rows))
idf = {term: math.log((1 + n) / (1 + freq)) + 1 for term, freq in df.items()}
model = {"type": "simple-tfidf-retrieval", "rows": rows, "idf": idf, "vectors": [dict(v) for v in vectors]}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(model, ensure_ascii=False, indent=2), encoding="utf8")
print(f"Wrote {OUT} with {len(rows)} training examples")