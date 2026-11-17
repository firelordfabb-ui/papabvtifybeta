export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  thumbnail: string;
  streamUrl?: string;
  liked?: boolean;
  plays?: string;
  isRadio?: boolean;
  downloadAvailable?: boolean;
  localBlobUrl?: string;
  isRecommended?: boolean;
  recommendationReason?: string;
  genre?: string;
  mood?: string;
  energy?: number;
  tempo?: number;
  requestedBy?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface LyricLine {
  time: number; // in seconds (-1 indicates non-timed / plain lyrics)
  text: string;
  words?: LyricWord[];
}

export interface LyricsData {
  syncType: 'line' | 'plain';
  source: string;
  lines: LyricLine[];
}

export type SoundStyle = 
  | 'normal' 
  | 'slowed_reverb' 
  | 'sped_up' 
  | 'nightcore' 
  | 'lofi' 
  | 'eight_d' 
  | 'concert';

// 8 Combinable Effect Modes
export type EffectCombination = 
  | 'original'
  | 'slowed'
  | 'reverb'
  | 'slowed_reverb'
  | 'underwater'
  | 'slowed_underwater'
  | 'reverb_underwater'
  | 'slowed_reverb_underwater';

export type UnderwaterPresetName = 
  | 'soft_underwater'
  | 'deep_underwater'
  | 'dreamy_underwater'
  | 'dark_underwater'
  | 'slowed_underwater'
  | 'full_underwater';

export interface UnderwaterDSPParams {
  enabled: boolean;
  intensity: number; // 0 - 100%
  cutoffFreq: number; // 150 - 2000 Hz (default 480 Hz)
  resonance: number; // 1.0 - 4.0 (Q factor, default 2.2)
  bassGain: number; // -6 to +12 dB
  midGain: number; // -12 to +6 dB
  trebleGain: number; // -24 to 0 dB
  reverbAmount: number; // 0 - 100%
  wetDry: number; // 0 - 100%
  modulationAmount: number; // 0 - 100%
  bypassAB: boolean;
}

export type RecommendationMode = 'familiar' | 'similar_vibes' | 'discovery';

export interface RecommendationConfig {
  mode: RecommendationMode;
  explorationLevel: number; // 0 - 100%
}

// Playback Modes as specified in system overhaul
export type PlaybackMode = 'follow_playlist' | 'normal_shuffle' | 'smart_shuffle';

export interface PlaybackContext {
  id: string; // playlist id, album id, or 'search', 'favorites', 'all'
  type: 'playlist' | 'album' | 'favorites' | 'search' | 'radio' | 'queue';
  title: string;
  tracks: Song[]; // Active playback track sequence
  originalTracks: Song[]; // Preserved original playlist order
  shuffledTracks?: Song[]; // Preserved Fisher-Yates shuffle order
  currentIndex?: number;
}

export interface PlaybackHistoryItem {
  song: Song;
  contextId: string;
  contextTitle: string;
  timestamp: number;
}

export type ChillAmbientSound = 'none' | 'rain' | 'fireplace' | 'vinyl';

export type UnderwaterPreset = 
  | 'deep_ocean' 
  | 'underwater_cave' 
  | 'coral_reef' 
  | 'abyss' 
  | 'calm_ocean';

export interface UnderwaterConfig {
  enabled: boolean;
  preset: UnderwaterPreset;
  ambientVolume: number; // 0 - 1
  visualIntensity: number; // 0.3 - 1.0
  showBubbles: boolean;
  showLightRays: boolean;
  reduceMotion: boolean;
  lowPerformanceMode: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface Playlist {
  id: string;
  userId?: string;
  title: string;
  name?: string;
  songCount: number;
  covers: string[];
  description?: string;
  songIds?: string[];
  songs?: Song[];
  tracks?: Song[];
}

export interface RadioStation {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  genre: string;
  streamUrl: string;
  logo: string;
  bitrate?: number;
}

export type MainTab = 
  | 'beranda' 
  | 'cari' 
  | 'pustaka' 
  | 'audiolab' 
  | 'room' 
  | 'unduhan' 
  | 'radio' 
  | 'podcast'
  | 'friends'
  | 'statistik' 
  | 'about'
  | 'pengaturan';

// Artist Discovery & Details
export interface ArtistAlbum {
  id: string;
  title: string;
  year: string;
  cover: string;
  songCount: number;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  banner?: string;
  genre: string;
  monthlyListeners?: string;
  bio?: string;
  topSongs: Song[];
  albums: ArtistAlbum[];
  singles: Song[];
  relatedArtists: { id: string; name: string; avatar: string; genre: string }[];
  isFollowed?: boolean;
}

// Listening Room (Dengar Bersama)
export interface RoomParticipant {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
  lastActive: number;
}

export interface RoomReaction {
  id: string;
  participantName: string;
  emoji: string;
  timestamp: number;
}

export interface RoomChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
}

export interface SongRequest {
  id: string;
  roomCode: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  requesterAvatar: string;
  song: Song;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  respondedAt?: number;
}

export interface ListeningRoom {
  code: string; // 6 alphanumeric chars, e.g. "PV7890"
  name: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  allowGuestControl: boolean;
  maxRequestsPerUser?: number;
  playbackState: {
    song: Song | null;
    isPlaying: boolean;
    position: number;
    timestamp: number; // server timestamp when position was recorded
    speed: number;
  };
  queue: Song[];
  requests?: SongRequest[];
  participants: RoomParticipant[];
  reactions: RoomReaction[];
  messages: RoomChatMessage[];
}

// Search Results Categorization
export interface CategorizedSearchResults {
  songs: Song[];
  artists: { id: string; name: string; avatar: string; genre: string }[];
  albums: { id: string; title: string; artist: string; cover: string; year: string }[];
}

// Audio Lab Configuration
export interface AudioLabConfig {
  eqGains: number[]; // 10 bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
  activePreset: string;
  bassBoostEnabled: boolean;
  bassBoostIntensity: number; // 0 - 100%
  spatialAudioEnabled: boolean;
  spatialAudioIntensity: number; // 0 - 100%
  preampGain: number; // -6 to +6 dB
  softClipping: boolean;
  volumeNormalization: boolean;
  customPresets: EQPreset[];
  underwaterFxEnabled?: boolean; // Real-time muffled / mendem DSP filter
  underwaterCutoff?: number; // Cutoff frequency in Hz (default ~480Hz)
  underwaterDsp?: UnderwaterDSPParams;
  activeEffectCombo?: EffectCombination;
}

export interface EQPreset {
  name: string;
  gains: number[];
  isCustom?: boolean;
}

// Download Manager
export interface DownloadItem {
  song: Song;
  status: 'completed' | 'downloading' | 'paused' | 'failed' | 'stream_only';
  progress: number; // 0 - 100
  fileSize: string;
  downloadedAt: number; // timestamp
  blobUrl?: string;
}

// Visualizer Modes
export type VisualizerMode = 
  | 'spectrum' 
  | 'circular' 
  | 'waveform' 
  | 'particles' 
  | 'ambient_glow' 
  | 'minimal_wave';

// Sleep Timer
export interface SleepTimerState {
  active: boolean;
  totalMinutes: number;
  remainingSeconds: number;
  targetTimestamp: number | null;
  fadeout: boolean;
}

// Listening Statistics
export interface PlayHistoryItem {
  song: Song;
  playedAt: number;
  completedPercent: number;
}

export interface UserListeningStats {
  totalListeningSeconds: number;
  totalSongsPlayed: number;
  songPlayCounts: Record<string, { song: Song; count: number; lastPlayed: number }>;
  artistPlayCounts: Record<string, { artist: string; count: number; seconds: number }>;
  dailyListeningSeconds: Record<string, number>; // YYYY-MM-DD -> seconds
  history: PlayHistoryItem[];
}

// Real User Account & Authentication
export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  avatarType: 'initial' | 'geometric' | 'custom';
  bio?: string;
  favoriteGenres?: string[];
  createdAt: number;
  joinedDate: string;
}

// User Profile & Authentication State
export interface GoogleAccountDetails {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  linkedAt: number;
  syncedPlaylistsCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  avatarType?: 'initial' | 'geometric' | 'custom';
  bannerGradient?: string;
  bio: string;
  isLoggedIn: boolean;
  provider: 'auth' | 'google' | 'guest';
  joinedDate: string;
  favoriteGenres: string[];
  googleAccount?: GoogleAccountDetails;
}

// Adaptive Performance Mode
export type PerformanceMode = 'high' | 'balanced' | 'saver' | 'auto';

// Backward compatibility types for legacy modules
export interface LyricWord {
  text: string;
  startTime: number;
  endTime: number;
}

export interface ListeningStreak {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  todayMinutes: number;
  lastListenDate: string;
  canRecover: boolean;
}

export type ActiveNav = 
  | 'home'
  | 'discover'
  | 'browse'
  | 'podcasts'
  | 'radio'
  | 'albums'
  | 'song'
  | 'artists'
  | 'settings';

export type AppTheme = 
  | 'dark_luxury'
  | 'liquid_glass_dark'
  | 'liquid_glass_light'
  | 'midnight_violet'
  | 'amber_glow'
  | 'liquid_glass'
  | 'minimalist'
  | 'kertas';
