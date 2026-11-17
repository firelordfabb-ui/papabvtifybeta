import { Song, DownloadItem } from '../types/music';
import { StorageService } from './storage';
import { ApiConfig } from './apiConfig';

const DB_NAME = 'papabvtify_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_tracks';

export interface OfflineTrackRecord {
  id: string;
  song: Song;
  blob: Blob;
  sizeBytes: number;
  mimeType: string;
  downloadedAt: number;
}

export interface DownloadProgress {
  songId: string;
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  status: 'preparing' | 'downloading' | 'completed' | 'failed' | 'paused' | 'cancelled';
  errorMessage?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

class DownloadServiceManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeControllers: Map<string, AbortController> = new Map();
  private listeners: Map<string, Set<DownloadProgressCallback>> = new Map();
  private globalListeners: Set<DownloadProgressCallback> = new Set();
  private objectUrlCache: Map<string, string> = new Map();
  private downloadedSet: Set<string> = new Set();
  private activeProgressMap: Map<string, DownloadProgress> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initSyncCache();
  }

  private async initSyncCache(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const tracks = await this.getAllDownloadedTracks();
      tracks.forEach(t => this.downloadedSet.add(t.id));
      this.isInitialized = true;
    } catch {}
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB tidak didukung pada platform ini.'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  public subscribe(songId: string, callback: DownloadProgressCallback): () => void {
    if (!this.listeners.has(songId)) {
      this.listeners.set(songId, new Set());
    }
    this.listeners.get(songId)!.add(callback);

    // Immediately push current state if active
    const active = this.activeProgressMap.get(songId);
    if (active) {
      try { callback(active); } catch {}
    }

    return () => {
      const set = this.listeners.get(songId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(songId);
      }
    };
  }

  public subscribeGlobal(callback: DownloadProgressCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  private notify(progress: DownloadProgress) {
    this.activeProgressMap.set(progress.songId, progress);

    const set = this.listeners.get(progress.songId);
    if (set) {
      set.forEach(cb => {
        try { cb(progress); } catch {}
      });
    }

    this.globalListeners.forEach(cb => {
      try { cb(progress); } catch {}
    });
  }

  /**
   * Fast synchronous check using memory cache
   */
  public isDownloadedSync(songId: string): boolean {
    return this.downloadedSet.has(songId);
  }

  /**
   * Check if song is actively downloading
   */
  public isDownloading(songId: string): boolean {
    const prog = this.activeProgressMap.get(songId);
    return !!prog && (prog.status === 'preparing' || prog.status === 'downloading');
  }

  public getProgress(songId: string): DownloadProgress | undefined {
    return this.activeProgressMap.get(songId);
  }

  /**
   * Check if song is saved offline in IndexedDB
   */
  public async isDownloaded(songId: string): Promise<boolean> {
    if (this.downloadedSet.has(songId)) return true;
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(songId);
        req.onsuccess = () => {
          const exists = !!req.result;
          if (exists) this.downloadedSet.add(songId);
          resolve(exists);
        };
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Get blob object URL for offline playback
   */
  public async getOfflineAudioUrl(songId: string): Promise<string | null> {
    if (this.objectUrlCache.has(songId)) {
      return this.objectUrlCache.get(songId)!;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(songId);
        req.onsuccess = () => {
          const record: OfflineTrackRecord = req.result;
          if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            this.objectUrlCache.set(songId, url);
            this.downloadedSet.add(songId);
            resolve(url);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Real streaming audio download with chunking and IndexedDB storage
   */
  public async downloadSong(song: Song): Promise<boolean> {
    // 1. Check if already downloaded
    const alreadySaved = await this.isDownloaded(song.id);
    if (alreadySaved) {
      this.notify({
        songId: song.id,
        percent: 100,
        loadedBytes: 0,
        totalBytes: 0,
        status: 'completed'
      });
      return true;
    }

    // 2. Prevent duplicate active downloads
    if (this.activeControllers.has(song.id)) {
      return false;
    }

    const controller = new AbortController();
    this.activeControllers.set(song.id, controller);

    // Initial item in Storage queue
    StorageService.saveDownloadItem({
      song,
      status: 'downloading',
      progress: 5,
      fileSize: '0 MB',
      downloadedAt: Date.now()
    });

    this.notify({
      songId: song.id,
      percent: 5,
      loadedBytes: 0,
      totalBytes: 0,
      status: 'preparing'
    });

    const streamUrl = ApiConfig.resolveStreamUrl(song.streamUrl || song.id);

    try {
      const response = await ApiConfig.safeFetch(streamUrl, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server mengembalikan status HTTP ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : (song.duration || 210) * 16000;
      const mimeType = response.headers.get('content-type') || 'audio/mpeg';

      if (!response.body) {
        throw new Error('ReadableStream audio tidak tersedia.');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;
      let lastReportTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          loadedBytes += value.length;

          const now = performance.now();
          if (now - lastReportTime > 200 || loadedBytes >= totalBytes) {
            lastReportTime = now;
            const pct = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));

            this.notify({
              songId: song.id,
              percent: pct,
              loadedBytes,
              totalBytes,
              status: 'downloading'
            });

            // Update storage record periodically
            StorageService.saveDownloadItem({
              song,
              status: 'downloading',
              progress: pct,
              fileSize: (loadedBytes / (1024 * 1024)).toFixed(1) + ' MB',
              downloadedAt: Date.now()
            });
          }
        }
      }

      // Assemble full audio Blob
      const blob = new Blob(chunks as BlobPart[], { type: mimeType });

      // Save to IndexedDB
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: OfflineTrackRecord = {
          id: song.id,
          song,
          blob,
          sizeBytes: blob.size,
          mimeType,
          downloadedAt: Date.now()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Update sync cache
      this.downloadedSet.add(song.id);

      // Finalize item in StorageService
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(1) + ' MB';
      const item: DownloadItem = {
        song,
        status: 'completed',
        progress: 100,
        fileSize: fileSizeMB,
        downloadedAt: Date.now()
      };
      StorageService.saveDownloadItem(item);

      this.notify({
        songId: song.id,
        percent: 100,
        loadedBytes: blob.size,
        totalBytes: blob.size,
        status: 'completed'
      });

      this.activeControllers.delete(song.id);
      return true;

    } catch (err: any) {
      this.activeControllers.delete(song.id);

      if (err.name === 'AbortError') {
        StorageService.removeDownload(song.id);
        this.notify({
          songId: song.id,
          percent: 0,
          loadedBytes: 0,
          totalBytes: 0,
          status: 'cancelled'
        });
        return false;
      }

      console.error('Download error for song:', song.title, err);
      const isProtected = err.message && (err.message.includes('403') || err.message.includes('copyright'));
      const errorMsg = isProtected
        ? 'Sumber streaming dilindungi hak cipta atau tidak mengizinkan pengunduhan langsung.'
        : `Gagal mengunduh: ${err.message || 'Koneksi terputus'}`;

      StorageService.saveDownloadItem({
        song,
        status: 'failed',
        progress: 0,
        fileSize: '0 MB',
        downloadedAt: Date.now()
      });

      this.notify({
        songId: song.id,
        percent: 0,
        loadedBytes: 0,
        totalBytes: 0,
        status: 'failed',
        errorMessage: errorMsg
      });
      return false;
    }
  }

  /**
   * Cancel an ongoing download
   */
  public cancelDownload(songId: string): void {
    const controller = this.activeControllers.get(songId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(songId);
    }
    StorageService.removeDownload(songId);
    this.notify({
      songId,
      percent: 0,
      loadedBytes: 0,
      totalBytes: 0,
      status: 'cancelled'
    });
  }

  /**
   * Delete offline song from IndexedDB and local storage
   */
  public async deleteDownloadedSong(songId: string): Promise<void> {
    try {
      if (this.objectUrlCache.has(songId)) {
        URL.revokeObjectURL(this.objectUrlCache.get(songId)!);
        this.objectUrlCache.delete(songId);
      }
      this.downloadedSet.delete(songId);

      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(songId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      StorageService.removeDownload(songId);
    } catch (err) {
      console.error('Failed to delete offline song:', err);
    }
  }

  /**
   * Get all offline tracks stored in IndexedDB
   */
  public async getAllDownloadedTracks(): Promise<Song[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const records: OfflineTrackRecord[] = req.result || [];
          resolve(records.map(r => r.song));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const DownloadService = new DownloadServiceManager();
