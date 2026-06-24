import * as fs from "fs";
import * as path from "path";

// 🌟 Target compilation file paths based on your workspace tree
const DATA_DIR = path.join(process.cwd(), "Server", "Data", "Hadith");
const OUTPUT_FILE = path.join(process.cwd(), "public", "RAG", "HadithCorpus.json");

// Define structural registry definitions so the system builds smoothly
const collectionRegistry = [
  {
    id: "Sahih-Muslim",
    slug: "Sahih-Muslim",
    name: "Sahih Muslim",
    author: "Muslim",
    topFolder: "Sahih",
    authorFolder: "Muslim",
    description: "Sahih Muslim collection compiled by Imam Muslim.",
  }
];

function cleanString(str) {
  if (!str) return "";
  // Strip out duplicate wrapping quotes or accidental double escapes if present
  return str.trim().replace(/^["']|["']$/g, "");
}

function buildCorpus() {
  console.log("🚀 Starting Hadith Corpus aggregation rebuild...");
  
  const finalizedCollections = [];
  let systemWideTotalHadiths = 0;

  for (const registry of collectionRegistry) {
    const chaptersList = [];
    let collectionHadithCount = 0;

    // Scan the Source directories to detect existing chapters dynamically
    const sourceCollectionPath = path.join(DATA_DIR, "Source", registry.topFolder, registry.authorFolder);
    const translationCollectionPath = path.join(DATA_DIR, "Translation", "English", registry.authorFolder);

    if (!fs.existsSync(sourceCollectionPath)) {
      console.warn(`⚠️ Source folder missing for ${registry.name}, skipping folder scan.`);
      continue;
    }

    const chapterFolders = fs.readdirSync(sourceCollectionPath).filter(file => {
      return fs.statSync(path.join(sourceCollectionPath, file)).isDirectory();
    });

    for (const chapFolder of chapterFolders) {
      const sourceChapterPath = path.join(sourceCollectionPath, chapFolder);
      const translationChapterPath = path.join(translationCollectionPath, chapFolder);

      // Scan all json entries inside the current chapter folder
      const hadithFiles = fs.readdirSync(sourceChapterPath).filter(file => file.endsWith(".json"));
      const compiledHadiths = [];

      // Sort natural order to preserve ranges accurately (e.g., '8.json', '8a.json', '9.json')
      hadithFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      hadithFiles.forEach((filename, globalIndex) => {
        const hadithId = path.basename(filename, ".json"); // extracts "8" or "2261"
        const cleanNum = parseInt(hadithId, 10) || 0;

        let arabicText = "";
        let englishText = "";

        // 1. Read Arabic Source File
        const srcFilePath = path.join(sourceChapterPath, filename);
        try {
          const rawSrc = fs.readFileSync(srcFilePath, "utf-8");
          const parsedSrc = JSON.parse(rawSrc);
          // Since file is raw array ["text string"], read index 0 safely
          if (Array.isArray(parsedSrc) && parsedSrc.length > 0) {
            arabicText = cleanString(parsedSrc[0]);
          } else if (typeof parsedSrc === "string") {
            arabicText = cleanString(parsedSrc);
          }
        } catch (e) {
          console.error(`❌ Error parsing Arabic source file: ${srcFilePath}`);
        }

        // 2. Read English Translation File
        const transFilePath = path.join(translationChapterPath, filename);
        if (fs.existsSync(transFilePath)) {
          try {
            const rawTrans = fs.readFileSync(transFilePath, "utf-8");
            const parsedTrans = JSON.parse(rawTrans);
            // Read index 0 from translation array safely
            if (Array.isArray(parsedTrans) && parsedTrans.length > 0) {
              englishText = cleanString(parsedTrans[0]);
            } else if (typeof parsedTrans === "string") {
              englishText = cleanString(parsedTrans);
            }
          } catch (e) {
            console.error(`❌ Error parsing English translation file: ${transFilePath}`);
          }
        }

        // Assemble uniform payload structure
        compiledHadiths.push({
          i: systemWideTotalHadiths + globalIndex + 1,
          id: hadithId,
          num: cleanNum,
          ar: arabicText,
          en: englishText,
          na: "" 
        });
      });

      if (compiledHadiths.length > 0) {
        const startId = compiledHadiths[0].id;
        const endId = compiledHadiths[compiledHadiths.length - 1].id;
        
        // Humanize the folder name for display views ("The-Book-of-Dreams" -> "The Book of Dreams")
        const humanizedName = chapFolder.replace(/-/g, " ");

        chaptersList.push({
          id: chapFolder,
          name: humanizedName,
          count: compiledHadiths.length,
          range: `${startId}-${endId}`,
          hadiths: compiledHadiths
        });

        collectionHadithCount += compiledHadiths.length;
        systemWideTotalHadiths += compiledHadiths.length;
      }
    }

    finalizedCollections.push({
      ...registry,
      hadithCount: collectionHadithCount,
      chapters: chaptersList
    });
  }

  // Final global object map structure
  const corpusPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCollections: finalizedCollections.length,
      totalHadiths: systemWideTotalHadiths
    },
    collections: finalizedCollections
  };

  // Check output directory paths layout limits
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(corpusPayload, null, 2), "utf-8");
  console.log(`\n✨ Success! Compiled ${systemWideTotalHadiths} Hadiths completely into: ${OUTPUT_FILE}`);
}

buildCorpus();