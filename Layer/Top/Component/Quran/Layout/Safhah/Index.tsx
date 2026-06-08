import React, { useMemo, useRef, useState } from "react";
import { useApp } from "@/Middle/Context/App";
import { PageLines } from "./Main";
import type { PageViewProps, ResolvedWord } from "./Types";
import type { AssembledVerse } from "@/Bottom/API/Quran";
import { getPageSegments } from "@/Bottom/API/Quran";
import { Container } from "@/Top/Component/UI/Container";
import { useQuranData } from "@/Middle/Hook/Use-Quran-Data";
import indoPakMarkers from "@/Bottom/Data/Quran/Meta/Indo-Pak-Verse-Markers.json";

export function PageView({
  surah,
  assembledSurah,
  showArabicText,
  hoverTranslation,
  inlineTranslation,
  inlineTransliteration,
  fontClass,
  arabicFontSize,
  translationFontSize,
  transliterationFontSize,
  showTransliteration,
  verseRefs,
  wordSpacing = "1.8px",
  hideVerses = false,
  hideVerseMarkers = false,
}: PageViewProps) {
  const { verses, lines } = assembledSurah;
  const { quranFont } = useApp();
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);

  const surah1Data = useQuranData(1);

  const isIndoPakFont = quranFont === "indopak";
  const isUthmaniV4Font = quranFont === "uthmani_v4";

  const verseMarkerMap = useMemo(() => {
    if (!isIndoPakFont) return [];
    const markers = (indoPakMarkers as string[][])[surah.id - 1];
    return Array.isArray(markers) ? markers : [];
  }, [isIndoPakFont, surah.id]);

  const getPageFontFamily = (pageNumber: number): string => {
    switch (quranFont) {
      case "indopak": return "IndoPak";
      case "uthmani": return "Uthmani";
      case "uthmani_v1": return `Uthmani-V1-${pageNumber}`;
      case "uthmani_v2": return `Uthmani-V2-${pageNumber}`;
      case "uthmani_v4": return `Uthmani-V4-${pageNumber}`;
      default: return "Uthmani";
    }
  };

  const getBismillahFontFamily = (): string => {
    switch (quranFont) {
      case "indopak": return "IndoPak";
      case "uthmani": return "Uthmani";
      case "uthmani_v1": return "Uthmani-V1-1";
      case "uthmani_v2": return "Uthmani-V2-1";
      case "uthmani_v4": return "Uthmani-V4-1";
      default: return "Uthmani";
    }
  };

  const bismillahWords = useMemo(() => {
    if (!showArabicText) return [];
    const verses1 = surah1Data.data?.verses;
    if (!verses1 || verses1.length === 0) return [];
    const firstVerse = verses1[0];
    const words = firstVerse.words;
    if (words.length < 5) return [];
    return words.slice(0, 4).map((glyph, idx) => ({
      glyph,
      translation: firstVerse.wbwTranslationInline?.[idx] || firstVerse.wbwTranslationHover?.[idx],
      transliteration: firstVerse.wbwTransliterationInline?.[idx] || firstVerse.wbwTransliterationHover?.[idx],
    }));
  }, [showArabicText, surah1Data.data]);

  const pages = useMemo(() => {
    const startPage = surah.pages[0];
    const endPage = surah.pages[1];
    const result: { pageNumber: number; verses: AssembledVerse[] }[] = [];

    const verseMap = new Map<number, AssembledVerse>();
    for (const verse of verses) verseMap.set(verse.verseNumber, verse);

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const segments = getPageSegments(pageNum);
      if (!segments) continue;
      const surahSegment = segments.find((seg) => seg.surah === surah.id);
      if (!surahSegment) continue;

      const pageVerses: AssembledVerse[] = [];
      for (let vn = surahSegment.startVerse; vn <= surahSegment.endVerse; vn++) {
        const verse = verseMap.get(vn);
        if (verse) pageVerses.push(verse);
      }
      if (pageVerses.length > 0) result.push({ pageNumber: pageNum, verses: pageVerses });
    }
    return result;
  }, [surah, verses]);

  const verseMap = useMemo(() => {
    const map = new Map<number, AssembledVerse>();
    for (const verse of verses) map.set(verse.verseNumber, verse);
    return map;
  }, [verses]);

  const resolvedLines = useMemo<ResolvedWord[][]>(() => {
    if (!lines) return [];
    return lines.map((lineRefs) =>
      lineRefs.map((ref) => {
        const [ayahStr, wordStr] = ref.split(":");
        const ayah = parseInt(ayahStr, 10);
        const wordPos = parseInt(wordStr, 10);
        const verse = verseMap.get(ayah) ?? null;
        const wordIndex = wordPos - 1;
        const glyph = verse?.words[wordIndex] ?? ref;
        const isVerseEnd = !!verse && wordIndex === verse.words.length - 1;
        const isVerseNumber = verse === null;
        const isVerseMarker = !!verse && wordIndex === verse.words.length - 1;

        let verseNumber: number | undefined;
        if (isVerseNumber && glyph.includes(":")) {
          verseNumber = parseInt(glyph.split(":")[0], 10);
        } else if (isVerseMarker && verse) {
          verseNumber = verse.verseNumber;
        }

        const transliteration = (!isVerseEnd && verse?.wbwTransliteration?.[wordIndex]) || undefined;
        return {
          glyph, verse, wordIndex,
          isVerseEnd, isVerseNumber, isVerseMarker,
          verseNumber, transliteration,
        };
      })
    );
  }, [lines, verseMap]);

  const resolvedLinesByPage = useMemo(() => {
    return pages.map((page) => {
      const verseNumbers = new Set(page.verses.map(v => v.verseNumber));
      return resolvedLines.filter(line =>
        line.some(word =>
          word.verse !== null ? verseNumbers.has(word.verse.verseNumber)
          : word.isVerseNumber && word.verseNumber ? verseNumbers.has(word.verseNumber)
          : false
        )
      );
    });
  }, [pages, resolvedLines]);

  const getVerseTransliteration = (verse: AssembledVerse): string | null => {
    if (!showTransliteration) return null;
    return verse.transliteration || null;
  };

  const shouldShowBismillah = surah.id !== 1 && surah.id !== 9 && showArabicText;

  return (
    <div id="quran-container">
      {pages.map((page, pageIdx) => {
        const pageFontFamily = getPageFontFamily(page.pageNumber);
        const bismillahFontFamily = getBismillahFontFamily();
        const showBismillahOnThisPage = pageIdx === 0 && shouldShowBismillah;
        const containerClassName = pageIdx === 0
          ? "rounded-t-none rounded-b-[48px] mb-2"
          : "rounded-[48px] mb-2";

        return (
          <React.Fragment key={page.pageNumber}>
            <Container className={`w-full ${containerClassName}`}>
              <div className="relative">
                {showArabicText && (
                  <PageLines
                    resolvedLines={resolvedLinesByPage[pageIdx]}
                    fontClass={fontClass}
                    arabicFontSize={arabicFontSize}
                    wordSpacing={wordSpacing}
                    surahId={surah.id}
                    verseRefs={verseRefs}
                    hoveredVerse={hoveredVerse}
                    setHoveredVerse={setHoveredVerse}
                    showTransliteration={showTransliteration}
                    transliterationFontSize={transliterationFontSize}
                    hoverTranslation={hoverTranslation}
                    inlineTranslation={inlineTranslation}
                    inlineTransliteration={inlineTransliteration}
                    hideVerses={hideVerses}
                    hideVerseMarkers={hideVerseMarkers}
                    bismillahWords={showBismillahOnThisPage ? bismillahWords : []}
                    bismillahFontFamily={showBismillahOnThisPage ? bismillahFontFamily : undefined}
                    bismillahFontClass={fontClass}
                    bismillahFontSize={arabicFontSize}
                    pageFontFamily={pageFontFamily}
                    isIndoPakFont={isIndoPakFont}
                    verseMarkerMap={verseMarkerMap}
                    isUthmaniV4Font={isUthmaniV4Font}
                    justifyLines={false}
                  />
                )}

                {!showArabicText && showTransliteration && (
                  <div className="space-y-1 p-4">
                    {page.verses.map((verse) => {
                      const translit = getVerseTransliteration(verse);
                      if (!translit) return null;
                      return (
                        <p
                          key={`translit-${verse.verseNumber}`}
                          className={`text-muted-foreground leading-relaxed text-center transition-colors duration-200 ${
                            hoveredVerse === verse.verseNumber ? "bg-primary/10 rounded px-1" : ""
                          }`}
                          style={{ fontSize: transliterationFontSize }}
                          onMouseEnter={() => setHoveredVerse(verse.verseNumber)}
                          onMouseLeave={() => setHoveredVerse(null)}
                        >
                          {translit}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </Container>
          </React.Fragment>
        );
      })}
    </div>
  );
}
