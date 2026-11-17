import React, { useState, useEffect } from 'react';
import { Song, DownloadItem } from '../types/music';
import { StorageService } from '../services/storage';
import { DownloadService } from '../services/downloadService';
import {
  Download,
  CheckCircle2,
  HardDrive,
  Trash2,
  Play,
  Pause,
  Clock,
  Music,
  AlertCircle,
  FileAudio,
  Sparkles,
  ArrowRight,
  RotateCcw,
  XCircle
} from 'lucide-react';

interface Props {
  onSelectSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onOpenSearch?: () => void;
}

export const UnduhanView: React.FC<Props> = ({
  onSelectSong,
  currentSong,
  isPlaying,
  onOpenSearch
}) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => StorageService.getDownloads());
  const [activeSubTab, setActiveSubTab] = useState<'completed' | 'queue'>('completed');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Refresh downloads list
    const list = StorageService.getDownloads();
    setDownloads(list);

    const unsub = DownloadService.subscribeGlobal(() => {
      setDownloads(StorageService.getDownloads());
    });
    return unsub;
  }, []);

  const handleDelete = async (songId: string) => {
    setDeletingId(songId);
    try {
      await DownloadService.deleteDownloadedSong(songId);
      setDownloads(prev => prev.filter(d => d.song.id !== songId));
    } catch (err) {
      console.error('Failed to delete download:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const completedList = downloads.filter(d => d.status === 'completed');
  const queueList = downloads.filter(d => d.status !== 'completed');

  // Calculate actual storage used
  const totalMb = completedList.reduce((acc, curr) => {
    const num = parseFloat(curr.fileSize) || 4.5;
    return acc + num;
  }, 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-7 pb-36 animate-fadeIn select-none text-[#142247] dark:text-[#EAF0FF] max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/95 dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] shadow-sm">
        {/* Soft Ambient Aurora Backdrop */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-[#42DDAA]/15 via-[#315BCE]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#edf3fd] dark:bg-[#162142] border border-[#dce7f7] dark:border-[#223363] flex items-center justify-center text-[#142247] dark:text-[#42DDAA] shadow-sm">
              <Download className="w-7 h-7" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#edf3fd] dark:bg-[#162142] text-[#142247] dark:text-[#42DDAA] border border-[#d2e2f8] dark:border-[#223363]">
                PENGELOLA UNDUHAN
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight mt-1.5">
                Musik Offline & Unduhan
              </h1>
              <p className="text-xs sm:text-sm text-[#5d729c] dark:text-[#94A6D2] font-medium mt-0.5">
                Putar lagu favorit Anda kapan saja tanpa internet secara legal dan berkualitas tinggi.
              </p>
            </div>
          </div>

          {/* Sub-tab pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#edf3fd] dark:bg-[#162142] border border-[#d2e2f8] dark:border-[#223363] text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('completed')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                activeSubTab === 'completed'
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] font-extrabold shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white'
              }`}
            >
              Terunduh ({completedList.length})
            </button>
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                activeSubTab === 'queue'
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] font-extrabold shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white'
              }`}
            >
              Antrean ({queueList.length})
            </button>
          </div>
        </div>

        {/* Storage Bar Indicator */}
        <div className="mt-6 pt-5 border-t border-[#dce7f7] dark:border-[#1E2D56] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[#5d729c] dark:text-[#94A6D2]">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-[#315BCE] dark:text-[#42DDAA]" />
              <span>Memori Digunakan PAPABVTIFY: <strong className="text-[#142247] dark:text-white font-bold">{totalMb.toFixed(1)} MB</strong></span>
            </div>
            <span>Penyimpanan Offline: <strong className="text-[#142247] dark:text-white font-bold">{completedList.length} Lagu</strong></span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#edf3fd] dark:bg-[#070B18] overflow-hidden flex border border-[#dce7f7] dark:border-[#1E2D56]">
            <div
              className="h-full bg-gradient-to-r from-[#315BCE] to-[#42DDAA] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(totalMb > 0 ? 5 : 0, (totalMb / 500) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'completed' ? (
        completedList.length === 0 ? (
          /* Honest Empty State */
          <div className="py-16 text-center space-y-4 rounded-3xl bg-white/60 dark:bg-[#101A35]/60 border border-[#dce7f7] dark:border-[#1E2D56] p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-[#edf3fd] dark:bg-[#162142] border border-[#dce7f7] dark:border-[#223363] text-[#5d729c] dark:text-[#42DDAA] flex items-center justify-center mx-auto shadow-sm">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#142247] dark:text-white">
                Belum Ada Musik Offline
              </h3>
              <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] max-w-sm mx-auto mt-1 leading-relaxed">
                Tekan tombol download pada lagu mana saja di Beranda, Pencarian, atau Player untuk menyimpannya ke memori lokal.
              </p>
            </div>
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] text-xs font-black transition active:scale-95 shadow-md cursor-pointer"
              >
                <span>Jelajahi & Cari Musik</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Downloaded Songs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {completedList.map(({ song, fileSize, downloadedAt }) => {
              const isCurrent = currentSong?.id === song.id;
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={song.id}
                  className={`p-3.5 rounded-2xl bg-white/95 dark:bg-[#101A35] border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    isCurrent
                      ? 'border-[#315BCE] dark:border-[#42DDAA] bg-[#edf3fd]/40 dark:bg-[#162142]'
                      : 'border-[#dce7f7] dark:border-[#1E2D56] hover:border-[#a8c5ff]'
                  }`}
                >
                  <div
                    onClick={() => onSelectSong(song)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#edf3fd] dark:bg-[#162142] border border-[#dce7f7] dark:border-[#223363]">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-white truncate group-hover:text-[#315BCE] dark:group-hover:text-[#42DDAA] transition">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-[#5d729c] dark:text-[#94A6D2] truncate mt-0.5">
                        {song.artist} · <span className="font-mono text-[#315BCE] dark:text-[#42DDAA]">{fileSize}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-[#42DDAA] bg-emerald-500/10 dark:bg-[#42DDAA]/10 px-2 py-0.5 rounded-full border border-emerald-500/20 dark:border-[#42DDAA]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Offline</span>
                    </span>

                    <button
                      onClick={() => handleDelete(song.id)}
                      disabled={deletingId === song.id}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-[#5d729c] hover:text-rose-600 transition active:scale-90 cursor-pointer"
                      title="Hapus file offline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Queue View */
        queueList.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-3xl bg-white/60 dark:bg-[#101A35]/60 border border-[#dce7f7] dark:border-[#1E2D56] p-8 max-w-md mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-[#142247] dark:text-white">
              Semua Unduhan Selesai
            </h3>
            <p className="text-xs text-[#5d729c] dark:text-[#94A6D2]">
              Tidak ada unduhan aktif yang sedang berjalan di latar belakang.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queueList.map(({ song, status, progress }) => (
              <div
                key={song.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#edf3fd] dark:bg-[#162142] shrink-0 border border-[#dce7f7] dark:border-[#1E2D56]">
                      <img src={song.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">{song.title}</h4>
                      <p className="text-[10px] text-[#5d729c] dark:text-[#94A6D2] truncate">
                        {song.artist} · <span className={`font-semibold ${status === 'failed' ? 'text-rose-500' : 'text-[#315BCE] dark:text-[#42DDAA]'}`}>
                          {status === 'failed' ? 'Gagal mengunduh' : status === 'downloading' ? 'Sedang mengunduh...' : 'Menyiapkan...'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-[#315BCE] dark:text-[#42DDAA]">
                      {status === 'failed' ? '!' : `${progress}%`}
                    </span>

                    {status === 'failed' ? (
                      <button
                        onClick={() => DownloadService.downloadSong(song)}
                        className="p-1.5 rounded-lg bg-[#315BCE]/10 dark:bg-[#42DDAA]/10 text-[#315BCE] dark:text-[#42DDAA] hover:bg-[#315BCE]/20 transition cursor-pointer"
                        title="Coba Lagi"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => DownloadService.cancelDownload(song.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        title="Batalkan Unduhan"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {status !== 'failed' && (
                  <div className="w-full h-1.5 rounded-full bg-[#edf3fd] dark:bg-[#070B18] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#315BCE] to-[#42DDAA] rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};