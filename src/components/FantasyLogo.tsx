import React from 'react';

interface Props {
  className?: string;
  collapsed?: boolean;
}

export const FantasyLogo: React.FC<Props> = ({ className = '', collapsed = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 4-Pointed Celestial Radiant Star */}
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none">
          {/* Outer Diagonal Sparkles */}
          <path d="M50 32 L53 47 L68 50 L53 53 L50 68 L47 53 L32 50 L47 47 Z" fill="#9dbef5" opacity="0.8" />
          {/* Main 4-Pointed Radiant Compass Star */}
          <path
            d="M50 8 C50 35 35 50 8 50 C35 50 50 65 50 92 C50 65 65 50 92 50 C65 50 50 35 50 8 Z"
            className="fill-[#1e3262] dark:fill-[#79a9ff]"
          />
          {/* Inner Light Core */}
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-black text-base tracking-wider text-[#16254c] dark:text-white leading-none">
            PAPABVTIFY
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-[#697fa6] dark:text-[#9bb8f7] uppercase mt-1">
            Music Without Limits
          </span>
        </div>
      )}
    </div>
  );
};
