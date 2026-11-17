import React, { useState } from 'react';
import {
  PlaylistImportService,
  ImportedPlaylistResult,
  ImportedTrack
} from '../services/playlistImportService';
import { InnerTubeService } from '../services/innertube';
import { Song } from '../types/music';
import {
  X,
  Link,
  Music,
  CheckCircle2,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Check,
  AlertTriangle,
  HelpCircle,
  Search,
  ArrowRight,
  Sliders
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const PlaylistImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportedPlaylistResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Manual Match State
  const [editingTrack, setEditingTrack] = useState<ImportedTrack | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<Song[]>([]);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  if (!isOpen) return null;

  const detected = PlaylistImportService.detectProvider(urlInput);

  const handleStartImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsImporting(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const res = await PlaylistImportService.importFromUrl(urlInput.trim(), (status) => {
        setProgressStatus(status);
      });
      setImportResult(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengimpor playlist. Pastikan URL publik dan valid.');
    } finally {
      setIsImporting(false);
      setProgressStatus(null);
    }
  };

  const handleSaveToPustaka = (mode: 'all' | 'matched_only' = 'all') => {
    if (!importResult) return;
    PlaylistImportService.saveImportedPlaylist(importResult, mode);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onImportSuccess();
      onClose();
    }, 1500);
  };

  const handleOpenManualMatch = (track: ImportedTrack) => {
    setEditingTrack(track);
    setManualQuery(`${track.title} ${track.artist}`);
    setManualResults(track.candidateOptions || []);
  };

  const handleSearchManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualQuery.trim()) return;
    setIsSearchingManual(true);
    try {
      const results = await InnerTubeService.search(manualQuery.trim());
      setManualResults(results.slice(0, 8));
    } catch (err) {
      console.warn('Manual search error:', err);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleApplyManualSong = (selectedSong: Song) => {
    if (!importResult || !editingTrack) return;
    const updated = PlaylistImportService.manuallyMatchTrack(
      importResult,
      editingTrack.index,
      selectedSong
    );
    setImportResult(updated);
    setEditingTrack(null);
    setManualResults([]);
  };

  const handleSampleSpotify = () => {
    setUrlInput('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  };

  const handleSampleYouTube = () => {
    setUrlInput('https://www.youtube.com/playlist?list=PLuV8nkFf3ardy2JaKAVgTU3ihpT_LAQ2O');
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1020]/50 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/95 dark:bg-[#12172a] rounded-3xl p-6 sm:p-7 flex flex-col border border-[#A8C5FF] dark:border-[#283556] shadow-2xl text-[#18254B] dark:text-white animate-scaleUp overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dce7f7] dark:border-[#222c45] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#142247] dark:text-white tracking-tight">
                Import Playlist Musik Presisi
              </h3>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] font-medium">
                Pindahkan playlist Spotify atau YouTube resmi tanpa lagu acak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#edf3fd] dark:hover:bg-[#1a233b] text-[#6b81a8] hover:text-[#142247] dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="pt-4 space-y-3 shrink-0">
          <form onSubmit={handleStartImport} className="space-y-2.5">
            <div className="relative">
              <Link className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d93be]" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Tempel tautan playlist Spotify atau YouTube..."
                className="w-full pl-10 pr-28 py-3 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-2xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
              />
              <button
                type="submit"
                disabled={isImporting || !urlInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#142247] hover:opacity-90 disabled:opacity-40 text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                {isImporting ? 'Memproses...' : 'Mulai Import'}
              </button>
            </div>

            {/* Quick Provider Samples */}
            <div className="flex items-center justify-between text-[11px] text-[#5d729c] dark:text-[#8fa1c4] pt-0.5 px-1">
              <div className="flex items-center gap-1.5">
                <span>Sumber Terdeteksi:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  detected === 'spotify'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : detected === 'youtube'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-[#edf3fd] dark:bg-[#1a233b] text-[#5d729c]'
                }`}>
                  {detected ? detected.toUpperCase() : 'Menunggu Link'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span>Contoh Resmi:</span>
                <button
                  type="button"
                  onClick={handleSampleSpotify}
                  className="hover:underline text-[#2c4b9b] dark:text-[#9ab3f5] font-semibold cursor-pointer"
                >
                  Spotify (Top Hits)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleSampleYouTube}
                  className="hover:underline text-[#2c4b9b] dark:text-[#9ab3f5] font-semibold cursor-pointer"
                >
                  YouTube (Top Hits)
                </button>
              </div>
            </div>
          </form>

          {/* Progress Banner */}
          {isImporting && (
            <div className="p-3 rounded-2xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] flex items-center gap-3 animate-fadeIn">
              <RefreshCw className="w-4 h-4 text-[#142247] dark:text-[#9ab3f5] animate-spin" />
              <span className="text-xs font-semibold text-[#142247] dark:text-[#9ab3f5]">
                {progressStatus || 'Mengambil data playlist asli dari sumber...'}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Playlist berhasil disimpan ke Pustaka dengan urutan asli!</span>
            </div>
          )}
        </div>

        {/* Import Results Preview */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {importResult ? (
            <div className="space-y-4">
              {/* Validation Summary Card */}
              <div className="p-4 rounded-3xl bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={importResult.thumbnail}
                      alt={importResult.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#dce7f7] dark:border-[#283556] shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#344b7d] dark:text-[#9ab3f5]">
                          {importResult.source.toUpperCase()} PLAYLIST
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                          Akurasi {importResult.accuracyPercentage}%
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-[#142247] dark:text-white truncate">
                        {importResult.title}
                      </h4>
                      <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">
                        {importResult.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSaveToPustaka('all')}
                      className="px-4 py-2.5 bg-[#142247] hover:opacity-90 text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold rounded-2xl transition shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Simpan ({importResult.trackCount} Lagu)</span>
                    </button>
                  </div>
                </div>

                {/* Audit Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#dce7f7] dark:border-[#243152] text-center font-mono">
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-[#12172a]/60 border border-black/5 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Sumber</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{importResult.trackCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase">Cocok Akurat</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{importResult.matchedCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase">Perlu Cek</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">{importResult.needsVerificationCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase">Tidak Ada</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">{importResult.notFoundCount}</span>
                  </div>
                </div>
              </div>

              {/* Tracks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-[#5d729c] dark:text-[#8fa1c4] uppercase tracking-wider">
                  <span>Daftar Track Sesuai Urutan Asli ({importResult.tracks.length})</span>
                  <span>Status Verifikasi</span>
                </div>

                {importResult.tracks.map((t) => (
                  <div
                    key={`${t.id}_${t.index}`}
                    className={`p-3 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 ${
                      t.status === 'Matched'
                        ? 'bg-white/90 dark:bg-[#151b2e] border-[#dce7f7] dark:border-[#222c45]'
                        : t.status === 'Needs Verification'
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40'
                        : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono font-bold text-[#7d93be] w-6 text-center shrink-0">
                        #{t.index}
                      </span>
                      <img
                        src={t.thumbnail}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#dce7f7] dark:border-[#222c45]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-[#142247] dark:text-white truncate">
                            {t.title}
                          </h5>
                          {t.duration > 0 && (
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {formatDuration(t.duration)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">
                          {t.artist}
                        </p>
                        {t.matchedSong && t.matchedSong.title !== t.title && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1 mt-0.5 font-mono">
                            <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                            <span>Cocok: {t.matchedSong.title}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status & Manual Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      {t.status === 'Matched' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Matched</span>
                        </span>
                      )}

                      {t.status === 'Needs Verification' && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Perlu Cek</span>
                          </span>
                          <button
                            onClick={() => handleOpenManualMatch(t)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                          >
                            Pilih
                          </button>
                        </div>
                      )}

                      {t.status === 'Not Found' && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Tidak Ada</span>
                          </span>
                          <button
                            onClick={() => handleOpenManualMatch(t)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] hover:opacity-90 cursor-pointer"
                          >
                            Cari
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#5d729c] dark:text-[#8fa1c4] space-y-2">
              <Music className="w-10 h-10 mx-auto opacity-30 text-[#142247] dark:text-[#9ab3f5]" />
              <p className="text-xs font-semibold">
                Tempel link playlist Spotify atau YouTube di atas untuk memulai impor.
              </p>
              <p className="text-[11px] text-[#7d93be]">
                Sistem akan memverifikasi daftar track resmi tanpa mengganti lagu atau menyisipkan lagu acak.
              </p>
            </div>
          )}
        </div>

        {/* ==============================================================
            MODAL DIALOG: MANUAL MATCH TRACK
            ============================================================== */}
        {editingTrack && (
          <div className="absolute inset-0 z-40 bg-[#0b1020]/90 backdrop-blur-md p-6 flex flex-col justify-center items-center animate-fadeIn select-none">
            <div className="w-full max-w-lg bg-white dark:bg-[#12172a] rounded-3xl p-6 border border-[#A8C5FF] dark:border-[#283556] shadow-2xl flex flex-col space-y-4 max-h-[85vh]">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                    Pencocokan Manual Track #{editingTrack.index}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#142247] dark:text-white truncate">
                    {editingTrack.title} — {editingTrack.artist}
                  </h4>
                </div>
                <button
                  onClick={() => setEditingTrack(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchManual} className="flex gap-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Cari lagu / artis di YouTube..."
                  className="flex-1 px-3 py-2 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearchingManual}
                  className="px-4 py-2 bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isSearchingManual ? 'Mencari...' : 'Cari'}
                </button>
              </form>

              {/* Candidates list */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Pilihan Hasil Pencarian ({manualResults.length}):
                </span>
                {manualResults.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400">
                    Ketik pencarian atau tekan tombol Cari untuk menemukan lagu.
                  </p>
                ) : (
                  manualResults.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => handleApplyManualSong(cand)}
                      className="p-2.5 rounded-xl bg-[#f0f5fe] dark:bg-[#161d32] hover:bg-[#e4effd] dark:hover:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#243152] flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={cand.thumbnail}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h6 className="text-xs font-bold text-[#142247] dark:text-white truncate">
                            {cand.title}
                          </h6>
                          <p className="text-[10px] text-slate-500 truncate">
                            {cand.artist} • {formatDuration(cand.duration)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs shrink-0"
                      >
                        Pilih Ini
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
