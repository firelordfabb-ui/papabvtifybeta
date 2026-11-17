import React from 'react';

interface Props {
  className?: string;
}

export const AuroraBackground: React.FC<Props> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 hidden dark:block select-none ${className}`}>
      {/* Base Deep Midnight Veil */}
      <div className="absolute inset-0 bg-[#070B18]" />

      {/* Optimized Multi-Stop Aurora Mesh Gradient (Zero Rasterization Overhead, 0% CPU) */}
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(66, 221, 170, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 25%, rgba(146, 117, 232, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(49, 91, 206, 0.16) 0%, transparent 60%)
          `
        }}
      />

      {/* Subtle Star Sparkles in Sky (Hardware accelerated pattern) */}
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#EAF0FF_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />
    </div>
  );
};
