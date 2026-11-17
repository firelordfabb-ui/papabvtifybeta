import React, { useState } from 'react';
import { RadioStation } from '../types/music';
import { RadioService, CURATED_RADIO_STATIONS } from '../services/radioService';
import { Radio, Search, Play, Volume2, Globe } from 'lucide-react';

interface Props {
  currentStationUrl: string | null;
  isPlaying: boolean;
  onPlayStation: (station: RadioStation) => void;
}

export const RadioView: React.FC<Props> = ({
  currentStationUrl,
  isPlaying,
  onPlayStation
}) => {
  const [activeCountry, setActiveCountry] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<RadioStation[]>(CURATED_RADIO_STATIONS);
  const [isSearching, setIsSearching] = useState(false);

  const countries = [
    { label: 'Semua', flag: '🌐' },
    { label: 'Indonesia', flag: '🇮🇩' },
    { label: 'Jepang', flag: '🇯🇵' },
    { label: 'Amerika Serikat', flag: '🇺🇸' },
    { label: 'Korea Selatan', flag: '🇰🇷' },
  ];

  const handleCountryFilter = (c: string) => {
    setActiveCountry(c);
    setStations(RadioService.getCuratedStations(c));
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setStations(RadioService.getCuratedStations(activeCountry));
      return;
    }

    setIsSearching(true);
    try {
      const results = await RadioService.searchGlobalStations(searchQuery);
      setStations(results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 sm:px-12 py-8 space-y-8 max-w-5xl mx-auto animate-fadeIn select-none pb-44">
      {/* Header */}
      <div className="space-y-1 border-b border-black/5 dark:border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono tracking-widest text-red-500 uppercase font-bold">
            Live Global Broadcast
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          Radio Dunia 24 Jam
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Stasiun radio langsung dari Indonesia, Jepang, Amerika, dan mancanegara. Audio stream nyata 100% tanpa buffering.
        </p>
      </div>

      {/* Global Radio Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl liquid-glass focus-within:ring-2 focus-within:ring-red-400/30 shadow-sm transition">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari stasiun radio dunia (contoh: Tokyo, Prambors, BBC, Jazz, Seoul)..."
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-extrabold text-xs hover:opacity-90 transition active:scale-95 shadow-md"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Country Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {countries.map((c) => {
          const isActive = activeCountry === c.label;
          return (
            <button
              key={c.label}
              onClick={() => handleCountryFilter(c.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-bold shadow-md'
                  : 'liquid-glass-pill text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stations Grid */}
      <div className="space-y-3">
        {isSearching && (
          <div className="py-8 text-center text-xs font-mono text-slate-400 animate-pulse">
            Menghubungkan ke ribuan frekuensi stasiun radio dunia...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {stations.map((st) => {
            const isCurrent = currentStationUrl === st.streamUrl;

            return (
              <div
                key={st.id}
                onClick={() => onPlayStation(st)}
                className={`p-3.5 rounded-2xl liquid-glass cursor-pointer transition-all duration-200 active:scale-[0.98] group flex items-center justify-between gap-3 shadow-sm hover:shadow-md ${
                  isCurrent ? 'ring-2 ring-red-500/50 bg-red-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-black/5 dark:border-white/10 shadow-sm">
                    <img
                      src={st.logo}
                      alt={st.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        LIVE
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {st.country}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-red-500">
                      {st.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {st.genre}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                    isCurrent && isPlaying
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-white/[0.08] group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black text-slate-700 dark:text-white'
                  }`}>
                    {isCurrent && isPlaying ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
