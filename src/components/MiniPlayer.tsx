import React from 'react';
import { Song, LyricsData } from '../types/music';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Music2 } from 'lucide-react';

interface Props {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMaximize: () => void;
  lyricsData: LyricsData | null;
  currentTime: number;
}

export const MiniPlayer: React.FC<Props> = ({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onMaximize,
  lyricsData,
  currentTime
}) => {
  if (!currentSong) return null;

  // Find active lyric line
  const activeLine = lyricsData?.lines?.slice().reverse().find(l => currentTime >= l.time);

  return (
    <div className="fixed bottom-6 right-6 w-80 rounded-3xl liquid-glass p-4 shadow-2xl border border-white/20 z-50 animate-float space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 truncate">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-12 h-12 rounded-xl object-cover shadow-md"
          />
          <div className="truncate">
            <h4 className="text-xs font-bold text-white truncate">{currentSong.title}</h4>
            <p className="text-[10px] text-white/50 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <button
          onClick={onMaximize}
          title="Kembali ke Layar Penuh"
          className="p-2 text-white/60 hover:text-white transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Active Lyric Line */}
      <div className="h-6 flex items-center justify-center text-center px-2">
        <p className="text-[11px] font-semibold text-indigo-300 truncate animate-pulse">
          {activeLine ? activeLine.text : '♪ ♪ ♪'}
        </p>
      </div>

      {/* Mini Controls */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <button onClick={onPrev} className="text-white/70 hover:text-white transition">
          <SkipBack className="w-4 h-4 fill-current" />
        </button>
        <button
          onClick={onPlayPause}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
        <button onClick={onNext} className="text-white/70 hover:text-white transition">
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
