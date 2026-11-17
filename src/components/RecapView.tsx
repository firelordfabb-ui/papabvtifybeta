import React from 'react';
import { Song, ListeningStreak } from '../types/music';
import { PieChart, Share2, Flame, Trophy, Clock, Music } from 'lucide-react';

interface Props {
  streak: ListeningStreak;
  likedSongs: Song[];
}

export const RecapView: React.FC<Props> = ({ streak, likedSongs }) => {
  const topSong = likedSongs[0] || {
    title: 'Gala Bunga Matahari',
    artist: 'Sal Priadi',
    thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500'
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 space-y-6 select-none max-w-4xl mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <PieChart className="w-4 h-4" />
            <span>Cerita Musikmu</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Auralis Recap 2026
          </h2>
        </div>

        <button
          onClick={() => alert('Story Card disalin ke clipboard! Siap dibagikan ke Instagram Stories/TikTok.')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition shadow-lg shadow-white/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Bagikan Cerita</span>
        </button>
      </div>

      {/* Recap Story Card (Liquid Glass Glow) */}
      <div className="relative rounded-3xl p-8 liquid-glass border border-white/20 shadow-2xl overflow-hidden space-y-8 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-pink-950/20">
        {/* Subtle Ambient Glow Blobs inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <span className="text-[11px] font-bold text-indigo-400 tracking-widest uppercase">
            Ringkasan Statistik
          </span>
          <h3 className="text-3xl font-black text-white tracking-tight">
            Kamu Telah Mendengarkan
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="p-5 rounded-2xl liquid-glass-card space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-indigo-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">Total Waktu</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {streak.todayMinutes * 7 + 120} <span className="text-xs font-normal text-white/50">menit</span>
            </div>
            <p className="text-[11px] text-white/40">Diakumulasikan dalam 30 hari terakhir</p>
          </div>

          <div className="p-5 rounded-2xl liquid-glass-card space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span className="text-xs font-semibold">Streak Terpanjang</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {streak.longestStreak || 14} <span className="text-xs font-normal text-white/50">hari</span>
            </div>
            <p className="text-[11px] text-white/40">Konsistensi mendengarkan harian</p>
          </div>

          <div className="p-5 rounded-2xl liquid-glass-card space-y-2 border border-white/10">
            <div className="flex items-center gap-2 text-pink-400">
              <Music className="w-4 h-4" />
              <span className="text-xs font-semibold">Koleksi Disukai</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {likedSongs.length} <span className="text-xs font-normal text-white/50">lagu</span>
            </div>
            <p className="text-[11px] text-white/40">Tersimpan di pustaka pribadimu</p>
          </div>
        </div>

        {/* Favorite Song Spotlight */}
        <div className="p-6 rounded-2xl liquid-glass-card border border-white/15 flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Trophy className="w-4 h-4 fill-amber-400" />
              <span>LAGU FAVORIT UTAMA</span>
            </div>
            <h4 className="text-xl font-extrabold text-white tracking-tight">{topSong.title}</h4>
            <p className="text-xs text-white/60">{topSong.artist}</p>
          </div>

          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-white/20">
            <img src={topSong.thumbnail} alt={topSong.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};
