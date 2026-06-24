import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { 
  getSurahAudioUrl, 
  getPageAudioUrl, 
  getAyahAudioUrl,
  getSurahTimestamps,
  getAyahTimestamps
} from "Server/API/Quran";
import { useApp } from "Client/Context/App";

type PlaybackMode = 'surah' | 'page' | 'ayah';

interface AudioContextType {
  isPlaying: boolean;
  isLoading: boolean;
  currentSurah: number | null;
  currentPage: number | null;
  currentAyah: { surahId: number; ayahNumber: number } | null;
  currentTime: number;
  duration: number;
  progress: number;
  playbackMode: PlaybackMode;
  activeVerse: number | null;
  activeWord: number | null;
  playFullSurah: (surahNumber: number) => void;
  playPage: (pageNumber: number) => void;
  playAyah: (surahId: number, ayahNumber: number) => void;
  togglePlayPause: () => void;
  stop: () => void;
  seekTo: (progress: number) => void;
  setVolume: (volume: number) => void;
  repeatMode: 'none' | 'surah' | 'page' | 'ayah';
  setRepeatMode: (mode: 'none' | 'surah' | 'page' | 'ayah') => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const AppAudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const { selectedReciter } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [currentAyah, setCurrentAyah] = useState<{ surahId: number; ayahNumber: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'surah' | 'page' | 'ayah'>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('surah');
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [activeWord, setActiveWord] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackModeRef = useRef<PlaybackMode>('surah');
  const timestampsRef = useRef<Array<{ verse: number; word: number; start: number; end: number }> | null>(null);
  const ayahTimestampsRef = useRef<string[] | null>(null);

  // ── Load timestamps for surah/page mode ─────────────────────────────────────
  useEffect(() => {
    if (!currentSurah) {
      timestampsRef.current = null;
      setActiveVerse(null);
      setActiveWord(null);
      return;
    }
    
    getSurahTimestamps(currentSurah, selectedReciter).then((data) => {
      if (data) {
        const flatTimestamps: Array<{ verse: number; word: number; start: number; end: number }> = [];
        for (let v = 0; v < data.length; v++) {
          const words = data[v];
          for (let w = 0; w < words.length; w++) {
            const [start, end] = words[w].split("-").map(Number);
            flatTimestamps.push({
              verse: v + 1,
              word: w,
              start: start,
              end: end
            });
          }
        }
        timestampsRef.current = flatTimestamps;
      } else {
        timestampsRef.current = null;
      }
    });
  }, [currentSurah, selectedReciter]);

  // ── Load ayah timestamps when ayah changes (used for seeking, not for initial play) ──
  useEffect(() => {
    if (!currentAyah) {
      ayahTimestampsRef.current = null;
      return;
    }
    // Only load if not already set (to avoid double load after playAyah)
    if (!ayahTimestampsRef.current) {
      getAyahTimestamps(currentAyah.surahId, currentAyah.ayahNumber, selectedReciter).then((data) => {
        ayahTimestampsRef.current = data;
      });
    }
  }, [currentAyah, selectedReciter]);

  // ── Main audio element setup ────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const ct = audio.currentTime;
      setCurrentTime(ct);
      if (audio.duration) {
        setProgress((ct / audio.duration) * 100);
      }

      if (playbackMode === 'surah' || playbackMode === 'page') {
        const ts = timestampsRef.current;
        if (ts && ts.length > 0) {
          const ms = ct * 1000;
          let foundVerse = null;
          let foundWord = null;
          for (let i = 0; i < ts.length; i++) {
            const item = ts[i];
            if (ms >= item.start && ms < item.end) {
              foundVerse = item.verse;
              foundWord = item.word;
              break;
            }
          }
          setActiveVerse(foundVerse);
          setActiveWord(foundWord);
        }
      } else if (playbackMode === 'ayah') {
        const ts = ayahTimestampsRef.current;
        if (ts && ts.length > 0) {
          const ms = ct * 1000;
          let foundWord = null;
          for (let i = 0; i < ts.length; i++) {
            const [start, end] = ts[i].split("-").map(Number);
            if (ms >= start && ms < end) {
              foundWord = i;
              break;
            }
          }
          setActiveVerse(currentAyah?.ayahNumber ?? null);
          setActiveWord(foundWord);
        }
      } else {
        setActiveVerse(null);
        setActiveWord(null);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [playbackMode, currentAyah]);

  const loadAndPlay = useCallback(async (src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoading(true);
    setActiveVerse(null);
    setActiveWord(null);
    audio.src = src;
    audio.playbackRate = playbackSpeed;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
    }
  }, [playbackSpeed]);

  const handleAudioEnded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldRepeat =
      (playbackModeRef.current === 'surah' && repeatMode === 'surah') ||
      (playbackModeRef.current === 'page' && repeatMode === 'page') ||
      (playbackModeRef.current === 'ayah' && repeatMode === 'ayah');

    if (shouldRepeat) {
      audio.currentTime = 0;
      audio.play();
    } else {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setActiveVerse(null);
      setActiveWord(null);
    }
  }, [repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('ended', handleAudioEnded);
    return () => audio.removeEventListener('ended', handleAudioEnded);
  }, [handleAudioEnded]);

  // ── Play Full Surah ─────────────────────────────────────────────────────────
  const playFullSurah = useCallback(async (surahNumber: number) => {
    playbackModeRef.current = 'surah';
    setPlaybackMode('surah');
    setCurrentPage(null);
    setCurrentAyah(null);
    setCurrentSurah(surahNumber);
    const url = await getSurahAudioUrl(surahNumber, selectedReciter);
    if (!url) {
      console.error(`No audio found for surah ${surahNumber} reciter ${selectedReciter}`);
      setIsLoading(false);
      return;
    }

    // For surahs other than Al-Fatihah (1) and At-Tawbah (9), prepend the reciter's
    // Basmallah (Surah 1, Ayah 1) before starting the surah audio.
    const needsBasmallah = surahNumber !== 1 && surahNumber !== 9;
    if (needsBasmallah) {
      try {
        const basmallahUrl = await getAyahAudioUrl(1, 1, selectedReciter);
        if (basmallahUrl) {
          setIsLoading(true);
          await new Promise<void>((resolve) => {
            const pre = new Audio(basmallahUrl);
            pre.playbackRate = playbackSpeed;
            const done = () => { pre.removeEventListener('ended', done); pre.removeEventListener('error', done); resolve(); };
            pre.addEventListener('ended', done);
            pre.addEventListener('error', done);
            pre.play().catch(done);
          });
        }
      } catch (e) {
        console.warn('Basmallah pre-play failed', e);
      }
    }

    loadAndPlay(url);
  }, [loadAndPlay, selectedReciter, playbackSpeed]);

  // ── Play Page ───────────────────────────────────────────────────────────────
  const playPage = useCallback(async (pageNumber: number) => {
    playbackModeRef.current = 'page';
    setPlaybackMode('page');
    setCurrentSurah(null);
    setCurrentAyah(null);
    setCurrentPage(pageNumber);
    const url = await getPageAudioUrl(pageNumber, selectedReciter);
    if (url) {
      loadAndPlay(url);
    } else {
      console.error(`No audio found for page ${pageNumber} reciter ${selectedReciter}`);
      setIsLoading(false);
    }
  }, [loadAndPlay, selectedReciter]);

  // ── Play Ayah – load timestamps FIRST, then play ────────────────────────────
  const playAyah = useCallback(async (surahId: number, ayahNumber: number) => {
    // Load ayah timestamps before starting playback
    const timestamps = await getAyahTimestamps(surahId, ayahNumber, selectedReciter);
    if (timestamps) {
      ayahTimestampsRef.current = timestamps;
    } else {
      ayahTimestampsRef.current = null;
    }

    playbackModeRef.current = 'ayah';
    setPlaybackMode('ayah');
    setCurrentSurah(null);
    setCurrentPage(null);
    setCurrentAyah({ surahId, ayahNumber });

    const url = await getAyahAudioUrl(surahId, ayahNumber, selectedReciter);
    if (url) {
      loadAndPlay(url);
    } else {
      console.error(`No audio found for ayah ${surahId}:${ayahNumber} reciter ${selectedReciter}`);
      setIsLoading(false);
    }
  }, [loadAndPlay, selectedReciter]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    setIsPlaying(false);
    setCurrentSurah(null);
    setCurrentPage(null);
    setCurrentAyah(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setActiveVerse(null);
    setActiveWord(null);
    timestampsRef.current = null;
    ayahTimestampsRef.current = null;
  }, []);

  const seekTo = useCallback((newProgress: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (newProgress / 100) * audio.duration;
      setProgress(newProgress);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const contextValue = useMemo(() => ({
    isPlaying,
    isLoading,
    currentSurah,
    currentPage,
    currentAyah,
    currentTime,
    duration,
    progress,
    playbackMode,
    activeVerse,
    activeWord,
    playFullSurah,
    playPage,
    playAyah,
    togglePlayPause,
    stop,
    seekTo,
    setVolume,
    repeatMode,
    setRepeatMode,
    playbackSpeed,
    setPlaybackSpeed,
  }), [
    isPlaying, isLoading, currentSurah, currentPage, currentAyah,
    currentTime, duration, progress, playbackMode,
    activeVerse, activeWord,
    playFullSurah, playPage, playAyah, togglePlayPause, stop,
    seekTo, setVolume, repeatMode, playbackSpeed,
  ]);

  return (
    <AppAudioContext.Provider value={contextValue}>
      {children}
    </AppAudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AppAudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}