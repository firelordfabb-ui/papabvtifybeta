import React, { useEffect, useRef, useState } from 'react';
import { LyricsData, LyricLine } from '../types/music';
import { FastForward, Rewind, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  lyricsData: LyricsData | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
}

export const LyricsView: React.FC<Props> = ({
  lyricsData,
  currentTime,
  onSeek,
  offset,
  setOffset
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

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

  // Auto-scroll to active line smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  return (
    <div className="relative h-full flex flex-col liquid-glass rounded-3xl p-6 overflow-hidden">
      {/* Top Header bar with offset controls and source badge */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{lyricsData?.source || 'Menghubungkan lirik...'}</span>
        </div>

        {/* Sync Offset Calibration Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(prev => prev - 0.2)}
            title="Lirik lebih lambat (-0.2s)"
            className="p-1.5 rounded-lg liquid-glass-pill hover:text-indigo-400 text-xs flex items-center gap-1"
          >
            <Rewind className="w-3.5 h-3.5" />
            <span>-0.2s</span>
          </button>
          <span className="text-xs font-mono text-white/60 min-w-12 text-center">
            {offset >= 0 ? `+${offset.toFixed(1)}s` : `${offset.toFixed(1)}s`}
          </span>
          <button
            onClick={() => setOffset(prev => prev + 0.2)}
            title="Lirik lebih cepat (+0.2s)"
            className="p-1.5 rounded-lg liquid-glass-pill hover:text-indigo-400 text-xs flex items-center gap-1"
          >
            <span>+0.2s</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lyrics Scrollable Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-12 px-4 space-y-8 scroll-smooth select-none text-center"
      >
        {!lyricsData || lyricsData.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">Lirik tidak tersedia atau sedang dimuat...</p>
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
                    ? 'text-white font-bold text-2xl md:text-3xl scale-105 opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    : isPassed
                    ? 'text-white/40 text-lg md:text-xl font-medium'
                    : 'text-white/20 text-lg md:text-xl font-medium hover:text-white/50'
                }`}
              >
                {/* Word-by-word swipe sync or line */}
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
