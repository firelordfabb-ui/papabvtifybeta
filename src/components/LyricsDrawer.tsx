import React, { useEffect, useRef } from 'react';
import { LyricsData } from '../types/music';
import { Sparkles, FastForward, Rewind, X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lyricsData: LyricsData | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
  songTitle?: string;
  songArtist?: string;
}

export const LyricsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  lyricsData,
  currentTime,
  onSeek,
  offset,
  setOffset,
  songTitle,
  songArtist
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const adjustedTime = currentTime + offset;

  // Find active line index
  let activeIndex = -1;
  if (lyricsData?.lines && lyricsData.lines.length > 0) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (adjustedTime >= lyricsData.lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth auto-scroll
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 glass-dock border-l flex flex-col shadow-2xl backdrop-blur-3xl p-6 select-none animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate max-w-[240px]">
            <h3 className="text-xs font-extrabold text-white truncate">
              {songTitle || 'Lirik Lagu'}
            </h3>
            <p className="text-[10px] text-white/40 truncate">
              {songArtist} • {lyricsData?.source || 'LRCLIB Synced'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offset calibration buttons */}
          <button
            onClick={() => setOffset(prev => prev - 0.2)}
            title="Lirik lebih lambat (-0.2s)"
            className="p-1 rounded-lg glass-pill text-[10px] text-white/70 hover:text-white flex items-center gap-0.5"
          >
            <Rewind className="w-3 h-3" />
            <span>-0.2s</span>
          </button>
          <span className="text-[10px] font-mono text-white/50 min-w-8 text-center">
            {offset >= 0 ? `+${offset.toFixed(1)}s` : `${offset.toFixed(1)}s`}
          </span>
          <button
            onClick={() => setOffset(prev => prev + 0.2)}
            title="Lirik lebih cepat (+0.2s)"
            className="p-1 rounded-lg glass-pill text-[10px] text-white/70 hover:text-white flex items-center gap-0.5"
          >
            <span>+0.2s</span>
            <FastForward className="w-3 h-3" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lyrics Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-16 px-4 space-y-9 scroll-smooth text-center select-none"
      >
        {!lyricsData || lyricsData.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-xs">Lirik sedang disinkronkan atau tidak tersedia.</p>
          </div>
        ) : (
          lyricsData.lines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPassed = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`cursor-pointer transition-all duration-300 transform ${
                  isActive
                    ? 'text-white font-black text-2xl md:text-3xl scale-105 opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]'
                    : isPassed
                    ? 'text-white/35 text-lg md:text-xl font-medium'
                    : 'text-white/20 text-lg md:text-xl font-medium hover:text-white/40'
                }`}
              >
                {/* Word by word karaoke swipe highlight */}
                {line.words && line.words.length > 0 ? (
                  <div className="inline-flex flex-wrap justify-center gap-x-2">
                    {line.words.map((word, wIdx) => {
                      const wordPassed = adjustedTime >= word.endTime;
                      const wordActive = adjustedTime >= word.startTime && adjustedTime < word.endTime;
                      const wordProgress = wordActive 
                        ? Math.min(100, Math.max(0, ((adjustedTime - word.startTime) / (word.endTime - word.startTime)) * 100))
                        : wordPassed ? 100 : 0;

                      return (
                        <span
                          key={wIdx}
                          className="karaoke-word"
                          style={{ '--progress': `${wordProgress}%` } as React.CSSProperties}
                        >
                          {word.text}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span>{line.text}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
