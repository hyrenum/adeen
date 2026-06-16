#!/usr/bin/env python3
import json, math, re, sys
from collections import Counter
from pathlib import Path

MODEL = Path(__file__).resolve().parent / "Model" / "al-din-ai-model.json"
def tok(text): return re.findall(r"[\w\u0600-\u06FF]+", text.lower())
def score(q, v, idf):
    qt = Counter(tok(q)); terms = set(qt) | set(v)
    dot = sum(qt[t] * v.get(t, 0) * idf.get(t, 1) ** 2 for t in terms)
    qn = math.sqrt(sum((qt[t] * idf.get(t, 1)) ** 2 for t in qt)) or 1
    vn = math.sqrt(sum((v[t] * idf.get(t, 1)) ** 2 for t in v)) or 1
    return dot / (qn * vn)

query = " ".join(sys.argv[1:]).strip() or input("Ask: ")
m = json.loads(MODEL.read_text(encoding="utf8"))
best_i, best_s = max(enumerate(m["vectors"]), key=lambda iv: score(query, iv[1], m["idf"]))
row = m["rows"][best_i]
print(f"{row['reference']}\n{row['completion']}\n\nEnglish: {row.get('english','')}")