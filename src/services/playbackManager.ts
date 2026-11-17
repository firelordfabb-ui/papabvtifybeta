import {
  Song,
  PlaybackMode,
  PlaybackContext,
  PlaybackHistoryItem,
  RepeatMode,
  RecommendationMode,
  RecommendationConfig
} from '../types/music';
import { StorageService } from './storage';
import { RecommendationEngine } from './recommendationEngine';

export class PlaybackManager {
  private static instance: PlaybackManager;

  private currentSong: Song | null = null;
  private playbackMode: PlaybackMode = 'follow_playlist';
  private activeContext: PlaybackContext | null = null;
  private historyStack: PlaybackHistoryItem[] = [];
  private historyIndex: number = -1;
  private manualQueue: Song[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.restoreFromStorage();
  }

  public static getInstance(): PlaybackManager {
    if (!PlaybackManager.instance) {
      PlaybackManager.instance = new PlaybackManager();
    }
    return PlaybackManager.instance;
  }

  /**
   * Restore state from persistent StorageService on boot
   */
  private restoreFromStorage(): void {
    try {
      this.playbackMode = StorageService.getPlaybackMode();
      this.activeContext = StorageService.getPlaybackContext();
      this.historyStack = StorageService.getPlaybackHistory();
      this.manualQueue = StorageService.getQueue();
      if (this.historyStack.length > 0) {
        this.historyIndex = this.historyStack.length - 1;
        this.currentSong = this.historyStack[this.historyIndex].song;
      }
    } catch (e) {
      console.warn('PlaybackManager restore error:', e);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try { cb(); } catch {}
    });
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  public getCurrentSong(): Song | null {
    return this.currentSong;
  }

  public getPlaybackMode(): PlaybackMode {
    return this.playbackMode;
  }

  public getActiveContext(): PlaybackContext | null {
    return this.activeContext;
  }

  public getQueue(): Song[] {
    return [...this.manualQueue];
  }

  public getHistory(): PlaybackHistoryItem[] {
    return [...this.historyStack];
  }

  // =========================================================================
  // FISHER-YATES TRUE UNBIASED SHUFFLE ALGORITHM
  // =========================================================================

  public static fisherYatesShuffle(array: Song[]): Song[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // =========================================================================
  // PLAYBACK MODE MANAGEMENT
  // =========================================================================

  public setPlaybackMode(mode: PlaybackMode): void {
    if (this.playbackMode === mode) return;
    this.playbackMode = mode;
    StorageService.savePlaybackMode(mode);

    // If switching to Normal Shuffle, generate and save a fresh Fisher-Yates sequence
    if (mode === 'normal_shuffle' && this.activeContext && this.activeContext.originalTracks.length > 0) {
      const shuffled = PlaybackManager.fisherYatesShuffle(this.activeContext.originalTracks);
      // Place current playing song at the front if present
      if (this.currentSong) {
        const idx = shuffled.findIndex(s => s.id === this.currentSong?.id);
        if (idx > 0) {
          const [cur] = shuffled.splice(idx, 1);
          shuffled.unshift(cur);
        }
      }
      this.activeContext.shuffledTracks = shuffled;
      StorageService.savePlaybackContext(this.activeContext);
    }

    this.notify();
  }

  // =========================================================================
  // PLAYBACK CONTEXT (FOLLOW PLAYLIST) MANAGEMENT
  // =========================================================================

  /**
   * Set the active playback context (e.g. when Play All or playlist song clicked)
   * Default mode is strictly 'follow_playlist'.
   */
  public setContext(
    context: PlaybackContext,
    startSongId?: string,
    initialMode?: PlaybackMode
  ): Song {
    const mode = initialMode || 'follow_playlist';
    this.playbackMode = mode;
    StorageService.savePlaybackMode(mode);

    const original = [...context.originalTracks];
    let tracks = [...context.tracks];
    let shuffled: Song[] | undefined = undefined;

    if (mode === 'normal_shuffle') {
      shuffled = PlaybackManager.fisherYatesShuffle(original);
      tracks = shuffled;
    }

    const targetId = startSongId || (tracks.length > 0 ? tracks[0].id : '');
    const foundSong = tracks.find(s => s.id === targetId) || tracks[0];

    // If starting in shuffle mode, move the chosen song to the front
    if (mode === 'normal_shuffle' && shuffled && foundSong) {
      const sIdx = shuffled.findIndex(s => s.id === foundSong.id);
      if (sIdx > 0) {
        const [target] = shuffled.splice(sIdx, 1);
        shuffled.unshift(target);
      }
    }

    this.activeContext = {
      ...context,
      tracks,
      originalTracks: original,
      shuffledTracks: shuffled,
      currentIndex: tracks.findIndex(s => s.id === foundSong?.id)
    };

    StorageService.savePlaybackContext(this.activeContext);

    if (foundSong) {
      this.recordTrackStart(foundSong, this.activeContext);
    }

    this.notify();
    return foundSong;
  }

  /**
   * Records a track start into history stack without creating duplicate back-traversal items
   */
  public recordTrackStart(song: Song, context?: PlaybackContext | null): void {
    if (!song || !song.id) return;
    this.currentSong = song;

    const ctx = context || this.activeContext;
    const historyItem: PlaybackHistoryItem = {
      song,
      contextId: ctx ? ctx.id : 'standalone',
      contextTitle: ctx ? ctx.title : 'Pemutaran Mandiri',
      timestamp: Date.now()
    };

    // If we traversed back in history and now play a new song, trim forward history
    if (this.historyIndex >= 0 && this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }

    // Prevent immediate consecutive duplicate in history
    const lastItem = this.historyStack[this.historyStack.length - 1];
    if (!lastItem || lastItem.song.id !== song.id) {
      this.historyStack.push(historyItem);
      this.historyIndex = this.historyStack.length - 1;
      StorageService.savePlaybackHistory(this.historyStack);
    } else {
      this.historyIndex = this.historyStack.length - 1;
    }

    // Update active context index
    if (this.activeContext) {
      const activeList = this.playbackMode === 'normal_shuffle' && this.activeContext.shuffledTracks
        ? this.activeContext.shuffledTracks
        : this.activeContext.tracks;
      this.activeContext.currentIndex = activeList.findIndex(s => s.id === song.id);
      StorageService.savePlaybackContext(this.activeContext);
    }

    this.notify();
  }

  // =========================================================================
  // NEXT TRACK RESOLUTION (QUEUE > MODE A: FOLLOW PLAYLIST > MODE B: SHUFFLE > MODE C: SMART)
  // =========================================================================

  public async getNextTrack(
    repeatMode: RepeatMode = 'all'
  ): Promise<{
    song: Song | null;
    isEndOfContext?: boolean;
    reason?: string;
  }> {
    // -----------------------------------------------------------------------
    // PRIORITY 1: MANUAL QUEUE (User Enqueued Tracks First)
    // -----------------------------------------------------------------------
    if (this.manualQueue.length > 0) {
      const nextSong = this.manualQueue.shift()!;
      StorageService.saveQueue(this.manualQueue);
      this.recordTrackStart(nextSong, this.activeContext);
      return {
        song: nextSong,
        reason: 'Antrean Manual Pengguna'
      };
    }

    if (!this.currentSong && (!this.activeContext || this.activeContext.tracks.length === 0)) {
      return { song: null, isEndOfContext: true };
    }

    // -----------------------------------------------------------------------
    // PRIORITY 2: ACTIVE PLAYBACK MODE
    // -----------------------------------------------------------------------

    // MODE A: FOLLOW PLAYLIST (Strict sequential progression)
    if (this.playbackMode === 'follow_playlist') {
      if (!this.activeContext || this.activeContext.tracks.length === 0) {
        return { song: null, isEndOfContext: true };
      }

      const tracks = this.activeContext.tracks;
      const currentIdx = tracks.findIndex(s => s.id === this.currentSong?.id);
      const nextIdx = currentIdx + 1;

      if (nextIdx < tracks.length) {
        const nextSong = tracks[nextIdx];
        this.recordTrackStart(nextSong, this.activeContext);
        return {
          song: nextSong,
          reason: `Urutan Playlist (${nextIdx + 1} dari ${tracks.length})`
        };
      }

      // Reached end of playlist
      if (repeatMode === 'all') {
        const loopSong = tracks[0];
        this.recordTrackStart(loopSong, this.activeContext);
        return {
          song: loopSong,
          reason: 'Ulang Playlist dari Awal'
        };
      }

      // If repeatMode === 'off', finish playlist cleanly. NEVER inject random songs!
      return {
        song: null,
        isEndOfContext: true,
        reason: 'Playlist Selesai'
      };
    }

    // MODE B: NORMAL SHUFFLE (True Fisher-Yates without repetition)
    if (this.playbackMode === 'normal_shuffle') {
      if (!this.activeContext || this.activeContext.originalTracks.length === 0) {
        return { song: null, isEndOfContext: true };
      }

      if (!this.activeContext.shuffledTracks || this.activeContext.shuffledTracks.length === 0) {
        this.activeContext.shuffledTracks = PlaybackManager.fisherYatesShuffle(this.activeContext.originalTracks);
      }

      const shuffled = this.activeContext.shuffledTracks;
      const currentIdx = shuffled.findIndex(s => s.id === this.currentSong?.id);
      const nextIdx = currentIdx + 1;

      if (nextIdx < shuffled.length) {
        const nextSong = shuffled[nextIdx];
        this.recordTrackStart(nextSong, this.activeContext);
        return {
          song: nextSong,
          reason: `Normal Shuffle (${nextIdx + 1} dari ${shuffled.length})`
        };
      }

      // All shuffled tracks played
      if (repeatMode === 'all') {
        const freshShuffle = PlaybackManager.fisherYatesShuffle(this.activeContext.originalTracks);
        this.activeContext.shuffledTracks = freshShuffle;
        StorageService.savePlaybackContext(this.activeContext);

        const nextSong = freshShuffle[0];
        this.recordTrackStart(nextSong, this.activeContext);
        return {
          song: nextSong,
          reason: 'Reshuffle Playlist Baru'
        };
      }

      return {
        song: null,
        isEndOfContext: true,
        reason: 'Semua Lagu Shuffle Selesai'
      };
    }

    // MODE C: SMART SHUFFLE (Multidimensional Musical Recommendation)
    if (this.playbackMode === 'smart_shuffle') {
      if (!this.currentSong) return { song: null, isEndOfContext: true };

      try {
        const historyIds = this.historyStack.map(h => h.song.id);
        const smartCandidate = await RecommendationEngine.getNextAutoplaySong(
          this.currentSong,
          historyIds
        );

        if (smartCandidate && smartCandidate.id !== this.currentSong.id) {
          this.recordTrackStart(smartCandidate, this.activeContext);
          return {
            song: smartCandidate,
            reason: smartCandidate.recommendationReason || 'Smart Recommendation Vibe Cocok'
          };
        }
      } catch (err) {
        console.warn('Smart Shuffle generation note:', err);
      }

      // Fallback inside active context if recommendation fails
      if (this.activeContext && this.activeContext.tracks.length > 0) {
        const tracks = this.activeContext.tracks;
        const currentIdx = tracks.findIndex(s => s.id === this.currentSong?.id);
        const nextIdx = (currentIdx + 1) % tracks.length;
        const nextSong = tracks[nextIdx];
        this.recordTrackStart(nextSong, this.activeContext);
        return { song: nextSong, reason: 'Fallback Playlist' };
      }
    }

    return { song: null, isEndOfContext: true };
  }

  // =========================================================================
  // PREVIOUS TRACK RESOLUTION (TRUE HISTORY STACK & > 3S RESTART)
  // =========================================================================

  public getPreviousTrack(currentTime: number): {
    song: Song | null;
    shouldRestartCurrent: boolean;
  } {
    if (!this.currentSong) {
      return { song: null, shouldRestartCurrent: false };
    }

    // 1. If played > 3 seconds, replay the current song from 0:00
    if (currentTime > 3.0) {
      return {
        song: this.currentSong,
        shouldRestartCurrent: true
      };
    }

    // 2. Backward traversal in Playback History Stack
    if (this.historyIndex > 0) {
      this.historyIndex -= 1;
      const prevHistoryItem = this.historyStack[this.historyIndex];
      this.currentSong = prevHistoryItem.song;
      this.notify();
      return {
        song: prevHistoryItem.song,
        shouldRestartCurrent: false
      };
    }

    // 3. At the beginning of history: follow active playlist context boundary
    if (this.activeContext && this.activeContext.tracks.length > 0) {
      const activeList = this.playbackMode === 'normal_shuffle' && this.activeContext.shuffledTracks
        ? this.activeContext.shuffledTracks
        : this.activeContext.tracks;

      const currentIdx = activeList.findIndex(s => s.id === this.currentSong?.id);

      if (currentIdx > 0) {
        const prevSong = activeList[currentIdx - 1];
        this.currentSong = prevSong;
        this.notify();
        return {
          song: prevSong,
          shouldRestartCurrent: false
        };
      }

      // If already at index 0 of playlist: restart current song, NEVER random!
      return {
        song: this.currentSong,
        shouldRestartCurrent: true
      };
    }

    return {
      song: this.currentSong,
      shouldRestartCurrent: true
    };
  }

  // =========================================================================
  // MANUAL QUEUE OPERATIONS
  // =========================================================================

  public addToQueue(song: Song): void {
    this.manualQueue.push(song);
    StorageService.saveQueue(this.manualQueue);
    this.notify();
  }

  public playNext(song: Song): void {
    const filtered = this.manualQueue.filter(s => s.id !== song.id);
    this.manualQueue = [song, ...filtered];
    StorageService.saveQueue(this.manualQueue);
    this.notify();
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.manualQueue.length) {
      this.manualQueue.splice(index, 1);
      StorageService.saveQueue(this.manualQueue);
      this.notify();
    }
  }

  public reorderQueue(fromIndex: number, toIndex: number): void {
    if (
      fromIndex >= 0 &&
      fromIndex < this.manualQueue.length &&
      toIndex >= 0 &&
      toIndex < this.manualQueue.length
    ) {
      const [item] = this.manualQueue.splice(fromIndex, 1);
      this.manualQueue.splice(toIndex, 0, item);
      StorageService.saveQueue(this.manualQueue);
      this.notify();
    }
  }

  public clearQueue(): void {
    this.manualQueue = [];
    StorageService.saveQueue([]);
    this.notify();
  }

  /**
   * Resets all in-memory playback history, manual queue, and active context when switching accounts
   */
  public resetForUser(userId: string | null): void {
    StorageService.setActiveUser(userId);
    this.currentSong = null;
    this.historyStack = [];
    this.historyIndex = -1;
    this.manualQueue = [];
    this.activeContext = null;
    this.restoreFromStorage();
    this.notify();
  }
}

export const Playback = PlaybackManager.getInstance();
