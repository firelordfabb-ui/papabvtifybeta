import React, { useState } from 'react';
import { Artist, Song } from '../types/music';
import { ArtistService } from '../services/artistService';
import {
  ArrowLeft,
  Play,
  Shuffle,
  Heart,
  UserCheck,
  UserPlus,
  Disc3,
  Flame,
  ListMusic,
  Check,
  Sparkles
} from 'lucide-react';

interface Props {
  artist: Artist;
  onBack: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  onShuffleArtistSongs: (songs: Song[]) => void;
  onAddToQueue: (song: Song) => void;
  onOpenArtist: (artistId: string) => void;
}

export const ArtistDetailView: React.FC<Props> = ({
  artist,
  onBack,
  currentSong,
  isPlaying,
  onSelectSong,
  onShuffleArtistSongs,
  onAddToQueue,
  onOpenArtist
}) => {
  const [isFollowed, setIsFollowed] = useState<boolean>(!!artist.isFollowed);
  const [activeTab, setActiveTab] = useState<'overview' | 'albums' | 'singles' | 'related'>('overview');

  const handleToggleFollow = () => {
    const newState = ArtistService.toggleFollow(artist.id);
    setIsFollowed(newState);
  };

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 sm:px-10 py-6 space-y-8 max-w-5xl mx-auto animate-fadeIn select-none pb-48">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-slate-300 hover:text-white transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-[11px] font-mono text-indigo-300 border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Profil Resmi Artis Terverifikasi</span>
        </div>
      </div>

      {/* Hero Header with Banner & Artist Details */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/[0.12] shadow-2xl">
        {/* Banner Backdrop */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src={artist.banner || artist.avatar}
            alt={artist.name}
            className="w-full h-full object-cover object-center filter brightness-[0.55] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/40 to-transparent" />
        </div>

        {/* Floating Artist Profile Info */}
        <div className="relative p-6 sm:p-8 -mt-20 sm:-mt-24 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {/* Circular Avatar with Glowing Border */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#090b10] shadow-2xl shrink-0 ring-2 ring-white/30 group">
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-indigo-300 tracking-wide uppercase">
                {artist.genre}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {artist.monthlyListeners || '10M+ pendengar bulanan'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {artist.name}
            </h1>

            {artist.bio && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2 leading-relaxed">
                {artist.bio}
              </p>
            )}
          </div>

          {/* Action Buttons: Shuffle Play & Follow */}
          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
            <button
              onClick={() => onShuffleArtistSongs(artist.topSongs)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/15"
              title="Acak dan putar seluruh lagu artis"
            >
              <Shuffle className="w-4 h-4 text-black" />
              <span>Acak Putar</span>
            </button>

            <button
              onClick={handleToggleFollow}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition active:scale-95 border ${
                isFollowed
                  ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/40'
                  : 'liquid-glass border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {isFollowed ? (
                <>
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Mengikuti</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-slate-300" />
                  <span>Ikuti Artis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'overview', label: 'Ringkasan & Populer' },
          { key: 'albums', label: `Album (${artist.albums.length})` },
          { key: 'singles', label: `Single (${artist.singles.length})` },
          { key: 'related', label: `Artis Terkait (${artist.relatedArtists.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: OVERVIEW & POPULAR SONGS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Lagu Populer</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {artist.topSongs.length} lagu teratas
              </span>
            </div>

            <div className="space-y-2">
              {artist.topSongs.map((song, idx) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    onClick={() => onSelectSong(song)}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl liquid-glass border transition group cursor-pointer active:scale-[0.99] ${
                      isThisPlaying
                        ? 'border-indigo-500/50 bg-indigo-950/30'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-5 text-center font-mono text-xs font-bold text-slate-500 group-hover:text-white">
                        {idx + 1}
                      </span>

                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow">
                        <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate ${isThisPlaying ? 'text-indigo-300' : 'text-white'}`}>
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {song.album || artist.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      {song.plays && (
                        <span className="hidden sm:inline text-slate-500">
                          {song.plays} putar
                        </span>
                      )}
                      <span>{formatDuration(song.duration)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(song);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                        title="Tambah ke Antrean"
                      >
                        <ListMusic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Discography Preview */}
          {artist.albums.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-purple-400" />
                <span>Album Terbaru</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {artist.albums.map(alb => (
                  <div
                    key={alb.id}
                    className="p-3 rounded-2xl liquid-glass border border-white/10 group cursor-pointer hover:border-white/20 transition-all space-y-2.5"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg">
                      <img src={alb.cover} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white truncate">{alb.title}</h5>
                      <p className="text-[10px] font-mono text-slate-400">{alb.year} • {alb.songCount} lagu</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: ALBUMS */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {artist.albums.map(alb => (
            <div
              key={alb.id}
              className="p-3.5 rounded-2xl liquid-glass border border-white/10 group cursor-pointer hover:border-white/25 transition-all space-y-3"
            >
              <div className="aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img src={alb.cover} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white truncate">{alb.title}</h5>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{alb.year} • {alb.songCount} lagu</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 3: SINGLES */}
      {activeTab === 'singles' && (
        <div className="space-y-2">
          {artist.singles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              Belum ada single independen terdaftar untuk artis ini.
            </div>
          ) : (
            artist.singles.map(song => (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass border border-white/10 hover:border-white/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white truncate">{song.title}</h5>
                    <p className="text-[10px] text-slate-400">Single</p>
                  </div>
                </div>
                <button className="p-2 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 4: RELATED ARTISTS */}
      {activeTab === 'related' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {artist.relatedArtists.map(rel => (
            <div
              key={rel.id}
              onClick={() => onOpenArtist(rel.id)}
              className="p-4 rounded-2xl liquid-glass border border-white/10 text-center cursor-pointer group hover:border-white/25 active:scale-95 transition-all space-y-2.5"
            >
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <img src={rel.avatar} alt={rel.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                  {rel.name}
                </h5>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {rel.genre}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
