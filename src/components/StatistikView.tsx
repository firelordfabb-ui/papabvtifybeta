import React, { useState, useEffect } from 'react';
import { Song, UserListeningStats } from '../types/music';
import { StorageService } from '../services/storage';
import {
  BarChart3,
  Clock,
  Music2,
  TrendingUp,
  User,
  History,
  Play,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';

interface Props {
  onSelectSong: (song: Song) => void;
}

export const StatistikView: React.FC<Props> = ({ onSelectSong }) => {
  const [stats, setStats] = useState<UserListeningStats>(() => StorageService.getListeningStats());

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs} Jam ${mins} Menit`;
  };

  const topSongs = Object.values(stats.songPlayCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topArtists = Object.values(stats.artistPlayCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Daily listening for last 7 days
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dailyEntries = Object.entries(stats.dailyListeningSeconds).slice(-7);
  const maxDaySeconds = Math.max(...dailyEntries.map(([_, s]) => s), 1);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-32 animate-fadeIn select-none">
      {/* Header Banner */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/[0.12] shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-indigo-500/20 border border-white/20 flex items-center justify-center text-purple-300 shadow-xl">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              REKAP & STATISTIK PRIBADI
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Aktivitas Mendengar Musik
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Data analitik riwayat pemutaran audio Anda yang tersimpan di perangkat.
            </p>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-white/[0.08]">
          <div className="liquid-glass rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
              <Clock className="w-4 h-4" />
              <span>Total Waktu Dengar</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {formatHours(stats.totalListeningSeconds)}
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
              <Music2 className="w-4 h-4" />
              <span>Total Lagu Diputar</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {stats.totalSongsPlayed} Lagu
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <Award className="w-4 h-4" />
              <span>Artis Teratas</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white truncate">
              {topArtists[0]?.artist || 'Sal Priadi'}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-4 border border-white/[0.12] shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white">Aktivitas Mendengar Mingguan</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">7 Hari Terakhir</span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
          {dailyEntries.map(([dateStr, secs], idx) => {
            const dateObj = new Date(dateStr);
            const dayName = isNaN(dateObj.getTime()) ? `H-${7 - idx}` : dayNames[dateObj.getDay()];
            const pct = Math.max(12, Math.round((secs / maxDaySeconds) * 100));
            const mins = Math.round(secs / 60);

            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {mins}m
                </span>
                <div className="w-full max-w-[48px] rounded-2xl bg-white/[0.06] overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 via-purple-500 to-white rounded-2xl transition-all duration-500 group-hover:brightness-125"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Column: Top Songs & Top Artists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Songs */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-4 border border-white/[0.12] shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white">Lagu Paling Sering Diputar</h3>
          </div>

          <div className="space-y-2">
            {topSongs.map((item, idx) => (
              <div
                key={item.song.id}
                onClick={() => onSelectSong(item.song)}
                className="liquid-glass rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-white/[0.06] hover:border-white/20 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-5 text-center font-mono font-black text-xs ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    #{idx + 1}
                  </span>
                  <img
                    src={item.song.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                      {item.song.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.song.artist}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-white/[0.06] text-xs font-mono font-bold text-white shrink-0">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artists */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 space-y-4 border border-white/[0.12] shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <User className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">Artis Favorit Anda</h3>
          </div>

          <div className="space-y-3">
            {topArtists.map((artistItem, idx) => (
              <div
                key={artistItem.artist}
                className="liquid-glass rounded-2xl p-3 flex items-center justify-between gap-3 border border-white/[0.06]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                    {artistItem.artist.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-extrabold text-white truncate">
                      {artistItem.artist}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {Math.round(artistItem.seconds / 60)} menit didengarkan
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-indigo-300">
                  {artistItem.count} putaran
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
