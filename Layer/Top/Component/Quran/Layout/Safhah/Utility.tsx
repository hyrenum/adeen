// Layer/Top/Component/Quran/Layout/Safhah/Utility.tsx
import React, { useRef } from "react";
import { getWordAudioUrl, getAyahAudioUrl } from "@/Bottom/API/Quran";
import { useApp } from "@/Middle/Context/App";
import { Tooltip } from "@/Top/Component/UI/Tooltip";
import type { WordTooltipProps } from "./Types";

export function WordTooltip({ 
  translation,
  transliteration,
  enabled, 
  onClick, 
  onMouseEnter, 
  onMouseLeave, 
  children 
}: WordTooltipProps) {
  let tooltipContent: React.ReactNode = null;
  
  if (translation && transliteration) {
    // Both exist - Translation above (black), Transliteration below (grey)
    tooltipContent = (
      <div className="space-y-0.5">
        <div className="text-black dark:text-white text-sm">
          {translation}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-xs">
          {transliteration}
        </div>
      </div>
    );
  } else if (translation) {
    // Only translation
    tooltipContent = (
      <div className="text-black dark:text-white text-sm">
        {translation}
      </div>
    );
  } else if (transliteration) {
    // Only transliteration
    tooltipContent = (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        {transliteration}
      </div>
    );
  }
  
  return (
    <Tooltip 
      content={tooltipContent} 
      enabled={enabled && !!tooltipContent} 
      side="top" 
      offset={48}  // Increased from 32 to 48 for even higher position
    >
      <span
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ display: "inline" }}
      >
        {children}
      </span>
    </Tooltip>
  );
}

export function useAudioPlayback(surahId: number) {
  const { hoverRecitation, selectedReciter } = useApp();
  const [playingKey, setPlayingKey] = React.useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = (url: string, key: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { audioRef.current = null; setPlayingKey(null); };
    audio.onerror = () => { audioRef.current = null; setPlayingKey(null); };
    audio.play().catch(() => { audioRef.current = null; setPlayingKey(null); });
  };

  const playWordAudio = async (verseNumber: number, wordIndex: number) => {
    if (!hoverRecitation) return;
    const key = `word-${verseNumber}-${wordIndex}`;
    if (playingKey === key) return;
    setPlayingKey(key);

    const wordUrl = await getWordAudioUrl(surahId, verseNumber, wordIndex + 1);
    if (wordUrl) {
      playAudio(wordUrl, key);
    } else {
      const ayahUrl = await getAyahAudioUrl(surahId, verseNumber, selectedReciter);
      if (ayahUrl) playAudio(ayahUrl, key);
      else setPlayingKey(null);
    }
  };

  const playVerseAudio = async (verseNumber: number) => {
    const key = `ayah-${verseNumber}`;
    if (playingKey === key) return;
    setPlayingKey(key);

    const ayahUrl = await getAyahAudioUrl(surahId, verseNumber, selectedReciter);
    if (ayahUrl) playAudio(ayahUrl, key);
    else setPlayingKey(null);
  };

  const isPlaying = (key: string) => playingKey === key;

  return { playingKey, playWordAudio, playVerseAudio, isPlaying };
}

export const extractVerseNumberFromMarker = (glyph: string): number | null => {
  if (!glyph) return null;
  if (glyph.includes(':')) {
    const parts = glyph.split(':');
    const maybeVerse = parts[0];
    const num = parseInt(maybeVerse, 10);
    return isNaN(num) ? null : num;
  }
  const num = parseInt(glyph, 10);
  return isNaN(num) ? null : num;
}