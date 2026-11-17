import React, { useEffect, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';
import { Song } from '../types/music';

interface Props {
  currentSong: Song | null;
  isPlaying: boolean;
}

export const AmbientBackground: React.FC<Props> = ({ currentSong, isPlaying }) => {
  const [ambientColors, setAmbientColors] = useState<{
    c1: string;
    c2: string;
    c3: string;
  }>({
    c1: 'rgba(99, 102, 241, 0.45)', // indigo
    c2: 'rgba(236, 72, 153, 0.35)', // pink
    c3: 'rgba(56, 189, 248, 0.30)', // sky
  });

  useEffect(() => {
    if (!currentSong?.thumbnail) return;

    const fac = new FastAverageColor();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentSong.thumbnail;

    img.onload = () => {
      try {
        const color = fac.getColor(img);
        const [r, g, b] = color.value;

        // Generate harmonic ambient palette
        const c1 = `rgba(${r}, ${g}, ${b}, 0.50)`;
        const c2 = `rgba(${(r + 60) % 255}, ${(g + 40) % 255}, ${b}, 0.40)`;
        const c3 = `rgba(${r}, ${(g + 80) % 255}, ${(b + 120) % 255}, 0.30)`;

        setAmbientColors({ c1, c2, c3 });
      } catch (e) {
        // keep fallback
      }
    };
  }, [currentSong?.thumbnail]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#08080d]">
      {/* Primary Ambient Liquid Blob */}
      <div
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 ${
          isPlaying ? 'scale-110 animate-pulse-slow' : 'scale-95 opacity-60'
        }`}
        style={{ background: ambientColors.c1 }}
      />

      {/* Secondary Ambient Liquid Blob */}
      <div
        className={`absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full blur-[140px] transition-all duration-1000 ${
          isPlaying ? 'scale-105 animate-pulse-slow' : 'scale-90 opacity-50'
        }`}
        style={{ background: ambientColors.c2 }}
      />

      {/* Tertiary Bottom Ambient Blob */}
      <div
        className={`absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full blur-[130px] transition-all duration-1000 ${
          isPlaying ? 'scale-110 opacity-75' : 'scale-95 opacity-40'
        }`}
        style={{ background: ambientColors.c3 }}
      />

      {/* Subtle Dark Vignette & Mesh Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090a10]/50 to-[#06070b]/90" />
    </div>
  );
};
