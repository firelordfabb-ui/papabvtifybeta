import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  MainTab,
  SoundStyle,
  ChillAmbientSound,
  RepeatMode,
  LyricsData,
  RadioStation,
  SleepTimerState,
  PerformanceMode,
  Artist,
  UserProfile,
  UnderwaterConfig,
  PlaybackMode,
  PlaybackContext,
  Playlist
} from './types/music';
import { InnerTubeService, REFERENCE_PLAYLIST } from './services/innertube';
import { LyricsService } from './services/lyrics';
import { AudioEngine } from './services/audioEngine';
import { StorageService } from './services/storage';
import { ArtistService } from './services/artistService';
import { AuthService } from './services/authService';
import { DownloadService } from './services/downloadService';
import { RecommendationEngine } from './services/recommendationEngine';
import { UnderwaterAudio, DEFAULT_UNDERWATER_CONFIG } from './services/underwaterService';
import { Playback } from './services/playbackManager';
import { RoomService } from './services/roomService';
import { ApiConfig } from './services/apiConfig';
import { UserAccount } from './types/music';

// Main View Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { BottomPlayer } from './components/BottomPlayer';
import { BottomNav } from './components/BottomNav';
import { BerandaView } from './components/BerandaView';
import { CariView } from './components/CariView';
import { PustakaView } from './components/PustakaView';
import { RadioView } from './components/RadioView';
import { AudioLabView } from './components/AudioLabView';
import { UnduhanView } from './components/UnduhanView';
import { PodcastView } from './components/PodcastView';
import { FriendsView } from './components/FriendsView';
import { StatistikView } from './components/StatistikView';
import { AboutView } from './components/AboutView';
import { ArtistDetailView } from './components/ArtistDetailView';
import { ListeningRoomView } from './components/ListeningRoomView';
import { SettingsView } from './components/SettingsView';
import { AuroraBackground } from './components/AuroraBackground';
import { UnderwaterBackground } from './components/UnderwaterBackground';

// Modals
import { PlayerModal } from './components/PlayerModal';
import { GoogleConnectModal } from './components/GoogleConnectModal';
import { EditProfileModal } from './components/EditProfileModal';
import { SpeedControlModal } from './components/SpeedControlModal';
import { QueueModal } from './components/QueueModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { FullscreenVisualizerModal } from './components/FullscreenVisualizerModal';
import { PerformanceModeModal } from './components/PerformanceModeModal';
import { UnderwaterControlsModal } from './components/UnderwaterControlsModal';
import { AuthView } from './components/AuthView';
import { WelcomeOnboarding } from './components/WelcomeOnboarding';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('beranda');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Load saved favorites on initial render
  const [songs, setSongs] = useState<Song[]>(() => {
    const favs = StorageService.getFavorites();
    return REFERENCE_PLAYLIST.map(s => ({
      ...s,
      liked: favs.includes(s.id)
    }));
  });

  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    const recents = StorageService.getRecentlyPlayed();
    return recents.length > 0 ? recents[0] : REFERENCE_PLAYLIST[0];
  });

  // Playback & Queue State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(REFERENCE_PLAYLIST[0].duration);
  const [volume, setVolume] = useState<number>(0.85);

  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [soundStyle, setSoundStyle] = useState<SoundStyle>('normal');
  const [ambientSound, setAmbientSound] = useState<ChillAmbientSound>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Core Playback Mode & Active Context State
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(() => Playback.getPlaybackMode());
  const [activePlaybackContext, setActivePlaybackContext] = useState<PlaybackContext | null>(() => Playback.getActiveContext());

  // Queue synchronized with Playback singleton
  const [queue, setQueue] = useState<Song[]>(() => Playback.getQueue());
  const queueRef = useRef<Song[]>(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Subscribe to Playback singleton state changes
  useEffect(() => {
    const unsub = Playback.subscribe(() => {
      setPlaybackMode(Playback.getPlaybackMode());
      setActivePlaybackContext(Playback.getActiveContext());
      const curQueue = Playback.getQueue();
      setQueue(curQueue);
      queueRef.current = curQueue;
      setIsShuffle(Playback.getPlaybackMode() !== 'follow_playlist');
    });
    return unsub;
  }, []);

  // Underwater Mode State
  const [underwaterConfig, setUnderwaterConfig] = useState<UnderwaterConfig>(() => {
    return StorageService.getUnderwaterConfig() || DEFAULT_UNDERWATER_CONFIG;
  });
  const [isUnderwaterModalOpen, setIsUnderwaterModalOpen] = useState<boolean>(false);

  // Dedicated Underwater Sound Effect (Muffled / Mendem DSP Filter) State
  const [underwaterFx, setUnderwaterFx] = useState<{ enabled: boolean; cutoff: number }>(() => {
    return StorageService.getUnderwaterFx();
  });

  useEffect(() => {
    AudioEngine.getInstance().setUnderwaterEffect(underwaterFx.enabled, underwaterFx.cutoff);
  }, []);

  const handleToggleUnderwaterFx = () => {
    const nextEnabled = !underwaterFx.enabled;
    const nextState = { ...underwaterFx, enabled: nextEnabled };
    setUnderwaterFx(nextState);
    StorageService.saveUnderwaterFx(nextState);
    AudioEngine.getInstance().setUnderwaterEffect(nextEnabled, underwaterFx.cutoff);
    setDownloadToast({
      message: nextEnabled ? '🌊 Efek Underwater (Mendem) Aktif! Siap digabung dengan Slowed + Reverb.' : 'Efek Underwater (Mendem) Nonaktif.',
      type: 'info'
    });
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleUnderwaterCutoffChange = (cutoff: number) => {
    const nextState = { ...underwaterFx, cutoff };
    setUnderwaterFx(nextState);
    StorageService.saveUnderwaterFx(nextState);
    AudioEngine.getInstance().setUnderwaterCutoff(cutoff);
  };

  // Active Download Toast Feedback
  const [downloadToast, setDownloadToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Modals Visibility
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isSpeedModalOpen, setIsSpeedModalOpen] = useState<boolean>(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState<boolean>(false);
  const [isVisualizerModalOpen, setIsVisualizerModalOpen] = useState<boolean>(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // User Profile & Identity State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => StorageService.getUserProfile());

  // Check and restore real session on app startup with guaranteed persistence across reboots
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      const cached = AuthService.getCachedUser();
      if (cached) {
        StorageService.setActiveUser(cached.id);
        Playback.resetForUser(cached.id);
        setUserProfile(AuthService.toUserProfile(cached));
        const favs = StorageService.getFavorites();
        setSongs(prev => prev.map(s => ({ ...s, liked: favs.includes(s.id) })));
      }
      // Silently sync latest profile from backend without kicking user out on network delays
      AuthService.fetchMe().then(async user => {
        if (user) {
          StorageService.setActiveUser(user.id);
          await StorageService.hydrateFromBackend(user.id);
          setUserProfile(AuthService.toUserProfile(user));
          const favs = StorageService.getFavorites();
          setSongs(prev => prev.map(s => ({ ...s, liked: favs.includes(s.id) })));
        }
      }).catch(err => {
        console.warn('Session background sync note (offline/local):', err);
      });
    } else {
      StorageService.setActiveUser('guest');
      Playback.resetForUser('guest');
      setIsAuthModalOpen(true);
    }
  }, []);

  const handleAuthSuccess = async (user: UserAccount) => {
    StorageService.setActiveUser(user.id);
    await StorageService.hydrateFromBackend(user.id);
    Playback.resetForUser(user.id);
    const favs = StorageService.getFavorites();
    setSongs(prev => prev.map(s => ({ ...s, liked: favs.includes(s.id) })));
    const profile = AuthService.toUserProfile(user);
    setUserProfile(profile);
    setIsAuthModalOpen(false);
  };

  const handleConfirmLogout = async () => {
    // 1. Disconnect any active Listening Room
    RoomService.disconnect();

    // 2. Pause and clean audio
    try {
      const engine = AudioEngine.getInstance();
      const audio = engine.getAudioElement();
      audio.pause();
      setIsPlaying(false);
    } catch (_) {}

    // 3. Revoke auth session and reset user storage partition
    await AuthService.logout();
    StorageService.clearCurrentSessionCache();
    StorageService.setActiveUser('guest');
    Playback.resetForUser('guest');

    // 4. Reset in-memory songs and user profile state
    const guestFavs = StorageService.getFavorites();
    setSongs(prev => prev.map(s => ({ ...s, liked: guestFavs.includes(s.id) })));
    setUserProfile(StorageService.getUserProfile());
    setCurrentSong(REFERENCE_PLAYLIST[0]);
    setIsLogoutModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Theme State: 'light' (Default matching reference screenshots) vs 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => StorageService.getTheme());

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    StorageService.setTheme(theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }, [theme]);

  const [modalInitialTab, setModalInitialTab] = useState<'player' | 'lyrics'>('player');

  // Lyrics State
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [lyricsOffset, setLyricsOffset] = useState<number>(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Sleep Timer State
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    totalMinutes: 0,
    remainingSeconds: 0,
    targetTimestamp: null,
    fadeout: true
  });

  // Performance Mode State
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => StorageService.getPerformanceMode());

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Apply Adaptive Performance CSS Class
  useEffect(() => {
    StorageService.setPerformanceMode(performanceMode);
    if (typeof document !== 'undefined') {
      if (performanceMode === 'saver') {
        document.body.classList.add('perf-battery-saver');
      } else {
        document.body.classList.remove('perf-battery-saver');
      }
    }
  }, [performanceMode]);

  // Setup OS-level MediaSession API
  const updateMediaSession = useCallback((song: Song) => {
    try {
      if ('mediaSession' in navigator && window.MediaMetadata) {
        const artworkList: MediaImage[] = [];
        if (song.thumbnail && (song.thumbnail.startsWith('http://') || song.thumbnail.startsWith('https://'))) {
          artworkList.push({ src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' });
        }
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title || 'Musik PAPABVTIFY',
          artist: song.artist || 'Artis',
          album: song.album || 'PAPABVTIFY',
          artwork: artworkList
        });

        try { navigator.mediaSession.setActionHandler('play', () => handlePlayPause()); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('pause', () => handlePlayPause()); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev()); } catch (_) {}
        try { navigator.mediaSession.setActionHandler('nexttrack', () => handleNext()); } catch (_) {}
        try {
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
              handleSeek(details.seekTime);
            }
          });
        } catch (_) {}
      }
    } catch (e) {
      console.warn('MediaSession registration error:', e);
    }
  }, [songs]);

  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  const handleNextRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Audio Engine Lifecycle & Listeners
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const audio = engine.getAudioElement();
    audioElementRef.current = audio;
    engine.setVolume(volume);

    if (!audio.src && currentSong) {
      audio.src = ApiConfig.resolveStreamUrl(currentSong.streamUrl || currentSong.id);
      updateMediaSession(currentSong);
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if ('mediaSession' in navigator && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
          });
        } catch (_) {}
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || currentSong?.duration || 210);
    };

    const onEnded = () => {
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        handleNextRef.current();
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
      console.warn('Audio playback error on stream URL:', audio.src);
      if (ApiConfig.isNativePlatform()) {
        setDownloadToast({
          message: '⚠️ Aliran audio terputus. Pastikan server backend di PC (192.168.1.10:5188) aktif atau periksa IP di Pengaturan.',
          type: 'error'
        });
        setTimeout(() => setDownloadToast(null), 5000);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Sleep Timer Background Clock
  useEffect(() => {
    if (!sleepTimer.active || !sleepTimer.targetTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.round((sleepTimer.targetTimestamp! - now) / 1000));

      if (diffSec <= 15 && diffSec > 0 && sleepTimer.fadeout) {
        AudioEngine.getInstance().smoothFadeout(diffSec);
      }

      if (diffSec <= 0) {
        // Stop playback
        AudioEngine.getInstance().pause();
        AudioEngine.getInstance().restoreMasterGain();
        setSleepTimer({
          active: false,
          totalMinutes: 0,
          remainingSeconds: 0,
          targetTimestamp: null,
          fadeout: true
        });
        clearInterval(interval);
      } else {
        setSleepTimer(prev => ({ ...prev, remainingSeconds: diffSec }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.active, sleepTimer.targetTimestamp, sleepTimer.fadeout]);

  // Fetch Synced Lyrics when currentSong changes
  useEffect(() => {
    if (!currentSong || currentSong.isRadio) {
      setLyricsData(null);
      return;
    }

    let isCancelled = false;

    // Load saved song offset
    const savedOffset = StorageService.getSongOffset(currentSong.id);
    setLyricsOffset(savedOffset);

    const loadLyrics = async () => {
      setLyricsData(null);
      const lrc = await LyricsService.fetchLyrics(currentSong.title, currentSong.artist, currentSong.duration);
      if (!isCancelled) {
        setLyricsData(lrc);
      }
    };

    loadLyrics();

    return () => {
      isCancelled = true;
    };
  }, [currentSong?.id]);

  // Play / Pause Toggle
  const handlePlayPause = async () => {
    const engine = AudioEngine.getInstance();
    const audio = engine.getAudioElement();
    if (isPlaying) {
      engine.pause();
    } else {
      if (!audio.src && currentSong) {
        audio.src = ApiConfig.resolveStreamUrl(currentSong.streamUrl || currentSong.id);
      }
      try {
        await engine.play();
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  };

  // Core Playback Controls wired to PlaybackManager (Strict Mode Resolution)
  const handleNext = async () => {
    const nextRes = await Playback.getNextTrack(repeatModeRef.current);
    if (nextRes.song) {
      await handleSelectSong(nextRes.song);
    } else if (nextRes.isEndOfContext) {
      AudioEngine.getInstance().pause();
      setIsPlaying(false);
      setDownloadToast({
        message: '🏁 Selesai memutar playlist.',
        type: 'info'
      });
      setTimeout(() => setDownloadToast(null), 3000);
    }
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  // Previous Track (Strict History Stack & >3s Restart Behavior)
  const handlePrev = () => {
    const engine = AudioEngine.getInstance();
    const audio = engine.getAudioElement();
    const prevRes = Playback.getPreviousTrack(audio.currentTime);

    if (prevRes.shouldRestartCurrent) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (prevRes.song) {
      handleSelectSong(prevRes.song);
    }
  };

  // Skip / Seek Duration (Range 206 Byte Streaming)
  const handleSeek = (seconds: number) => {
    AudioEngine.getInstance().seek(seconds);
    setCurrentTime(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    AudioEngine.getInstance().setVolume(vol);
  };

  const handleSoundStyleChange = (style: SoundStyle) => {
    setSoundStyle(style);
    AudioEngine.getInstance().setSoundStyle(style);
  };

  const handleAmbientSoundChange = (amb: ChillAmbientSound) => {
    setAmbientSound(amb);
    AudioEngine.getInstance().setChillAmbient(amb);
  };

  // Speed Control (Preserves Pitch or Vinyl Pitch-Drop)
  const handleSpeedChange = (speed: number, preservePitch: boolean) => {
    setPlaybackSpeed(speed);
    AudioEngine.getInstance().setPlaybackSpeed(speed, preservePitch);
  };

  // Sleep Timer Handler
  const handleSetSleepTimer = (minutes: number, fadeout: boolean) => {
    const targetMs = Date.now() + minutes * 60 * 1000;
    setSleepTimer({
      active: true,
      totalMinutes: minutes,
      remainingSeconds: minutes * 60,
      targetTimestamp: targetMs,
      fadeout
    });
  };

  const handleCancelSleepTimer = () => {
    AudioEngine.getInstance().restoreMasterGain();
    setSleepTimer({
      active: false,
      totalMinutes: 0,
      remainingSeconds: 0,
      targetTimestamp: null,
      fadeout: true
    });
  };

  // Playback Mode Change & Shuffle Toggle Handlers
  const handlePlaybackModeChange = (mode: PlaybackMode) => {
    Playback.setPlaybackMode(mode);
    setPlaybackMode(mode);
    setIsShuffle(mode !== 'follow_playlist');
    setDownloadToast({
      message: mode === 'follow_playlist'
        ? '📜 Mode: Follow Playlist (Urutan asli playlist)'
        : mode === 'smart_shuffle'
        ? '✨ Mode: Smart Shuffle (Kemiripan genre & mood)'
        : '🔀 Mode: Normal Shuffle (Fisher-Yates acak murni)',
      type: 'info'
    });
    setTimeout(() => setDownloadToast(null), 2500);
  };

  const handleToggleShuffle = () => {
    const nextMode: PlaybackMode = playbackMode === 'follow_playlist' ? 'smart_shuffle' : 'follow_playlist';
    handlePlaybackModeChange(nextMode);
  };

  // Start Playlist Playback with Context Preservation & Mode Selection
  const handlePlayPlaylist = async (playlist: Playlist, startIndex = 0, mode: PlaybackMode = 'follow_playlist') => {
    const trackList = playlist.tracks || playlist.songs || [];
    if (trackList.length === 0) {
      setDownloadToast({ message: 'Playlist tidak memiliki track.', type: 'error' });
      setTimeout(() => setDownloadToast(null), 2500);
      return;
    }

    const playlistTitle = playlist.title || playlist.name || 'Playlist';

    const context: PlaybackContext = {
      id: playlist.id,
      type: 'playlist',
      title: playlistTitle,
      tracks: trackList,
      originalTracks: trackList,
      currentIndex: startIndex
    };

    const targetSong = trackList[startIndex] || trackList[0];
    Playback.setContext(context, targetSong.id, mode);
    await handleSelectSong(targetSong);

    setDownloadToast({
      message: `Memutar "${playlistTitle}" • Mode: ${
        mode === 'follow_playlist' ? 'Follow Playlist 📜' : mode === 'smart_shuffle' ? 'Smart Shuffle ✨' : 'Normal Shuffle 🔀'
      }`,
      type: 'success'
    });
    setTimeout(() => setDownloadToast(null), 3000);
  };

  // Queue Operations wired to PlaybackManager
  const handlePlaySongFromQueue = (song: Song, index: number) => {
    Playback.removeFromQueue(index);
    handleSelectSong(song);
  };

  const handleRemoveFromQueue = (index: number) => {
    Playback.removeFromQueue(index);
  };

  const handleReorderQueue = (fromIndex: number, toIndex: number) => {
    Playback.reorderQueue(fromIndex, toIndex);
  };

  const handleClearQueue = () => {
    Playback.clearQueue();
    setDownloadToast({ message: 'Antrean musik berhasil dikosongkan.', type: 'info' });
    setTimeout(() => setDownloadToast(null), 2500);
  };

  const handleAddToQueue = (song: Song) => {
    Playback.addToQueue(song);
    setDownloadToast({ message: `"${song.title}" ditambahkan ke antrean.`, type: 'info' });
    setTimeout(() => setDownloadToast(null), 2500);
  };

  const handlePlayNext = (song: Song) => {
    Playback.playNext(song);
    setDownloadToast({ message: `"${song.title}" akan diputar berikutnya.`, type: 'info' });
    setTimeout(() => setDownloadToast(null), 2500);
  };

  // Real IndexedDB Offline Audio Download Handler with Honest Progress & Notifications
  const handleDownloadSong = async (song: Song) => {
    try {
      const already = await DownloadService.isDownloaded(song.id);
      if (already) {
        setDownloadToast({ message: `"${song.title}" sudah tersimpan di Musik Offline.`, type: 'info' });
        setTimeout(() => setDownloadToast(null), 2500);
        return;
      }

      setDownloadToast({ message: `Mengunduh "${song.title}"...`, type: 'info' });
      const success = await DownloadService.downloadSong(song);
      if (success) {
        setDownloadToast({ message: `"${song.title}" berhasil diunduh ke memori lokal!`, type: 'success' });
      } else {
        const prog = DownloadService.getProgress(song.id);
        const errMsg = prog?.errorMessage || `Unduhan "${song.title}" gagal.`;
        setDownloadToast({ message: errMsg, type: 'error' });
      }
      setTimeout(() => setDownloadToast(null), 4000);
    } catch (err: any) {
      console.error('Download failed:', err);
      setDownloadToast({ message: `Gagal mengunduh: ${err.message || 'Koneksi terputus'}`, type: 'error' });
      setTimeout(() => setDownloadToast(null), 4000);
    }
  };

  // Toggle Repeat Mode
  const handleToggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  // Toggle Favorite
  const handleToggleLike = (song: Song) => {
    const isNowFav = StorageService.toggleFavorite(song.id);
    setSongs(prev =>
      prev.map(s => (s.id === song.id ? { ...s, liked: isNowFav } : s))
    );
    if (currentSong?.id === song.id) {
      setCurrentSong(prev => (prev ? { ...prev, liked: isNowFav } : null));
    }
  };

  // Select and Play Song (with dynamic imported track resolution & Offline IndexedDB Blob detection)
  const handleSelectSong = async (song: Song) => {
    let playableSong: Song = { ...song };

    // Dynamic resolution for imported tracks from Spotify or external playlists that need live YouTube audio stream
    if (!playableSong.streamUrl && (!playableSong.id || playableSong.id.startsWith('spot_') || playableSong.id.startsWith('import_') || playableSong.id.startsWith('unmatched_'))) {
      try {
        const found = await InnerTubeService.search(`${playableSong.title} ${playableSong.artist}`);
        if (found && found.length > 0) {
          playableSong.id = found[0].id;
          playableSong.streamUrl = ApiConfig.resolveStreamUrl(found[0].streamUrl || found[0].id);
          if (!playableSong.thumbnail) playableSong.thumbnail = found[0].thumbnail;
        }
      } catch (err) {
        console.warn('Playback search resolution note:', err);
      }
    }

    setCurrentSong(playableSong);
    Playback.recordTrackStart(playableSong);
    StorageService.addRecentlyPlayed(playableSong);
    updateMediaSession(playableSong);

    const engine = AudioEngine.getInstance();
    const audio = engine.getAudioElement();

    // Release memory from previously buffered audio stream
    if (audio.src) {
      if (audio.src.startsWith('blob:')) {
        try { URL.revokeObjectURL(audio.src); } catch (_) {}
      }
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (_) {}
    }

    // Check if song has been saved to offline storage
    try {
      const offlineBlobUrl = await DownloadService.getOfflineAudioUrl(playableSong.id);
      if (offlineBlobUrl) {
        audio.src = offlineBlobUrl;
      } else {
        audio.src = ApiConfig.resolveStreamUrl(playableSong.streamUrl || playableSong.id);
      }
    } catch (_) {
      audio.src = ApiConfig.resolveStreamUrl(playableSong.streamUrl || playableSong.id);
    }

    try {
      await engine.play();
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  // Play Live World Radio Station
  const handlePlayStation = async (station: RadioStation) => {
    const radioSong: Song = {
      id: station.id,
      title: station.name,
      artist: `${station.country} • ${station.genre}`,
      album: 'Live Radio',
      duration: 0,
      thumbnail: station.logo,
      streamUrl: station.streamUrl,
      isRadio: true
    };
    handleSelectSong(radioSong);
  };

  // YouTube Live Search Handler with AbortController and 8-second safety timeout
  const searchAbortRef = useRef<AbortController | null>(null);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    StorageService.addSearchQuery(query);

    const timer = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const results = await InnerTubeService.search(query);
      if (!controller.signal.aborted && results && results.length > 0) {
        setSongs(results);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Search failed:', err);
      }
    } finally {
      clearTimeout(timer);
      setIsSearching(false);
    }
  };

  const handleFilterGenre = async (genre: string) => {
    setIsSearching(true);
    try {
      const results = await InnerTubeService.search(genre);
      if (results && results.length > 0) {
        setSongs(results);
      }
    } catch (err) {
      console.error('Filter genre failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenArtist = (artistId: string) => {
    const art = ArtistService.getArtistById(artistId);
    if (art) {
      setSelectedArtist(art);
    }
  };

  const handleShuffleArtistSongs = (artistSongs: Song[]) => {
    if (!artistSongs || artistSongs.length === 0) return;
    const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);
    const first = shuffled[0];
    const rest = shuffled.slice(1);
    handleSelectSong(first);
    setQueue(rest);
    StorageService.saveQueue(rest);
  };

  const handleTabChange = (tab: MainTab) => {
    setSelectedArtist(null);
    setActiveTab(tab);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex select-none ${
      theme === 'light' ? 'bg-[#edf3fd] text-[#142247]' : 'bg-[#070B18] text-[#f0f4fc]'
    }`}>
      {/* Dynamic Backgrounds: Underwater Mode takes priority when active, otherwise Aurora Borealis */}
      {underwaterConfig.enabled ? (
        <UnderwaterBackground config={underwaterConfig} />
      ) : (
        <AuroraBackground />
      )}

      {/* Permanent Desktop Sidebar matching Reference Image */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        className="hidden md:flex"
      />

      {/* Main Dynamic Viewport Column */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
        {/* Desktop Top Header matching Reference Image */}
        <div className="hidden md:block">
          <TopHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onOpenAudioLab={() => handleTabChange('audiolab')}
            ambientSound={ambientSound}
            onAmbientSoundChange={handleAmbientSoundChange}
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenProfile={() => handleTabChange('about')}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            underwaterConfig={underwaterConfig}
            onOpenUnderwaterModal={() => setIsUnderwaterModalOpen(true)}
          />
        </div>

        {/* Mobile Top Navbar with Fast Tools on Small Screens */}
        <div className="md:hidden">
          <Navbar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            ambientSound={ambientSound}
            onAmbientSoundChange={handleAmbientSoundChange}
            onOpenGoogleConnect={() => setIsGoogleModalOpen(true)}
            playbackSpeed={playbackSpeed}
            onOpenSpeedModal={() => setIsSpeedModalOpen(true)}
            sleepTimer={sleepTimer}
            onOpenSleepTimerModal={() => setIsSleepTimerModalOpen(true)}
            onOpenVisualizerModal={() => setIsVisualizerModalOpen(true)}
            performanceMode={performanceMode}
            onOpenPerformanceModal={() => setIsPerformanceModalOpen(true)}
            userProfile={userProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        </div>

        {/* Main Dynamic Viewport */}
        <main className="flex-1 w-full overflow-hidden flex flex-col pb-44 md:pb-28">
          {selectedArtist ? (
            <ArtistDetailView
              artist={selectedArtist}
              onBack={() => setSelectedArtist(null)}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onSelectSong={handleSelectSong}
              onShuffleArtistSongs={handleShuffleArtistSongs}
              onAddToQueue={handleAddToQueue}
              onOpenArtist={handleOpenArtist}
            />
          ) : (
            <>
              {activeTab === 'beranda' && (
                <BerandaView
                  songs={songs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onSelectSong={handleSelectSong}
                  onToggleLike={handleToggleLike}
                  onFilterGenre={handleFilterGenre}
                  onOpenPlayerModal={() => {
                    setModalInitialTab('player');
                    setIsPlayerModalOpen(true);
                  }}
                  onOpenArtist={handleOpenArtist}
                  onOpenListeningRoom={() => handleTabChange('room')}
                />
              )}

              {activeTab === 'cari' && (
                <CariView
                  songs={songs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onSelectSong={handleSelectSong}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSubmit={handleSearchSubmit}
                  isSearching={isSearching}
                  onToggleLike={handleToggleLike}
                  onOpenPlayerModal={() => {
                    setModalInitialTab('player');
                    setIsPlayerModalOpen(true);
                  }}
                  onOpenArtist={handleOpenArtist}
                />
              )}

              {activeTab === 'pustaka' && (
                <PustakaView
                  songs={songs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onSelectSong={handleSelectSong}
                  onToggleLike={handleToggleLike}
                  onOpenPlayerModal={() => {
                    setModalInitialTab('player');
                    setIsPlayerModalOpen(true);
                  }}
                  onOpenArtist={handleOpenArtist}
                  onPlayPlaylist={handlePlayPlaylist}
                  playbackMode={playbackMode}
                />
              )}

              {activeTab === 'room' && (
                <ListeningRoomView
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  playbackSpeed={playbackSpeed}
                  queue={queue}
                  onSelectSong={handleSelectSong}
                  onPlayPause={handlePlayPause}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onSeek={handleSeek}
                  onOpenPlayerModal={() => {
                    setModalInitialTab('player');
                    setIsPlayerModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'audiolab' && (
                <AudioLabView />
              )}

              {activeTab === 'unduhan' && (
                <UnduhanView
                  onSelectSong={handleSelectSong}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                />
              )}

              {activeTab === 'podcast' && (
                <PodcastView
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onSelectSong={handleSelectSong}
                  onOpenPlayerModal={() => {
                    setModalInitialTab('player');
                    setIsPlayerModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'friends' && (
                <FriendsView
                  userProfile={userProfile}
                  onSelectSong={handleSelectSong}
                  onOpenRoom={(code) => {
                    setActiveTab('room');
                  }}
                />
              )}

              {activeTab === 'radio' && (
                <RadioView
                  currentStationUrl={currentSong?.streamUrl || null}
                  isPlaying={isPlaying}
                  onPlayStation={handlePlayStation}
                />
              )}

              {activeTab === 'statistik' && (
                <StatistikView
                  onSelectSong={handleSelectSong}
                />
              )}

              {activeTab === 'pengaturan' && (
                <SettingsView />
              )}

              {activeTab === 'about' && (
                <AboutView
                  userProfile={userProfile}
                  onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onLogout={handleLogout}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Bottom Player Dock */}
      <BottomPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isShuffle={playbackMode !== 'follow_playlist'}
        onToggleShuffle={handleToggleShuffle}
        repeatMode={repeatMode}
        onToggleRepeat={handleToggleRepeat}
        soundStyle={soundStyle}
        onSoundStyleChange={handleSoundStyleChange}
        onToggleLike={handleToggleLike}
        onOpenPlayerModal={() => {
          setModalInitialTab('player');
          setIsPlayerModalOpen(true);
        }}
        onOpenLyrics={() => {
          setModalInitialTab('lyrics');
          setIsPlayerModalOpen(true);
        }}
        onOpenAudioLab={() => setActiveTab('audiolab')}
        onOpenSpeedModal={() => setIsSpeedModalOpen(true)}
        playbackSpeed={playbackSpeed}
        onOpenQueue={() => setIsQueueModalOpen(true)}
        onOpenVisualizer={() => setIsVisualizerModalOpen(true)}
        onDownloadSong={handleDownloadSong}
        isUnderwaterFx={underwaterFx.enabled}
        onToggleUnderwaterFx={handleToggleUnderwaterFx}
        playbackMode={playbackMode}
        onPlaybackModeChange={handlePlaybackModeChange}
        activePlaybackContext={activePlaybackContext}
      />

      {/* Floating Liquid Frosted Bottom Navigation Dock (Mobile) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenGoogleConnect={() => setIsGoogleModalOpen(true)}
      />

      {/* Immersive Full Player & Realtime Synced Lyrics Modal */}
      <ErrorBoundary>
        <PlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isShuffle={playbackMode !== 'follow_playlist'}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onToggleRepeat={handleToggleRepeat}
          soundStyle={soundStyle}
          onSoundStyleChange={handleSoundStyleChange}
          ambientSound={ambientSound}
          onAmbientSoundChange={handleAmbientSoundChange}
          lyricsData={lyricsData}
          lyricsOffset={lyricsOffset}
          setLyricsOffset={setLyricsOffset}
          onToggleLike={handleToggleLike}
          initialTab={modalInitialTab}
          playbackSpeed={playbackSpeed}
          onOpenSpeedModal={() => setIsSpeedModalOpen(true)}
          onOpenQueueModal={() => setIsQueueModalOpen(true)}
          onOpenSleepTimerModal={() => setIsSleepTimerModalOpen(true)}
          onOpenVisualizerModal={() => setIsVisualizerModalOpen(true)}
          onOpenAudioLab={() => {
            setIsPlayerModalOpen(false);
            setActiveTab('audiolab');
          }}
          onDownloadSong={handleDownloadSong}
          isUnderwaterFx={underwaterFx.enabled}
          onToggleUnderwaterFx={handleToggleUnderwaterFx}
          underwaterCutoff={underwaterFx.cutoff}
          onUnderwaterCutoffChange={handleUnderwaterCutoffChange}
          playbackMode={playbackMode}
          onPlaybackModeChange={handlePlaybackModeChange}
          activePlaybackContext={activePlaybackContext}
        />
      </ErrorBoundary>

      {/* Speed Control Modal */}
      <SpeedControlModal
        isOpen={isSpeedModalOpen}
        onClose={() => setIsSpeedModalOpen(false)}
        currentSpeed={playbackSpeed}
        onSpeedChange={handleSpeedChange}
      />

      {/* Queue Modal */}
      <QueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        currentSong={currentSong}
        queue={queue}
        onPlaySongFromQueue={handlePlaySongFromQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onReorderQueue={handleReorderQueue}
        onClearQueue={handleClearQueue}
        onOpenSearch={() => {
          setIsQueueModalOpen(false);
          handleTabChange('cari');
        }}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        sleepTimer={sleepTimer}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
      />

      {/* Fullscreen Visualizer Modal */}
      <FullscreenVisualizerModal
        isOpen={isVisualizerModalOpen}
        onClose={() => setIsVisualizerModalOpen(false)}
        song={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
      />

      {/* Adaptive Performance Mode Modal */}
      <PerformanceModeModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        currentMode={performanceMode}
        onModeSelect={(mode) => setPerformanceMode(mode)}
      />

      {/* Underwater Mode Controls Modal */}
      <UnderwaterControlsModal
        isOpen={isUnderwaterModalOpen}
        onClose={() => setIsUnderwaterModalOpen(false)}
        config={underwaterConfig}
        onChangeConfig={(newCfg) => {
          setUnderwaterConfig(newCfg);
          StorageService.saveUnderwaterConfig(newCfg);
        }}
        isUnderwaterFx={underwaterFx.enabled}
        onToggleUnderwaterFx={handleToggleUnderwaterFx}
        underwaterCutoff={underwaterFx.cutoff}
        onUnderwaterCutoffChange={handleUnderwaterCutoffChange}
      />

      {/* Realtime Action Feedback Toast (Queue & Downloads) */}
      {downloadToast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#142247]/95 dark:bg-[#101A35]/95 backdrop-blur-md text-white text-xs font-semibold shadow-2xl border border-white/20 animate-slideUp">
          <span className={`w-2 h-2 rounded-full ${
            downloadToast.type === 'success' ? 'bg-emerald-400' : downloadToast.type === 'error' ? 'bg-rose-400' : 'bg-cyan-400'
          }`} />
          <span>{downloadToast.message}</span>
        </div>
      )}

      {/* Google Account Connect Modal */}
      <GoogleConnectModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
      />

      {/* Mandatory Onboarding & Authentication Modal */}
      <WelcomeOnboarding
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        canDismiss={userProfile.isLoggedIn}
      />

      {/* Real Session Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
};
