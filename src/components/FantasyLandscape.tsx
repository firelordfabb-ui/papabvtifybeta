import React from 'react';

interface Props {
  className?: string;
}

export const FantasyLandscape: React.FC<Props> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Radiant Floating Stars / Sparkles */}
      <div className="absolute top-6 left-12 text-[#9bb8f7] text-sm animate-pulse opacity-75">✦</div>
      <div className="absolute top-16 left-32 text-[#b5cbfb] text-xs animate-ping opacity-60" style={{ animationDuration: '4s' }}>★</div>
      <div className="absolute top-8 right-44 text-[#a3c0f9] text-base animate-pulse opacity-80" style={{ animationDuration: '3.2s' }}>✦</div>
      <div className="absolute top-28 right-24 text-[#89aef7] text-xs animate-pulse opacity-70" style={{ animationDuration: '2.8s' }}>✧</div>

      <svg
        viewBox="0 0 720 380"
        className="w-full h-full object-cover"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Sky Gradient */}
          <linearGradient id="fantasySkyGrad" x1="360" y1="0" x2="360" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dce8fc" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#e8effd" stopOpacity="0.6" />
            <stop offset="85%" stopColor="#f3f7fe" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f8fbff" stopOpacity="1" />
          </linearGradient>

          {/* Stargate Ancient Celestial Ring */}
          <linearGradient id="stargateGrad" x1="450" y1="40" x2="570" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c5daf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a7c4f4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#87aceb" stopOpacity="0.6" />
          </linearGradient>

          {/* Floating Citadel / Spire Gradients */}
          <linearGradient id="castleStone" x1="480" y1="60" x2="580" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#cbdcf7" />
            <stop offset="50%" stopColor="#adc7ef" />
            <stop offset="100%" stopColor="#87a7df" />
          </linearGradient>

          <linearGradient id="cliffRock" x1="400" y1="180" x2="600" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a4c2f1" />
            <stop offset="40%" stopColor="#86a9e6" />
            <stop offset="100%" stopColor="#678fd3" />
          </linearGradient>

          <linearGradient id="cloudFluff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e1ecfc" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Soft Background Fill - Transparent to blend seamlessly in both Light and Dark Aurora themes */}
        <rect width="720" height="380" fill="transparent" />

        {/* Floating Distant Sky Islands */}
        <ellipse cx="260" cy="115" rx="35" ry="12" fill="#c4d8f8" opacity="0.65" />
        <path d="M225 115 Q260 145 295 115 Z" fill="#9dbef0" opacity="0.6" />

        <ellipse cx="640" cy="130" rx="42" ry="14" fill="#c0d5f6" opacity="0.7" />
        <path d="M598 130 Q640 162 682 130 Z" fill="#98baee" opacity="0.65" />

        {/* Majestic Celestial Ancient Ring / Stargate */}
        <ellipse cx="505" cy="110" rx="65" ry="65" stroke="url(#stargateGrad)" strokeWidth="16" fill="none" opacity="0.75" />
        <ellipse cx="505" cy="110" rx="72" ry="72" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 8" fill="none" opacity="0.6" />

        {/* Sun Glow Behind the Citadel */}
        <circle cx="505" cy="110" r="48" fill="#ffffff" opacity="0.5" filter="blur(8px)" />

        {/* Distant Castle Towers & Spires */}
        <g opacity="0.85">
          {/* Far Left Spire */}
          <polygon points="430,170 436,80 442,170" fill="url(#castleStone)" />
          <rect x="432" y="150" width="8" height="50" fill="url(#castleStone)" />

          {/* Central Main Spire */}
          <polygon points="496,160 504,50 512,160" fill="url(#castleStone)" />
          <rect x="498" y="120" width="12" height="70" fill="url(#castleStone)" />
          {/* Main Dome Arch */}
          <path d="M480 180 Q504 140 528 180 Z" fill="#b9d2f6" />

          {/* Majestic Arch Bridges */}
          <path d="M450 185 Q475 165 500 185" stroke="#9bbdf0" strokeWidth="6" fill="none" />
          <path d="M508 185 Q535 165 560 185" stroke="#9bbdf0" strokeWidth="6" fill="none" />

          {/* Right Spires */}
          <polygon points="545,170 551,75 557,170" fill="url(#castleStone)" />
          <rect x="546" y="140" width="10" height="55" fill="url(#castleStone)" />

          <polygon points="585,190 590,105 595,190" fill="url(#castleStone)" />
          <rect x="586" y="160" width="8" height="40" fill="url(#castleStone)" />
        </g>

        {/* Massive Cliff & Plateaus (Floating Island Base) */}
        <path
          d="M380 230 C410 200 480 205 520 200 C580 195 620 215 650 240 L640 330 C600 360 480 370 420 340 Z"
          fill="url(#cliffRock)"
          opacity="0.9"
        />

        {/* Cliff Shading & Waterfall / Rock Lines */}
        <path d="M450 210 L440 310" stroke="#5b83cb" strokeWidth="2.5" opacity="0.6" />
        <path d="M510 205 L500 320" stroke="#5b83cb" strokeWidth="3" opacity="0.6" />
        <path d="M560 215 L555 330" stroke="#5b83cb" strokeWidth="2" opacity="0.6" />

        {/* Lush Greenery Layer on Cliff Top */}
        <path
          d="M390 220 C420 205 460 210 500 205 C540 200 580 208 630 225 C600 235 500 230 390 220 Z"
          fill="#86b488"
          opacity="0.8"
        />

        {/* Fluffy Anime Clouds Floating at Bottom / Horizon */}
        <path
          d="M0 380 Q90 320 220 340 Q350 360 480 330 Q600 310 720 350 L720 380 Z"
          fill="url(#cloudFluff)"
          opacity="0.25"
        />
      </svg>
    </div>
  );
};
