import { 
  Song, 
  Playlist, 
  AudioLabConfig, 
  DownloadItem, 
  UserListeningStats, 
  PerformanceMode, 
  UserProfile, 
  GoogleAccountDetails, 
  UnderwaterConfig, 
  PlaybackMode, 
  PlaybackContext, 
  PlaybackHistoryItem, 
  RecommendationConfig 
} from '../types/music';
import { generateInitialAvatar, getEffectiveAvatar } from '../utils/avatar';
import { AuthService } from './authService';
import { ApiConfig } from './apiConfig';

const GUEST_USER_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Tamu',
  handle: '@guest',
  email: '',
  avatar: generateInitialAvatar('Tamu'),
  avatarType: 'initial',
  bio: 'Akun Tamu PAPABVTIFY. Masuk untuk mengaktifkan sinkronisasi profil & Dengar Bersama.',
  isLoggedIn: false,
  provider: 'guest',
  joinedDate: '-',
  favoriteGenres: []
};

export class StorageService {
  private static activeUserId: string = 'guest';
  private static syncTimeout: any = null;

  /**
   * Sets the active user partition for storage isolation
   */
  public static setActiveUser(userId: string | null): void {
    const newId = userId && userId.trim() ? userId.trim() : 'guest';
    if (this.activeUserId !== newId) {
      this.activeUserId = newId;
      this.migrateLegacyDataIfNeeded();
    }
  }

  public static getActiveUserId(): string {
    return this.activeUserId || 'guest';
  }

  /**
   * Generates a strictly isolated key scoped to active user
   */
  public static getUserKey(baseKey: string): string {
    const uid = this.activeUserId || 'guest';
    return `papabvtify_${uid}_${baseKey}`;
  }

  /**
   * Migrates legacy un-scoped data into active user partition without data loss or leaking
   */
  public static migrateLegacyDataIfNeeded(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const uid = this.activeUserId;
      if (!uid || uid === 'guest') return;

      const keysToMigrate = [
        { legacy: 'papabvtify_favorites_v1', base: 'favorites_v1' },
        { legacy: 'papabvtify_playlists_v1', base: 'playlists_v1' },
        { legacy: 'papabvtify_recent_v1', base: 'recent_v1' },
        { legacy: 'papabvtify_stats_v1', base: 'stats_v1' },
        { legacy: 'papabvtify_audio_lab_v1', base: 'audio_lab_v1' },
        { legacy: 'papabvtify_downloads_v1', base: 'downloads_v1' },
        { legacy: 'papabvtify_queue_v1', base: 'queue_v1' },
        { legacy: 'papabvtify_search_history_v1', base: 'search_history_v1' },
        { legacy: 'papabvtify_followed_artists_v1', base: 'followed_artists_v1' },
        { legacy: 'papabvtify_playback_history_v1', base: 'playback_history_v1' },
        { legacy: 'papabvtify_active_context_v1', base: 'active_context_v1' },
        { legacy: 'papabvtify_playback_mode_v1', base: 'playback_mode_v1' },
        { legacy: 'papabvtify_smart_shuffle_config_v1', base: 'smart_shuffle_config_v1' }
      ];

      for (const item of keysToMigrate) {
        const legacyVal = localStorage.getItem(item.legacy);
        const scopedKey = this.getUserKey(item.base);
        const existingScoped = localStorage.getItem(scopedKey);

        if (legacyVal && !existingScoped) {
          localStorage.setItem(scopedKey, legacyVal);
        }
        // Remove old un-scoped key to prevent bleeding into other accounts
        if (legacyVal) {
          localStorage.removeItem(item.legacy);
        }
      }
    } catch (e) {
      console.warn('Migration of legacy keys skipped:', e);
    }
  }

  /**
   * Debounced sync with server database
   */
  public static triggerSync(): void {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncWithBackend().catch(console.warn);
    }, 1500);
  }

  public static async syncWithBackend(): Promise<void> {
    const token = AuthService.getToken();
    if (!token || this.activeUserId === 'guest') return;

    try {
      await ApiConfig.safeFetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          favorites: this.getFavorites(),
          playlists: this.getPlaylists(),
          recentlyPlayed: this.getRecentlyPlayed(),
          playbackHistory: this.getPlaybackHistory(),
          stats: this.getListeningStats(),
          queue: this.getQueue(),
          searchHistory: this.getSearchHistory(),
          followedArtists: this.getFollowedArtists(),
          audioLab: this.getAudioLabConfig(),
          downloads: this.getDownloads(),
          playbackMode: this.getPlaybackMode(),
          underwaterConfig: this.getUnderwaterConfig()
        })
      });
    } catch (err) {
      console.warn('User cloud sync error:', err);
    }
  }

  public static async hydrateFromBackend(userId: string): Promise<boolean> {
    const token = AuthService.getToken();
    if (!token || !userId || userId === 'guest') return false;

    try {
      const res = await ApiConfig.safeFetch('/api/user/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          this.setActiveUser(userId);

          if (Array.isArray(d.favorites)) {
            localStorage.setItem(this.getUserKey('favorites_v1'), JSON.stringify(d.favorites));
          }
          if (Array.isArray(d.playlists)) {
            localStorage.setItem(this.getUserKey('playlists_v1'), JSON.stringify(d.playlists));
          }
          if (Array.isArray(d.recentlyPlayed)) {
            localStorage.setItem(this.getUserKey('recent_v1'), JSON.stringify(d.recentlyPlayed));
          }
          if (Array.isArray(d.playbackHistory)) {
            localStorage.setItem(this.getUserKey('playback_history_v1'), JSON.stringify(d.playbackHistory));
          }
          if (d.stats && typeof d.stats === 'object') {
            localStorage.setItem(this.getUserKey('stats_v1'), JSON.stringify(d.stats));
          }
          if (Array.isArray(d.queue)) {
            localStorage.setItem(this.getUserKey('queue_v1'), JSON.stringify(d.queue));
          }
          if (Array.isArray(d.searchHistory)) {
            localStorage.setItem(this.getUserKey('search_history_v1'), JSON.stringify(d.searchHistory));
          }
          if (Array.isArray(d.followedArtists)) {
            localStorage.setItem(this.getUserKey('followed_artists_v1'), JSON.stringify(d.followedArtists));
          }
          if (d.audioLab && typeof d.audioLab === 'object') {
            localStorage.setItem(this.getUserKey('audio_lab_v1'), JSON.stringify(d.audioLab));
          }
          if (Array.isArray(d.downloads)) {
            localStorage.setItem(this.getUserKey('downloads_v1'), JSON.stringify(d.downloads));
          }
          if (d.playbackMode) {
            localStorage.setItem(this.getUserKey('playback_mode_v1'), d.playbackMode);
          }
          if (d.underwaterConfig) {
            localStorage.setItem(this.getUserKey('underwater_v1'), JSON.stringify(d.underwaterConfig));
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('Backend user data hydration note:', err);
    }
    return false;
  }

  public static clearCurrentSessionCache(): void {
    this.activeUserId = 'guest';
  }

  // --- FAVORITES (LIKED SONGS) ---
  public static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(this.getUserKey('favorites_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static toggleFavorite(songId: string): boolean {
    try {
      const favs = this.getFavorites();
      const idx = favs.indexOf(songId);
      let isFav = false;
      if (idx >= 0) {
        favs.splice(idx, 1);
        isFav = false;
      } else {
        favs.unshift(songId);
        isFav = true;
      }
      localStorage.setItem(this.getUserKey('favorites_v1'), JSON.stringify(favs));
      this.triggerSync();
      return isFav;
    } catch {
      return false;
    }
  }

  public static isFavorite(songId: string): boolean {
    return this.getFavorites().includes(songId);
  }

  // --- RECENTLY PLAYED ---
  public static getRecentlyPlayed(): Song[] {
    try {
      const data = localStorage.getItem(this.getUserKey('recent_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addRecentlyPlayed(song: Song): void {
    if (!song || !song.id) return;
    try {
      const recents = this.getRecentlyPlayed().filter(s => s.id !== song.id);
      recents.unshift(song);
      localStorage.setItem(this.getUserKey('recent_v1'), JSON.stringify(recents.slice(0, 30)));
      this.recordSongPlay(song);
      this.triggerSync();
    } catch (e) {
      console.warn('Failed to save recently played track:', e);
    }
  }

  // --- PLAYLISTS ---
  public static getPlaylists(): Playlist[] {
    try {
      const data = localStorage.getItem(this.getUserKey('playlists_v1'));
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
  }

  public static savePlaylists(playlists: Playlist[]): void {
    try {
      const userPlaylists = playlists.map(pl => ({
        ...pl,
        userId: pl.userId || this.activeUserId
      }));
      localStorage.setItem(this.getUserKey('playlists_v1'), JSON.stringify(userPlaylists));
      this.triggerSync();
    } catch (e) {
      console.warn('Failed to save playlists:', e);
    }
  }

  public static createPlaylist(title: string, description?: string, songIds?: string[], covers?: string[], songs?: Song[]): Playlist {
    const playlists = this.getPlaylists();
    const resolvedSongs = songs || [];
    const resolvedSongIds = songIds || resolvedSongs.map(s => s.id);
    const resolvedCovers = covers && covers.length > 0
      ? covers
      : (resolvedSongs.length > 0 ? resolvedSongs.slice(0, 4).map(s => s.thumbnail) : []);

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      userId: this.activeUserId,
      title: title.trim(),
      songCount: resolvedSongs.length > 0 ? resolvedSongs.length : resolvedSongIds.length,
      covers: resolvedCovers,
      description: description || 'Playlist kustom',
      songIds: resolvedSongIds,
      songs: resolvedSongs
    };
    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    return newPlaylist;
  }

  public static addSongToPlaylist(playlistId: string, song: Song): void {
    const playlists = this.getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) {
      if (!pl.songs) pl.songs = [];
      if (!pl.songIds) pl.songIds = [];
      if (!pl.songIds.includes(song.id)) {
        pl.songIds.push(song.id);
        pl.songs.push(song);
        pl.songCount = pl.songs.length;
        if (!pl.covers) pl.covers = [];
        if (pl.covers.length < 4 && song.thumbnail) {
          pl.covers.push(song.thumbnail);
        }
        this.savePlaylists(playlists);
      }
    }
  }

  public static deletePlaylist(id: string): void {
    const playlists = this.getPlaylists().filter(p => p.id !== id);
    this.savePlaylists(playlists);
  }

  // --- SEARCH HISTORY ---
  public static getSearchHistory(): string[] {
    try {
      const data = localStorage.getItem(this.getUserKey('search_history_v1'));
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static addSearchQuery(query: string): void {
    const q = query.trim();
    if (!q) return;
    try {
      const history = this.getSearchHistory().filter(item => item.toLowerCase() !== q.toLowerCase());
      history.unshift(q);
      localStorage.setItem(this.getUserKey('search_history_v1'), JSON.stringify(history.slice(0, 10)));
      this.triggerSync();
    } catch {}
  }

  public static removeSearchQuery(query: string): void {
    try {
      const history = this.getSearchHistory().filter(item => item !== query);
      localStorage.setItem(this.getUserKey('search_history_v1'), JSON.stringify(history));
      this.triggerSync();
    } catch {}
  }

  public static clearSearchHistory(): void {
    try {
      localStorage.removeItem(this.getUserKey('search_history_v1'));
      this.triggerSync();
    } catch {}
  }

  // --- LYRICS OFFSET CALIBRATION ---
  public static getSongOffset(songId: string): number {
    try {
      const val = localStorage.getItem(`papabvtify_offset_${songId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static setSongOffset(songId: string, offset: number): void {
    try {
      localStorage.setItem(`papabvtify_offset_${songId}`, offset.toString());
    } catch {}
  }

  // --- AUDIO LAB CONFIGURATION ---
  public static getAudioLabConfig(): AudioLabConfig {
    const defaultConfig: AudioLabConfig = {
      eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      activePreset: 'Flat',
      bassBoostEnabled: false,
      bassBoostIntensity: 40,
      spatialAudioEnabled: false,
      spatialAudioIntensity: 50,
      preampGain: 0,
      softClipping: true,
      volumeNormalization: false,
      customPresets: []
    };

    try {
      const data = localStorage.getItem(this.getUserKey('audio_lab_v1'));
      if (data) {
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch {}

    return defaultConfig;
  }

  public static saveAudioLabConfig(config: AudioLabConfig): void {
    try {
      localStorage.setItem(this.getUserKey('audio_lab_v1'), JSON.stringify(config));
      this.triggerSync();
    } catch (e) {
      console.warn('Failed to save Audio Lab config:', e);
    }
  }

  // --- DOWNLOAD MANAGER ---
  public static getDownloads(): DownloadItem[] {
    try {
      const data = localStorage.getItem(this.getUserKey('downloads_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveDownloads(downloads: DownloadItem[]): void {
    try {
      localStorage.setItem(this.getUserKey('downloads_v1'), JSON.stringify(downloads));
      this.triggerSync();
    } catch (e) {
      console.warn('Failed to save downloads:', e);
    }
  }

  public static saveDownloadItem(item: DownloadItem): void {
    const list = this.getDownloads().filter(d => d.song.id !== item.song.id);
    list.unshift(item);
    this.saveDownloads(list);
  }

  public static addDownload(song: Song): DownloadItem {
    const list = this.getDownloads();
    const existing = list.find(d => d.song.id === song.id);
    if (existing) {
      return existing;
    }

    const newItem: DownloadItem = {
      song: { ...song, downloadAvailable: true },
      status: 'downloading',
      progress: 0,
      fileSize: `${((song.duration * 192) / (8 * 1024)).toFixed(1)} MB`,
      downloadedAt: Date.now()
    };

    list.unshift(newItem);
    this.saveDownloads(list);
    return newItem;
  }

  public static updateDownload(songId: string, updates: Partial<DownloadItem>): void {
    const list = this.getDownloads().map(item => {
      if (item.song.id === songId) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.saveDownloads(list);
  }

  public static removeDownload(songId: string): void {
    const list = this.getDownloads().filter(item => item.song.id !== songId);
    this.saveDownloads(list);
  }

  // --- LISTENING STATISTICS ---
  public static getListeningStats(): UserListeningStats {
    const defaultStats: UserListeningStats = {
      totalListeningSeconds: 0,
      totalSongsPlayed: 0,
      songPlayCounts: {},
      artistPlayCounts: {},
      dailyListeningSeconds: {},
      history: []
    };

    try {
      const data = localStorage.getItem(this.getUserKey('stats_v1'));
      if (data) {
        return { ...defaultStats, ...JSON.parse(data) };
      }
    } catch {}

    return defaultStats;
  }

  public static recordSongPlay(song: Song): void {
    if (!song || !song.id) return;
    try {
      const stats = this.getListeningStats();
      stats.totalSongsPlayed += 1;
      stats.totalListeningSeconds += Math.min(song.duration || 180, 240);

      // Record song counts
      if (!stats.songPlayCounts[song.id]) {
        stats.songPlayCounts[song.id] = { song, count: 0, lastPlayed: Date.now() };
      }
      stats.songPlayCounts[song.id].count += 1;
      stats.songPlayCounts[song.id].lastPlayed = Date.now();

      // Record artist counts
      const artist = song.artist || 'Unknown';
      if (!stats.artistPlayCounts[artist]) {
        stats.artistPlayCounts[artist] = { artist, count: 0, seconds: 0 };
      }
      stats.artistPlayCounts[artist].count += 1;
      stats.artistPlayCounts[artist].seconds += (song.duration || 180);

      // Record daily listening
      const today = new Date().toISOString().split('T')[0];
      stats.dailyListeningSeconds[today] = (stats.dailyListeningSeconds[today] || 0) + (song.duration || 180);

      // Record history entry
      stats.history.unshift({
        song,
        playedAt: Date.now(),
        completedPercent: 100
      });
      stats.history = stats.history.slice(0, 50);

      localStorage.setItem(this.getUserKey('stats_v1'), JSON.stringify(stats));
      this.triggerSync();
    } catch (e) {
      console.warn('Failed to record listening stats:', e);
    }
  }

  public static calculateListeningStreak(): number {
    try {
      const stats = this.getListeningStats();
      const daily = stats.dailyListeningSeconds || {};
      const dates = Object.keys(daily).filter(d => (daily[d] || 0) > 0).sort().reverse();
      if (dates.length === 0) return 0;

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (!dates.includes(todayStr) && !dates.includes(yesterday)) {
        return 0;
      }

      let streak = 0;
      let checkDate = dates.includes(todayStr) ? new Date() : new Date(Date.now() - 86400000);

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (daily[dStr] && daily[dStr] > 0) {
          streak += 1;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }

      return streak;
    } catch {
      return 0;
    }
  }

  public static getWeeklyListeningHours(): number {
    try {
      const stats = this.getListeningStats();
      const daily = stats.dailyListeningSeconds || {};
      let totalSec = 0;
      const now = Date.now();
      for (let i = 0; i < 7; i++) {
        const dStr = new Date(now - i * 86400000).toISOString().split('T')[0];
        totalSec += (daily[dStr] || 0);
      }
      return Math.round((totalSec / 3600) * 10) / 10;
    } catch {
      return 0;
    }
  }

  // --- PERFORMANCE MODE ---
  public static getPerformanceMode(): PerformanceMode {
    try {
      const mode = localStorage.getItem('papabvtify_perf_mode_v1');
      if (mode === 'high' || mode === 'balanced' || mode === 'saver' || mode === 'auto') {
        return mode;
      }
    } catch {}
    return 'balanced';
  }

  public static setPerformanceMode(mode: PerformanceMode): void {
    try {
      localStorage.setItem('papabvtify_perf_mode_v1', mode);
    } catch {}
  }

  // --- QUEUE PERSISTENCE ---
  public static getQueue(): Song[] {
    try {
      const data = localStorage.getItem(this.getUserKey('queue_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveQueue(queue: Song[]): void {
    try {
      localStorage.setItem(this.getUserKey('queue_v1'), JSON.stringify(queue));
    } catch {}
  }

  // --- UNDERWATER MODE PERSISTENCE ---
  public static getUnderwaterConfig(): UnderwaterConfig | null {
    try {
      const data = localStorage.getItem(this.getUserKey('underwater_v1'));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static saveUnderwaterConfig(cfg: UnderwaterConfig): void {
    try {
      localStorage.setItem(this.getUserKey('underwater_v1'), JSON.stringify(cfg));
      this.triggerSync();
    } catch {}
  }

  // --- UNDERWATER DSP SOUND EFFECT PERSISTENCE ---
  public static getUnderwaterFx(): { enabled: boolean; cutoff: number } {
    try {
      const data = localStorage.getItem(this.getUserKey('underwater_fx_v1'));
      return data ? JSON.parse(data) : { enabled: false, cutoff: 480 };
    } catch {
      return { enabled: false, cutoff: 480 };
    }
  }

  public static saveUnderwaterFx(fx: { enabled: boolean; cutoff: number }): void {
    try {
      localStorage.setItem(this.getUserKey('underwater_fx_v1'), JSON.stringify(fx));
    } catch {}
  }

  // --- FOLLOWED ARTISTS ---
  public static getFollowedArtists(): string[] {
    try {
      const data = localStorage.getItem(this.getUserKey('followed_artists_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static toggleFollowArtist(artistId: string): boolean {
    try {
      const artists = this.getFollowedArtists();
      const idx = artists.indexOf(artistId);
      let followed = false;
      if (idx >= 0) {
        artists.splice(idx, 1);
        followed = false;
      } else {
        artists.unshift(artistId);
        followed = true;
      }
      localStorage.setItem(this.getUserKey('followed_artists_v1'), JSON.stringify(artists));
      this.triggerSync();
      return followed;
    } catch {
      return false;
    }
  }

  public static isFollowingArtist(artistId: string): boolean {
    return this.getFollowedArtists().includes(artistId);
  }

  // --- SEARCH CACHE WITH EXPIRATION (15 MIN) ---
  public static getSearchCache(query: string): any | null {
    try {
      const item = localStorage.getItem('papabvtify_search_cache_' + query.toLowerCase().trim());
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > 15 * 60 * 1000) {
        localStorage.removeItem('papabvtify_search_cache_' + query.toLowerCase().trim());
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  public static setSearchCache(query: string, data: any): void {
    try {
      localStorage.setItem(
        'papabvtify_search_cache_' + query.toLowerCase().trim(),
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch {}
  }

  // --- LYRICS CACHE WITH EXPIRATION (7 DAYS) ---
  public static getLyricsCache(key: string): any | null {
    try {
      const item = localStorage.getItem('papabvtify_lyrics_cache_' + key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('papabvtify_lyrics_cache_' + key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  public static setLyricsCache(key: string, data: any): void {
    try {
      localStorage.setItem(
        'papabvtify_lyrics_cache_' + key,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch {}
  }

  // --- USER PROFILE & GOOGLE AUTHENTICATION ---
  public static getUserProfile(): UserProfile {
    try {
      const authUser = AuthService.getCachedUser();
      if (authUser && AuthService.getToken()) {
        return AuthService.toUserProfile(authUser);
      }
      return GUEST_USER_PROFILE;
    } catch {}
    return GUEST_USER_PROFILE;
  }

  public static saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.getUserKey('profile_v2'), JSON.stringify(profile));
      this.setUserRoomIdentity(profile.name, profile.avatar);
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  }

  public static loginWithGoogle(data: {
    name: string;
    email: string;
    avatar: string;
    googleId?: string;
  }): UserProfile {
    const current = this.getUserProfile();
    const googleDetails: GoogleAccountDetails = {
      googleId: data.googleId || 'g_' + Math.random().toString(36).slice(2, 11),
      email: data.email,
      name: data.name,
      avatar: getEffectiveAvatar({ avatar: data.avatar, displayName: data.name }),
      linkedAt: Date.now(),
      syncedPlaylistsCount: 6
    };
    const updated: UserProfile = {
      ...current,
      name: data.name || current.name,
      email: data.email || current.email,
      avatar: googleDetails.avatar,
      isLoggedIn: true,
      provider: 'google',
      googleAccount: googleDetails
    };
    this.saveUserProfile(updated);
    return updated;
  }

  public static logoutGoogle(): UserProfile {
    const current = this.getUserProfile();
    const updated: UserProfile = {
      ...current,
      isLoggedIn: false,
      provider: 'guest',
      googleAccount: undefined
    };
    this.saveUserProfile(updated);
    return updated;
  }

  // --- LISTENING ROOM USER IDENTITY ---
  public static getUserRoomIdentity(): { name: string; avatar: string; username?: string } {
    try {
      const authUser = AuthService.getCachedUser();
      if (authUser) {
        return {
          name: authUser.displayName,
          username: authUser.username,
          avatar: getEffectiveAvatar(authUser)
        };
      }

      const profile = this.getUserProfile();
      if (profile && profile.name && profile.name !== 'Tamu') {
        return {
          name: profile.name,
          username: profile.handle.replace(/^@/, ''),
          avatar: getEffectiveAvatar(profile)
        };
      }
    } catch {}

    return {
      name: 'Pendengar PAPABVTIFY',
      username: 'listener',
      avatar: generateInitialAvatar('Pendengar')
    };
  }

  public static setUserRoomIdentity(name: string, avatar: string): void {
    try {
      localStorage.setItem(this.getUserKey('room_user_v1'), JSON.stringify({ name, avatar }));
    } catch {}
  }

  // --- THEME ---
  public static getTheme(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('papabvtify_theme_v2');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  }

  public static setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem('papabvtify_theme_v2', theme);
    } catch {}
  }

  // --- PLAYBACK CONTEXT & PLAYLIST STATE PERSISTENCE ---
  public static getPlaybackContext(): PlaybackContext | null {
    try {
      const data = localStorage.getItem(this.getUserKey('active_context_v1'));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static savePlaybackContext(context: PlaybackContext | null): void {
    try {
      if (!context) {
        localStorage.removeItem(this.getUserKey('active_context_v1'));
      } else {
        localStorage.setItem(this.getUserKey('active_context_v1'), JSON.stringify(context));
      }
    } catch {}
  }

  // --- PLAYBACK MODE (FOLLOW PLAYLIST / NORMAL SHUFFLE / SMART SHUFFLE) ---
  public static getPlaybackMode(): PlaybackMode {
    try {
      const mode = localStorage.getItem(this.getUserKey('playback_mode_v1')) as PlaybackMode;
      if (mode === 'follow_playlist' || mode === 'normal_shuffle' || mode === 'smart_shuffle') {
        return mode;
      }
    } catch {}
    return 'follow_playlist';
  }

  public static savePlaybackMode(mode: PlaybackMode): void {
    try {
      localStorage.setItem(this.getUserKey('playback_mode_v1'), mode);
      this.triggerSync();
    } catch {}
  }

  // --- PLAYBACK HISTORY STACK (TRUE BACKWARD TRAVERSAL) ---
  public static getPlaybackHistory(): PlaybackHistoryItem[] {
    try {
      const data = localStorage.getItem(this.getUserKey('playback_history_v1'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static savePlaybackHistory(history: PlaybackHistoryItem[]): void {
    try {
      localStorage.setItem(this.getUserKey('playback_history_v1'), JSON.stringify(history.slice(-100)));
      this.triggerSync();
    } catch {}
  }

  // --- SMART SHUFFLE CONFIGURATION ---
  public static getSmartShuffleConfig(): RecommendationConfig {
    try {
      const data = localStorage.getItem(this.getUserKey('smart_shuffle_config_v1'));
      if (data) return JSON.parse(data);
    } catch {}
    return { mode: 'similar_vibes', explorationLevel: 30 };
  }

  public static saveSmartShuffleConfig(config: RecommendationConfig): void {
    try {
      localStorage.setItem(this.getUserKey('smart_shuffle_config_v1'), JSON.stringify(config));
    } catch {}
  }

  // --- CROSS-PLATFORM BACKEND SERVER URL ---
  public static getServerUrl(): string {
    try {
      const val = localStorage.getItem('papabvtify_server_url');
      if (val && val.trim()) return val.trim();
    } catch {}
    return '';
  }

  public static setServerUrl(url: string): void {
    try {
      if (url && url.trim()) {
        localStorage.setItem('papabvtify_server_url', url.trim());
      } else {
        localStorage.removeItem('papabvtify_server_url');
      }
    } catch {}
  }
}
