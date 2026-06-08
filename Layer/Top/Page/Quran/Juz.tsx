import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { getJuzSegments, surahList } from "@/Bottom/API/Quran";
import { Layout } from "@/Top/Component/Layout/Index";
import { AlertCircle, Play, Pause, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/Top/Component/UI/Alert";
import { Container } from "@/Top/Component/UI/Container";
import { Button } from "@/Top/Component/UI/Button";
import { SegmentRenderer } from "@/Top/Component/Quran/Segment-Renderer";
import { AudioPlayer } from "@/Top/Component/Audio-Player/Index";
import { useAudio } from "@/Middle/Context/Audio";

export default function Juz() {
  const { id: juzParam } = useParams<{ id: string }>();
  const juzNumber = parseInt(juzParam || "1");

  const juzSegments = useMemo(() => getJuzSegments(juzNumber), [juzNumber]);

  const { isPlaying, isLoading, playAyah, togglePlayPause, stop } = useAudio();
  const [showAudio, setShowAudio] = useState(false);

  const handlePlay = () => {
    if (!juzSegments || !juzSegments[0]) return;
    setShowAudio(true);
    if (isPlaying) {
      togglePlayPause();
    } else {
      const first = juzSegments[0];
      playAyah(first.surah, first.startVerse);
    }
  };

  if (!juzSegments) {
    return (
      <Layout hideFooter>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Juz {juzNumber}. Please try again later.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const firstSurahName =
    surahList.find((s) => s.id === juzSegments[0]?.surah)?.englishName ?? "";

  return (
    <Layout hideFooter>
      <div className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Container className="!px-6 !py-4 mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Juz {juzNumber}</h1>
          <Button
            size="sm"
            onClick={handlePlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause Juz" : "Play Juz"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </Container>
        <SegmentRenderer segments={juzSegments} />
      </div>

      <AudioPlayer
        isVisible={showAudio}
        onClose={() => {
          stop();
          setShowAudio(false);
        }}
        surahId={juzSegments[0]?.surah}
        surahName={firstSurahName}
      />
    </Layout>
  );
}
