import React, { useState } from 'react';
import { Song, RecommendationConfig, RecommendationMode } from '../types/music';
import { StorageService } from '../services/storage';
import { RecommendationEngine } from '../services/recommendationEngine';
import {
  ListMusic,
  X,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Check,
  Disc3,
  Search,
  Music2,
  GripVertical,
  Sparkles,
  Compass,
  HeartHandshake
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  queue: Song[];
  onPlaySongFromQueue: (song: Song, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
  onOpenSearch?: () => void;
}

export const QueueModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSong,
  queue,
  onPlaySongFromQueue,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
  onOpenSearch
}) => {
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [recConfig, setRecConfig] = useState<RecommendationConfig>(() =>
    RecommendationEngine.getRecommendationConfig()
  );

  const handleModeChange = (mode: RecommendationMode) => {
    const updated = { ...recConfig, mode };
    setRecConfig(updated);
    RecommendationEngine.setRecommendationConfig(updated);
  };

  const handleExplorationChange = (level: number) => {
    const updated = { ...recConfig, explorationLevel: level };
    setRecConfig(updated);
    RecommendationEngine.setRecommendationConfig(updated);
  };

  if (!isOpen) return null;

  const handleSaveAsPlaylist = () => {
    if (!playlistTitle.trim() || queue.length === 0) return;
    StorageService.createPlaylist(
      playlistTitle.trim(),
      `Dibuat dari antrean (${queue.length} lagu)`,
      queue.map(s => s.id),
      queue.slice(0, 4).map(s => s.thumbnail)
    );
    setPlaylistTitle('');
    setIsSavingPlaylist(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1020]/45 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg max-h-[88vh] bg-white/95 dark:bg-[#12172a] rounded-3xl p-6 sm:p-7 flex flex-col border border-[#A8C5FF] dark:border-[#283556] shadow-2xl text-[#18254B] dark:text-white animate-scaleUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dce7f7] dark:border-[#222c45] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] text-[#142247] dark:text-[#9ab3f5] border border-[#d2e2f8] dark:border-[#283556] flex items-center justify-center shadow-sm">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#142247] dark:text-white tracking-tight">Antrean Putar Musik</h3>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-medium">
                {queue.length} lagu dalam daftar putar berikutnya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] text-[#6b81a8] hover:text-[#142247] dark:hover:text-white transition"
            title="Tutup Antrean"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Playing Track Box (Fantasy Themed) */}
        {currentSong && (
          <div className="my-3.5 p-3 rounded-2xl bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] flex items-center justify-between gap-3 shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#dce7f7] dark:border-[#2b3a5c]">
                <img src={currentSong.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#142247]/30 flex items-center justify-center">
                  <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-[#344b7d] dark:text-[#9ab3f5] uppercase tracking-wider block">
                  Sedang Diputar
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#142247] dark:text-white truncate">
                  {currentSong.title}
                </h4>
                <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">
                  {currentSong.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Autoplay Mode Selector */}
        <div className="mb-3.5 p-3 rounded-2xl bg-[#edf3fd]/80 dark:bg-[#161d32]/80 border border-[#d2e2f8] dark:border-[#283556] shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142247] dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Mode Rekomendasi Lagu Berikutnya</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              {recConfig.mode === 'familiar' && 'Lagu Akrab'}
              {recConfig.mode === 'similar_vibes' && 'Vibe Serupa'}
              {recConfig.mode === 'discovery' && `Eksplorasi ${recConfig.explorationLevel}%`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'familiar', label: 'Akrab', icon: HeartHandshake, desc: 'Artis & lagu favorit' },
              { id: 'similar_vibes', label: 'Vibe Serupa', icon: Sparkles, desc: 'Genre & akustik cocok' },
              { id: 'discovery', label: 'Eksplorasi', icon: Compass, desc: 'Lagu baru & segar' }
            ].map(m => {
              const Icon = m.icon;
              const isSelected = recConfig.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as RecommendationMode)}
                  className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-[#1f2945] border-[#142247] dark:border-[#9ab3f5] text-[#142247] dark:text-white shadow-xs'
                      : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-300' : ''}`} />
                    <span className="text-xs font-extrabold">{m.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{m.desc}</span>
                </button>
              );
            })}
          </div>

          {recConfig.mode === 'discovery' && (
            <div className="pt-1.5 border-t border-[#dce7f7] dark:border-[#222c45] flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Tingkat Eksplorasi:
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={recConfig.explorationLevel}
                onChange={(e) => handleExplorationChange(parseInt(e.target.value, 10))}
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                {recConfig.explorationLevel}%
              </span>
            </div>
          )}
        </div>

        {/* Actions Bar: Save as Playlist & Clear */}
        <div className="flex items-center justify-between gap-2 pb-2.5 shrink-0">
          <span className="text-xs font-mono font-bold text-[#5d729c] dark:text-[#8fa1c4] uppercase tracking-wider">
            Berikutnya ({queue.length})
          </span>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <>
                <button
                  onClick={() => setIsSavingPlaylist(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-semibold text-[#142247] dark:text-[#9ab3f5] hover:opacity-85 transition active:scale-95"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Simpan Playlist</span>
                </button>
                <button
                  onClick={onClearQueue}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Save as Playlist Input Banner */}
        {isSavingPlaylist && (
          <div className="mb-3 p-3 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#A8C5FF] dark:border-[#283556] flex items-center gap-2 shrink-0 animate-fadeIn">
            <input
              type="text"
              placeholder="Nama Playlist Baru..."
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              className="flex-1 bg-white dark:bg-[#12172a] border border-[#d2e2f8] dark:border-[#283556] rounded-xl px-3 py-1.5 text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247] dark:focus:border-[#9ab3f5]"
            />
            <button
              onClick={handleSaveAsPlaylist}
              className="px-3.5 py-1.5 rounded-xl bg-[#142247] dark:bg-[#9ab3f5] text-white dark:text-[#142247] font-bold text-xs hover:opacity-90 active:scale-95 transition"
            >
              Simpan
            </button>
            <button
              onClick={() => setIsSavingPlaylist(false)}
              className="px-2 py-1.5 rounded-xl text-xs text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white"
            >
              Batal
            </button>
          </div>
        )}

        {savedSuccess && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 shrink-0 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Antrean berhasil disimpan ke Playlist Pustaka Anda!</span>
          </div>
        )}

        {/* Scrollable Queue List / Clean Empty State */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {queue.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-3.5">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] flex items-center justify-center text-[#2b427b] dark:text-[#9ab3f5] shadow-sm">
                <Music2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-[#142247] dark:text-white">
                  Belum ada lagu di antrean
                </h4>
                <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] max-w-xs mx-auto leading-relaxed">
                  Tambahkan lagu favoritmu dan nikmati musik tanpa batas.
                </p>
              </div>

              {/* Action Buttons: Cari Musik & Tutup */}
              <div className="pt-2 flex items-center justify-center gap-2.5">
                {onOpenSearch && (
                  <button
                    onClick={onOpenSearch}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-bold text-xs hover:opacity-90 transition active:scale-95 shadow-md cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Musik</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-semibold text-[#142247] dark:text-white hover:opacity-85 transition active:scale-95"
                >
                  Tutup Antrean
                </button>
              </div>
            </div>
          ) : (
            queue.map((song, idx) => (
              <div
                key={`${song.id}-${idx}`}
                draggable
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.setData('text/plain', idx.toString());
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(from) && from !== idx) {
                    onReorderQueue(from, idx);
                  }
                  setDraggedIdx(null);
                }}
                onDragEnd={() => setDraggedIdx(null)}
                className={`bg-white/90 dark:bg-[#151b2e] rounded-2xl p-2.5 flex items-center justify-between gap-3 border transition group shadow-xs ${
                  draggedIdx === idx
                    ? 'opacity-40 border-dashed border-[#315BCE]'
                    : 'border-[#dce7f7] dark:border-[#222c45] hover:border-[#A8C5FF] dark:hover:border-[#354366]'
                }`}
              >
                <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-[#94A6D2] hover:text-[#142247] dark:hover:text-white shrink-0">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono text-[#5d729c] dark:text-[#8fa1c4] w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                </div>

                <div
                  onClick={() => onPlaySongFromQueue(song, idx)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <img
                    src={song.thumbnail}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[#dce7f7] dark:border-[#222c45]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h5 className="text-xs font-bold text-[#142247] dark:text-white truncate group-hover:text-[#2c4b9b] dark:group-hover:text-[#9ab3f5] transition">
                        {song.title}
                      </h5>
                      {song.isRecommended && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                          ✨ Rekomendasi
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">
                      {song.artist}
                    </p>
                  </div>
                </div>

                {/* Queue Controls: Move Up, Move Down, Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => onReorderQueue(idx, idx - 1)}
                    className="p-1 rounded text-[#6b81a8] hover:text-[#142247] dark:hover:text-white disabled:opacity-20 transition cursor-pointer"
                    title="Pindah ke Atas"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === queue.length - 1}
                    onClick={() => onReorderQueue(idx, idx + 1)}
                    className="p-1 rounded text-[#6b81a8] hover:text-[#142247] dark:hover:text-white disabled:opacity-20 transition cursor-pointer"
                    title="Pindah ke Bawah"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    className="p-1 rounded text-[#8fa1c4] hover:text-rose-500 transition cursor-pointer"
                    title="Hapus dari Antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
