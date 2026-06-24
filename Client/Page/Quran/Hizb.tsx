import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { getHizbSegments, surahList } from "Server/API/Quran";
import { Layout } from "Client/Component/Layout/Index";
import { AlertCircle, Play, Pause, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "Client/Component/UI/Alert";
import { Container } from "Client/Component/UI/Container";
import { Button } from "Client/Component/UI/Button";
import { SegmentRenderer } from "Client/Component/Quran/Segment-Renderer";
import { AudioPlayer } from "Client/Component/Audio-Player/Index";
import { useAudio } from "Client/Context/Audio";

export default function Hizb() {
  const { id: hizbParam } = useParams<{ id: string }>();
  const hizbNumber = parseInt(hizbParam || "1");

  const hizbSegments = useMemo(() => getHizbSegments(hizbNumber), [hizbNumber]);

  const { isPlaying, isLoading, playAyah, togglePlayPause, stop } = useAudio();
  const [showAudio, setShowAudio] = useState(false);

  const handlePlay = () => {
    if (!hizbSegments || !hizbSegments[0]) return;
    setShowAudio(true);
    if (isPlaying) {
      togglePlayPause();
    } else {
      const first = hizbSegments[0];
      playAyah(first.surah, first.startVerse);
    }
  };

  if (!hizbSegments) {
    return (
      <Layout hideFooter>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Hizb {hizbNumber}. Please try again later.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const firstSurahName =
    surahList.find((s) => s.id === hizbSegments[0]?.surah)?.englishName ?? "";

  return (
    <Layout hideFooter>
      <div className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Container className="!px-6 !py-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Hizb {hizbNumber}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Juz {Math.ceil(hizbNumber / 2)} • Part {hizbNumber % 2 === 1 ? "1" : "2"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handlePlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause Hizb" : "Play Hizb"}
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
        <SegmentRenderer segments={hizbSegments} />
      </div>

      <AudioPlayer
        isVisible={showAudio}
        onClose={() => {
          stop();
          setShowAudio(false);
        }}
        surahId={hizbSegments[0]?.surah}
        surahName={firstSurahName}
      />
    </Layout>
  );
}
