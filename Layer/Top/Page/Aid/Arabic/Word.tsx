import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/Top/Component/Layout/Index";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { getArabicWord } from "@/Bottom/API/Arabic";
import { useArabicBookmarks } from "@/Middle/Hook/Use-Arabic-Bookmarks";
import { Bookmark, BookmarkCheck, Volume2 } from "lucide-react";

type Stage = 0 | 1 | 2; // 0 = arabic only, 1 = + translation/transliteration, 2 = + details

export default function ArabicWordPage() {
  const { categoryId, subId, wordId } = useParams<{
    categoryId: string;
    subId: string;
    wordId: string;
  }>();
  const word = getArabicWord(categoryId || "", subId || "", wordId || "");
  const bookmarkKey = `${categoryId}/${subId}/${wordId}`;
  const { isBookmarked, toggle } = useArabicBookmarks();
  const [stage, setStage] = useState<Stage>(0);

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

  const advance = () => setStage((s) => (s < 2 ? ((s + 1) as Stage) : 0));

  return (
    <Layout>
      <Container className="w-full !rounded-[48px] p-8 space-y-6">
        {/* Header: actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={playAudio}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Play pronunciation"
            title="Play pronunciation"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => toggle(bookmarkKey)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Bookmark"
          >
            {isBookmarked(bookmarkKey) ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Tap to reveal */}
        <button
          onClick={advance}
          className="w-full text-left space-y-6 cursor-pointer select-none"
          aria-label="Reveal next"
        >
          <div className="text-center py-2">
            <div
              className="font-arabic text-6xl md:text-7xl hover:text-emerald-600 transition-colors"
              dir="rtl"
            >
              {word.arabic}
            </div>
          </div>

          {stage >= 1 && (
            <div className="border-t border-border pt-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Translation
                </p>
                <p className="text-2xl font-semibold">{word.english}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Transliteration
                </p>
                <p className="text-base italic">{word.transliteration}</p>
              </div>
            </div>
          )}

          {stage >= 2 && (
            <div className="border-t border-border pt-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Definition
                </p>
                <p className="text-base leading-relaxed">{word.definition}</p>
              </div>
              {word.root && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Root
                  </p>
                  <p className="text-base font-mono tracking-wider">{word.root}</p>
                </div>
              )}
              {word.diminutive && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Diminutive
                  </p>
                  <p className="font-arabic text-2xl" dir="rtl">
                    {word.diminutive}
                  </p>
                </div>
              )}
            </div>
          )}

          {stage === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Tap to reveal the translation
            </p>
          )}
        </button>
      </Container>
    </Layout>
  );
}
