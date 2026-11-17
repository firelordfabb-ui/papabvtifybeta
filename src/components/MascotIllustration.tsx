import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export const MascotIllustration: React.FC<Props> = ({ className = '', size = 160 }) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`} style={{ width: size, height: size * 1.05 }}>
      {/* Floating Animated Musical Notes */}
      <div className="absolute -top-1 -left-1 text-[#7896db] text-xs font-bold animate-bounce opacity-80" style={{ animationDuration: '3s' }}>
        ♪
      </div>
      <div className="absolute top-2 -right-1 text-[#8b9fe6] text-sm font-bold animate-pulse opacity-85" style={{ animationDuration: '2.4s' }}>
        ♫
      </div>
      <div className="absolute top-10 -right-3 text-[#6484d4] text-[11px] font-bold animate-bounce opacity-70" style={{ animationDuration: '3.6s' }}>
        ♩
      </div>

      <svg
        viewBox="0 0 200 210"
        className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="100" y1="40" x2="100" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#edf3fd" />
            <stop offset="100%" stopColor="#dce8fa" />
          </linearGradient>

          <linearGradient id="earInnerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4e2fa" />
            <stop offset="100%" stopColor="#b4cbf5" />
          </linearGradient>

          <linearGradient id="scarfGrad" x1="50" y1="120" x2="150" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#35497c" />
            <stop offset="50%" stopColor="#253765" />
            <stop offset="100%" stopColor="#1a274a" />
          </linearGradient>

          <linearGradient id="scarfKnotGrad" x1="100" y1="135" x2="135" y2="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#435b96" />
            <stop offset="100%" stopColor="#22325c" />
          </linearGradient>

          <linearGradient id="cloudBase" x1="20" y1="185" x2="180" y2="205" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e3edfc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c7dbf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Soft Hill / Cloud Base Cushion */}
        <path
          d="M25 190 Q100 170 175 190 Q185 205 100 205 Q15 205 25 190 Z"
          fill="url(#cloudBase)"
        />

        {/* Left Ear Outer */}
        <path
          d="M52 82 C42 55 45 28 58 20 C70 15 88 40 92 68 Z"
          fill="#eaf1fc"
          stroke="#415a92"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Left Ear Inner */}
        <path
          d="M58 72 C50 50 54 34 62 28 C70 24 78 44 82 62 Z"
          fill="url(#earInnerGrad)"
        />

        {/* Right Ear Outer */}
        <path
          d="M148 82 C158 55 155 28 142 20 C130 15 112 40 108 68 Z"
          fill="#eaf1fc"
          stroke="#415a92"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Right Ear Inner */}
        <path
          d="M142 72 C150 50 146 34 138 28 C130 24 122 44 118 62 Z"
          fill="url(#earInnerGrad)"
        />

        {/* Cute Fluffy Cheeks & Head Base */}
        <path
          d="M55 95 C40 110 40 130 62 138 C75 142 125 142 138 138 C160 130 160 110 145 95 C150 75 140 55 100 55 C60 55 50 75 55 95 Z"
          fill="url(#bodyGrad)"
          stroke="#3d558b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Hair Tuft on Forehead */}
        <path
          d="M93 58 C96 48 104 48 107 58 C112 50 120 53 115 63"
          stroke="#3d558b"
          strokeWidth="3"
          strokeLinecap="round"
          fill="#ffffff"
        />

        {/* Sweet Smiling Left Eye */}
        <path
          d="M74 96 Q83 90 92 96"
          stroke="#263967"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Left Eyelash Accent */}
        <path
          d="M93 94 L97 91"
          stroke="#263967"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Sweet Smiling Right Eye */}
        <path
          d="M108 96 Q117 90 126 96"
          stroke="#263967"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Right Eyelash Accent */}
        <path
          d="M107 94 L103 91"
          stroke="#263967"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Cute Soft Pink Blushes */}
        <ellipse cx="68" cy="106" rx="9" ry="5.5" fill="#fbb6ce" opacity="0.75" />
        <ellipse cx="132" cy="106" rx="9" ry="5.5" fill="#fbb6ce" opacity="0.75" />

        {/* Tiny Nose */}
        <path
          d="M98 104 L102 104 L100 107 Z"
          fill="#354b7f"
        />

        {/* Smiling Cat Mouth */}
        <path
          d="M94 109 Q97 113 100 109 Q103 113 106 109"
          stroke="#2d4274"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Cosy Knitted Winter Scarf Around Neck */}
        <path
          d="M52 135 C50 128 70 122 100 122 C130 122 150 128 148 135 C146 148 132 155 100 155 C68 155 54 148 52 135 Z"
          fill="url(#scarfGrad)"
          stroke="#182547"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Scarf Tail / Knot */}
        <path
          d="M66 142 L60 178 C60 183 75 185 80 180 L84 148 Z"
          fill="url(#scarfKnotGrad)"
          stroke="#182547"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Scarf Fringe Stripes */}
        <line x1="64" y1="172" x2="77" y2="174" stroke="#7998df" strokeWidth="2.5" />
        <line x1="63" y1="178" x2="78" y2="180" stroke="#7998df" strokeWidth="2.5" />

        {/* Paws Resting Happily */}
        <ellipse cx="88" cy="172" rx="11" ry="8" fill="#ffffff" stroke="#3b5286" strokeWidth="3" />
        <ellipse cx="114" cy="172" rx="11" ry="8" fill="#ffffff" stroke="#3b5286" strokeWidth="3" />
      </svg>
    </div>
  );
};
