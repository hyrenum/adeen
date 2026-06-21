#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const TAFSIR_TARGETS = [
  {
    id: "804", // 🛠️ Corrected from 760 to 804
    slug: "kurd-tafsir-rebar",
    lang: "Kurdish",
    dirName: "Kurdish-Rebar-Tafseer"
  }
];

const BATCH_SIZE = 32; 

const SURAH_VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchVerseTafsir(targetId, targetSlug, chapter, verse, retryCount = 0) {
  const url = `https://quran.com/api/proxy/content/api/qdc/tafsirs/${targetId}/by_ayah/${chapter}:${verse}?locale=en`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://quran.com/${chapter}:${verse}/tafsir/${targetSlug}`
      }
    });

    if (response.status === 429) {
      const waitTime = 12000 * (retryCount + 1);
      console.log(`\n⚠️ Rate limited on ${chapter}:${verse}. Cooling down for ${waitTime}ms...`);
      await delay(waitTime);
      return fetchVerseTafsir(targetId, targetSlug, chapter, verse, retryCount + 1);
    }

    if (!response.ok) {
      console.log(`\n❌ Server returned status ${response.status} for ${chapter}:${verse}`);
      return null;
    }

    const data = await response.json();
    return data.tafsir?.text || null;
  } catch (err) {
    if (retryCount < 2) {
      await delay(3000);
      return fetchVerseTafsir(targetId, targetSlug, chapter, verse, retryCount + 1);
    }
    return null;
  }
}

async function processAyah(targetId, targetSlug, surahId, ayahId, targetDir) {
  const textContent = await fetchVerseTafsir(targetId, targetSlug, surahId, ayahId);
  if (textContent) {
    const payload = [ textContent ];
    const fileDest = path.join(targetDir, `${ayahId}.json`);
    await fs.writeFile(fileDest, JSON.stringify(payload, null, 2), "utf8");
    return true;
  }
  return false;
}

async function main() {
  console.log("🔥 Starting Kurdish Tafsir Ingestion Sequence...");
  console.log(`Concurrency: ${BATCH_SIZE} requests/batch\n`);

  for (const book of TAFSIR_TARGETS) {
    const baseOutputDir = path.resolve(`Layer/Bottom/Data/Quran/Surah/Tafsir/${book.lang}/${book.dirName}`);
    
    console.log(`================================================================`);
    console.log(`📚 BEGINNING INGESTION FOR [${book.lang.toUpperCase()}]: ${book.dirName}`);
    console.log(`================================================================\n`);

    for (let surahId = 1; surahId <= 114; surahId++) {
      const totalAyahs = SURAH_VERSE_COUNTS[surahId - 1];
      const targetDir = path.join(baseOutputDir, String(surahId));
      
      await fs.mkdir(targetDir, { recursive: true });
      console.log(`📁 Processing Surah ${surahId} (${totalAyahs} Ayahs total)`);

      for (let i = 1; i <= totalAyahs; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && (i + j) <= totalAyahs; j++) {
          batch.push(i + j);
        }

        process.stdout.write(`  ➜ [${book.id}] Fetching Ayahs [${batch[0]}...${batch[batch.length - 1]}]... `);

        const results = await Promise.all(
          batch.map(ayahId => processAyah(book.id, book.slug, surahId, ayahId, targetDir))
        );

        const savedCount = results.filter(Boolean).length;
        console.log(`Done! (${savedCount}/${batch.length} saved) 🎉`);

        await delay(350);
      }
    }
    console.log(`\n✅ Finished writing all files for ${book.dirName}.\n`);
  }
}

main().catch(console.error);