import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { getArabicWord } from "@/Bottom/API/Arabic";
import { useArabicBookmarks } from "@/Middle/Hook/Use-Arabic-Bookmarks";
import { useTranslation } from "@/Middle/Hook/Use-Translation";
import { Bookmark, BookmarkCheck, Volume2 } from "lucide-react";

export default function ArabicWordPage() {
  const { categoryId, subId, wordId } = useParams<{
    categoryId: string;
    subId: string;
    wordId: string;
  }>();
  const word = getArabicWord(categoryId || "", subId || "", wordId || "");
  const bookmarkKey = `${categoryId}/${subId}/${wordId}`;
  const { isBookmarked, toggle } = useArabicBookmarks();
  const { isRtl } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  if (!word) {
    return (
      <Layout>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Word not found</p>
          <Link to={`/Aid/Arabic/${categoryId}/${subId}`}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const playAudio = () => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(word.arabic);
    utter.lang = "ar-SA";
    utter.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // Labels — flip to Arabic when UI language is RTL/Arabic
  const L = isRtl
    ? { translation: "الترجمة", transliteration: "النقحرة", definition: "التعريف", root: "الجذر" }
    : { translation: "Translation", transliteration: "Transliteration", definition: "Definition", root: "Root" };

  return (
    <Layout>
      <Container className="w-full !rounded-[48px] p-8 space-y-6">
        {/* Header: actions (using Button UI component) */}
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={playAudio}
            aria-label="Play pronunciation"
            title="Play pronunciation"
            className="w-9 h-9 p-0 rounded-full"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggle(bookmarkKey)}
            aria-label="Bookmark"
            className="w-9 h-9 p-0 rounded-full"
          >
            {isBookmarked(bookmarkKey) ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* The word — click to reveal. Centered before reveal; moves to start after. */}
        <button
          onClick={() => setRevealed((r) => !r)}
          className={`w-full block cursor-pointer select-none transition-all ${
            revealed ? "text-left" : "text-center"
          }`}
          aria-label="Reveal details"
        >
          <span
            className="font-arabic text-6xl md:text-7xl inline-block hover:text-emerald-600 transition-colors"
            dir="rtl"
          >
            {word.arabic}
          </span>
        </button>

        {revealed && (
          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {L.translation}
              </p>
              <p className="text-2xl font-semibold">{word.english}</p>
            </div>
            {word.transliteration && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {L.transliteration}
                </p>
                <p className="text-base italic">{word.transliteration}</p>
              </div>
            )}
            {word.definition && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {L.definition}
                </p>
                <p className="text-base leading-relaxed">{word.definition}</p>
              </div>
            )}
            {word.root && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {L.root}
                </p>
                <p className="text-base font-mono tracking-wider">{word.root}</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </Layout>
  );
}
