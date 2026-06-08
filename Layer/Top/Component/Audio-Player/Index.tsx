import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { useAudio } from "@/Middle/Context/Audio";
import {
  surahList,
  getJuzSegments,
  getHizbSegments,
} from "@/Bottom/API/Quran";
import { AudioPlayerMain } from "./Main";
import type { AudioPlayerProps, SettingsMenu } from "./Types";

export const AudioPlayer = memo(function AudioPlayer({
  isVisible,
  onClose,
  surahId,
  surahName,
}: AudioPlayerProps) {
  const {
    isPlaying,
    isLoading,
    currentSurah,
    currentPage,
    currentTime,
    duration,
    progress,
    togglePlayPause,
    stop,
    seekTo,
    setVolume,
    repeatMode,
    setRepeatMode,
    playbackSpeed,
    setPlaybackSpeed,
    playbackMode,
    playFullSurah,
    playAyah,
  } = useAudio();

  const [volume, setLocalVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenu>("main");

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolume(isMuted ? 0 : newVolume);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setVolume(isMuted ? volume : 0);
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const resolvedSurahId = currentSurah ?? surahId;
  const currentSurahData = resolvedSurahId
    ? surahList.find((s) => s.id === resolvedSurahId)
    : null;

  const trackTitle = currentSurahData
    ? currentSurahData.englishName
    : surahName ?? (currentPage ? `Page ${currentPage}` : null);

  const handleSelectJuz = (juz: number) => {
    const segs = getJuzSegments(juz);
    if (segs && segs[0]) playAyah(segs[0].surah, segs[0].startVerse);
  };

  const handleSelectHizb = (hizb: number) => {
    const segs = getHizbSegments(hizb);
    if (segs && segs[0]) playAyah(segs[0].surah, segs[0].startVerse);
  };

  if (!isVisible) return null;

  return createPortal(
    <AudioPlayerMain
      isPlaying={isPlaying}
      isLoading={isLoading}
      progress={progress}
      currentTime={currentTime}
      duration={duration}
      trackTitle={trackTitle}
      repeatMode={repeatMode}
      playbackSpeed={playbackSpeed}
      playbackMode={playbackMode}
      volume={volume}
      isMuted={isMuted}
      settingsOpen={settingsOpen}
      settingsMenu={settingsMenu}
      onTogglePlayPause={togglePlayPause}
      onSeek={handleSeek}
      onVolumeChange={handleVolumeChange}
      onToggleMute={toggleMute}
      onSettingsOpenChange={setSettingsOpen}
      onSettingsMenuChange={setSettingsMenu}
      onRepeatModeChange={setRepeatMode}
      onPlaybackSpeedChange={setPlaybackSpeed}
      onClose={handleClose}
      currentSurahId={resolvedSurahId ?? undefined}
      onSelectSurah={(id) => playFullSurah(id)}
      onSelectAyah={(s, a) => playAyah(s, a)}
      onSelectJuz={handleSelectJuz}
      onSelectHizb={handleSelectHizb}
    />,
    document.body
  );
});
