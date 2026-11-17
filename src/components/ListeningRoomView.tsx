import React, { useState, useEffect, useRef } from 'react';
import {
  Song,
  ListeningRoom,
  RoomParticipant,
  RoomReaction,
  RoomChatMessage,
  SongRequest
} from '../types/music';
import { RoomService } from '../services/roomService';
import { StorageService } from '../services/storage';
import { AudioEngine } from '../services/audioEngine';
import { getEffectiveAvatar, generateInitialAvatar } from '../utils/avatar';
import {
  Users,
  Radio,
  Plus,
  LogIn,
  Copy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  LogOut,
  Crown,
  Send,
  MessageSquare,
  Sparkles,
  ListMusic,
  Disc3,
  Flame,
  Volume2,
  Inbox,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  AlertCircle,
  Bell,
  X
} from 'lucide-react';

interface Props {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  queue: Song[];
  onSelectSong: (song: Song) => void;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onOpenPlayerModal?: () => void;
}

export const ListeningRoomView: React.FC<Props> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  queue,
  onSelectSong,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onOpenPlayerModal
}) => {
  // Lobby State
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [allowGuestControl, setAllowGuestControl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Room State
  const [activeRoom, setActiveRoom] = useState<ListeningRoom | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  // Navigation & Panel State
  const [activeTab, setActiveTab] = useState<'player' | 'chat' | 'queue' | 'requests' | 'members'>('player');
  const [requestFilter, setRequestFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  // Song Request Search Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestCooldownSec, setRequestCooldownSec] = useState(0);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Chat & Reaction State
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<RoomReaction[]>([]);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const currentUser = StorageService.getUserRoomIdentity();

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Cooldown timer countdown
  useEffect(() => {
    if (requestCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setRequestCooldownSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [requestCooldownSec]);

  // Debounced search for song request modal
  useEffect(() => {
    if (!isRequestModalOpen || !requestSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(requestSearchQuery.trim())}`);
        if (res.ok) {
          const songs = await res.json();
          setSearchResults(songs || []);
        }
      } catch {} finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [requestSearchQuery, isRequestModalOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await RoomService.createRoom(
        roomNameInput.trim() || `Studio Sesi ${Math.floor(100 + Math.random() * 900)}`,
        currentUser.name,
        currentSong,
        allowGuestControl
      );

      setActiveRoom(res.room);
      setParticipantId(res.participantId);
      setIsHost(true);
      setChatMessages(res.room.messages || []);

      attachRoomEvents(res.room.code, res.participantId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat room musik.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || roomCodeInput).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Masukkan kode room (contoh: PV8888).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await RoomService.joinRoom(code, currentUser.name);
      setActiveRoom(res.room);
      setParticipantId(res.participantId);
      setIsHost(res.isHost);
      setChatMessages(res.room.messages || []);

      // Synchronize listener playback
      if (!res.isHost && res.room.playbackState.song) {
        const targetSong = res.room.playbackState.song;
        const targetPos = RoomService.calculateTargetPosition(
          res.room.playbackState.position,
          res.room.playbackState.timestamp,
          res.room.playbackState.speed,
          res.room.playbackState.isPlaying
        );

        onSelectSong(targetSong);
        setTimeout(() => {
          onSeek(targetPos);
          if (res.room.playbackState.isPlaying) {
            AudioEngine.getInstance().play().catch(console.error);
          } else {
            AudioEngine.getInstance().pause();
          }
        }, 300);
      }

      attachRoomEvents(res.room.code, res.participantId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Kode room tidak valid atau sudah ditutup.');
    } finally {
      setIsLoading(false);
    }
  };

  // Attach SSE Events and Listeners
  const attachRoomEvents = (code: string, pId: string) => {
    RoomService.connect(code, pId, (event) => {
      if (event.type === 'init') {
        setActiveRoom(event.data);
        setChatMessages(event.data.messages || []);
      } else if (event.type === 'sync') {
        const { playbackState, queue: newQueue, allowGuestControl: newPerm } = event.data;

        setActiveRoom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            playbackState: playbackState || prev.playbackState,
            queue: newQueue || prev.queue,
            allowGuestControl: typeof newPerm === 'boolean' ? newPerm : prev.allowGuestControl
          };
        });

        // Drift synchronization for listeners
        if (!isHost && playbackState) {
          const currentAudio = AudioEngine.getInstance().getAudioElement();
          const targetSong = playbackState.song;

          if (targetSong && (!currentSong || currentSong.id !== targetSong.id)) {
            onSelectSong(targetSong);
          }

          const targetPosition = RoomService.calculateTargetPosition(
            playbackState.position,
            playbackState.timestamp,
            playbackState.speed,
            playbackState.isPlaying
          );

          const drift = Math.abs(currentAudio.currentTime - targetPosition);
          if (drift > 0.75) {
            onSeek(targetPosition);
          }

          if (playbackState.isPlaying && currentAudio.paused) {
            AudioEngine.getInstance().play().catch(console.error);
          } else if (!playbackState.isPlaying && !currentAudio.paused) {
            AudioEngine.getInstance().pause();
          }
        }
      } else if (event.type === 'reaction') {
        setReactions(prev => [event.data, ...prev.slice(0, 15)]);
      } else if (event.type === 'chat') {
        setChatMessages(prev => [...prev, event.data]);
      } else if (event.type === 'participant_joined') {
        setActiveRoom(prev => {
          if (!prev) return null;
          const exists = prev.participants.some(p => p.id === event.data.id);
          return exists ? prev : { ...prev, participants: [...prev.participants, event.data] };
        });
      } else if (event.type === 'participant_left') {
        setActiveRoom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.filter(p => p.id !== event.data.participantId),
            requests: prev.requests?.filter(r => !(r.requesterId === event.data.participantId && r.status === 'pending'))
          };
        });
      } else if (event.type === 'song_requested') {
        const newReq: SongRequest = event.data;
        setActiveRoom(prev => {
          if (!prev) return null;
          const reqs = prev.requests ? [newReq, ...prev.requests] : [newReq];
          return { ...prev, requests: reqs };
        });

        if (isHost) {
          showToast(`Permintaan lagu baru: "${newReq.song.title}" dari @${newReq.requesterUsername}`);
        }
      } else if (event.type === 'request_accepted') {
        const { requestId, request, queue: updatedQueue, notification } = event.data;
        setActiveRoom(prev => {
          if (!prev) return null;
          const updatedReqs = (prev.requests || []).map(r => r.id === requestId ? { ...r, status: 'accepted' as const } : r);
          return { ...prev, requests: updatedReqs, queue: updatedQueue || prev.queue };
        });
        showToast(notification || `Lagu "${request?.song?.title}" diterima oleh Host!`);
      } else if (event.type === 'request_rejected') {
        const { requestId, notification } = event.data;
        setActiveRoom(prev => {
          if (!prev) return null;
          const updatedReqs = (prev.requests || []).map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r);
          return { ...prev, requests: updatedReqs };
        });
        showToast(notification || 'Pengajuan lagu ditolak oleh Host.');
      } else if (event.type === 'request_cancelled') {
        const { requestId } = event.data;
        setActiveRoom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            requests: (prev.requests || []).filter(r => r.id !== requestId)
          };
        });
      } else if (event.type === 'room_ended') {
        alert('Host telah mengakhiri room musik ini.');
        handleLeaveRoom();
      }
    });
  };

  // Host Periodic Playback Broadcast (every 2.5s)
  useEffect(() => {
    if (!activeRoom || !isHost || !participantId) return;

    const interval = setInterval(() => {
      const audio = AudioEngine.getInstance().getAudioElement();
      RoomService.broadcastSync(
        activeRoom.code,
        participantId,
        {
          song: currentSong,
          isPlaying: isPlaying && !audio.paused,
          position: audio.currentTime,
          speed: playbackSpeed
        },
        queue,
        allowGuestControl
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [activeRoom?.code, isHost, participantId, currentSong, isPlaying, playbackSpeed, queue, allowGuestControl]);

  // Host Immediate Playback Changes
  const handleHostControl = (action: 'play' | 'pause' | 'seek' | 'next' | 'prev', value?: number) => {
    if (!activeRoom || (!isHost && !activeRoom.allowGuestControl)) return;

    if (action === 'play') onPlayPause();
    if (action === 'pause') onPlayPause();
    if (action === 'seek' && typeof value === 'number') onSeek(value);
    if (action === 'next') onNext();
    if (action === 'prev') onPrev();

    setTimeout(() => {
      const audio = AudioEngine.getInstance().getAudioElement();
      RoomService.broadcastSync(
        activeRoom.code,
        participantId || '',
        {
          song: currentSong,
          isPlaying: !audio.paused,
          position: audio.currentTime,
          speed: playbackSpeed
        },
        queue,
        allowGuestControl
      );
    }, 80);
  };

  // Submit Song Request (Listener Flow)
  const handleSongSubmit = async (song: Song) => {
    if (!activeRoom || !participantId) return;

    const res = await RoomService.requestSong(activeRoom.code, song, {
      id: participantId,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar
    });

    if (res.success) {
      showToast(`Permintaan lagu "${song.title}" terkirim ke Host.`);
      setIsRequestModalOpen(false);
      setRequestSearchQuery('');
      setRequestCooldownSec(25);
    } else {
      alert(res.error || 'Gagal mengajukan lagu.');
    }
  };

  // Host Responds to Request
  const handleHostRespond = async (requestId: string, action: 'accept' | 'reject') => {
    if (!activeRoom || !participantId || !isHost) return;

    const res = await RoomService.respondToRequest(activeRoom.code, requestId, action, participantId);
    if (!res.success) {
      alert(res.error || 'Gagal memproses permintaan.');
    }
  };

  // Cancel Pending Request
  const handleCancelRequest = async (requestId: string) => {
    if (!activeRoom || !participantId) return;

    const res = await RoomService.cancelRequest(activeRoom.code, requestId, participantId);
    if (!res.success) {
      alert(res.error || 'Gagal membatalkan permintaan.');
    }
  };

  // Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoom || !participantId) return;

    RoomService.sendChat(activeRoom.code, participantId, currentUser.name, chatInput.trim());
    setChatInput('');
  };

  // Send Emoji Reaction
  const handleSendReaction = (emoji: string) => {
    if (!activeRoom) return;
    RoomService.sendReaction(activeRoom.code, currentUser.name, emoji);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (activeRoom && participantId) {
      if (isHost) {
        RoomService.endRoom(activeRoom.code, participantId);
      } else {
        RoomService.leaveRoom(activeRoom.code, participantId);
      }
    }
    setActiveRoom(null);
    setParticipantId(null);
    setIsHost(false);
    RoomService.disconnect();
  };

  // Copy Room Code
  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Requests Breakdown
  const roomRequests = activeRoom?.requests || [];
  const pendingRequests = roomRequests.filter(r => r.status === 'pending');
  const acceptedRequests = roomRequests.filter(r => r.status === 'accepted');
  const rejectedRequests = roomRequests.filter(r => r.status === 'rejected');

  const filteredRequests = requestFilter === 'pending'
    ? pendingRequests
    : requestFilter === 'accepted'
    ? acceptedRequests
    : rejectedRequests;

  // ==========================================================================
  // VIEW: LOBBY (Create / Join Room)
  // ==========================================================================
  if (!activeRoom) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 pb-32 animate-fadeIn select-none text-slate-900 dark:text-white">
        {/* Editorial Top Masthead */}
        <div className="border-b border-black/5 dark:border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff442b]" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 font-bold">
                SYNCHRONIZED AUDIO STUDIO • LIVE SESSIONS
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Dengar Bersama
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Dengarkan musik bersama teman dalam waktu nyata tanpa jeda. Host mengontrol siaran dan anggota dapat mengajukan lagu melalui sistem persetujuan host.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full border border-black/10 dark:border-white/10 bg-slate-200 dark:bg-[#12131a] flex items-center justify-center overflow-hidden">
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="text-right sm:text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">{currentUser.name}</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">@{currentUser.username || 'listener'}</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions Grid: Create vs Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Create Room */}
          <div className="liquid-glass p-6 sm:p-8 space-y-5 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#ff442b]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">Buat Room Baru</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Host Wewenang</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  Nama Sesi Room
                </label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  placeholder="Contoh: Sesi Indie Senja"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Izinkan Tamu Mengontrol Musik</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Jika aktif, anggota dapat menjeda/melewati lagu langsung</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowGuestControl}
                  onChange={(e) => setAllowGuestControl(e.target.checked)}
                  className="w-4 h-4 accent-[#ff442b]"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full py-3.5 bg-[#ff442b] hover:bg-[#e03a22] text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>{isLoading ? 'Membuat Sesi...' : 'Mulai Room Sebagai Host'}</span>
              </button>
            </div>
          </div>

          {/* Box 2: Join by Code */}
          <div className="liquid-glass p-6 sm:p-8 space-y-5 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">Gabung Dengan Kode</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Tamu / Pendengar</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
                  Kode Room (6 Alfanumerik)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="PV8888"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-mono text-base uppercase tracking-widest focus:outline-none"
                />
              </div>

              <button
                onClick={() => handleJoinRoom()}
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 text-white dark:bg-white dark:text-black rounded-xl font-mono text-xs font-black uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>{isLoading ? 'Menghubungkan...' : 'Gabung ke Room Musik'}</span>
              </button>

              {/* Quick join community room */}
              <div className="pt-2 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 hover:border-[#ff442b]/50 transition cursor-pointer" onClick={() => handleJoinRoom('PV8888')}>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Ruang Komunitas Resmi (PV8888)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">Dikelola oleh Fabb • Pemutaran 24/7 Aktif</span>
                  </div>
                  <span className="px-2.5 py-1 bg-[#ff442b]/15 text-[#ff442b] font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#ff442b]/30">
                    Gabung
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: ACTIVE ROOM
  // ==========================================================================
  const activeParticipants = activeRoom.participants || [];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 pb-32 animate-fadeIn select-none text-slate-900 dark:text-white relative">
      {/* Toast Notification Floating Banner */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-white/90 dark:bg-[#141620] backdrop-blur-xl border-l-4 border-[#ff442b] shadow-2xl rounded-r-xl flex items-center gap-3 animate-slideUp text-xs font-medium text-slate-900 dark:text-white max-w-md">
          <Bell className="w-4 h-4 text-[#ff442b] shrink-0" />
          <span className="leading-snug">{toastNotification}</span>
        </div>
      )}

      {/* Room Masthead Header */}
      <div className="liquid-glass p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-black uppercase tracking-widest text-[#ff442b] border border-[#ff442b]/30 px-2 py-0.5 bg-[#ff442b]/10 rounded-full">
              ROOM № {activeRoom.code}
            </span>
            {isHost ? (
              <span className="font-mono text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Anda adalah Host
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-black/5 dark:border-slate-700 px-2 py-0.5 rounded-full">
                Host: {activeRoom.hostName}
              </span>
            )}
            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {activeParticipants.length} Peserta Aktif
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {activeRoom.name}
          </h1>
        </div>

        {/* Room Header Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-slate-100 dark:bg-white/10 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white hover:opacity-80 transition flex items-center gap-1.5"
            title="Salin Kode Undangan"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : activeRoom.code}</span>
          </button>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 bg-[#ff442b] hover:bg-[#e03a22] text-white text-xs font-mono font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajukan Lagu</span>
          </button>

          <button
            onClick={handleLeaveRoom}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isHost ? 'Akhiri Sesi' : 'Keluar'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-black/5 dark:border-white/10 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'player' as const, label: 'Pemutar & Vinyl' },
          { id: 'requests' as const, label: `Permintaan Lagu (${pendingRequests.length} Pending)`, badge: pendingRequests.length > 0 },
          { id: 'queue' as const, label: `Antrean (${activeRoom.queue.length})` },
          { id: 'chat' as const, label: `Obrolan (${chatMessages.length})` },
          { id: 'members' as const, label: `Peserta (${activeParticipants.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-2 px-4 text-xs font-mono uppercase font-bold tracking-wider rounded-xl transition whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{t.label}</span>
              {t.badge && <span className="w-2 h-2 rounded-full bg-[#ff442b] animate-pulse" />}
            </span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PLAYER & VINYL DECK */}
      {/* ============================================================== */}
      {activeTab === 'player' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deck Left Column (2 Cols) */}
          <div className="lg:col-span-2 liquid-glass p-6 sm:p-8 space-y-6 shadow-xl rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Rotating Vinyl Presentation */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
                <div className={`w-full h-full rounded-full bg-[#0a0b0f] border-4 border-[#1c1d27] shadow-2xl flex items-center justify-center overflow-hidden ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                  {currentSong?.thumbnail ? (
                    <img src={currentSong.thumbnail} alt={currentSong.title} className="w-24 h-24 rounded-full object-cover border-2 border-white/20" />
                  ) : (
                    <Disc3 className="w-24 h-24 text-slate-700" />
                  )}
                  <div className="absolute w-6 h-6 rounded-full bg-[#090a0f] border border-white/40" />
                </div>
              </div>

              {/* Current Track Typography */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#ff442b] font-bold block">
                  NOW BROADCASTING LIVE
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {currentSong?.title || 'Belum Ada Lagu Diputar'}
                </h2>
                <p className="text-sm font-semibold text-slate-400">
                  {currentSong?.artist || 'Menunggu siaran host...'}
                </p>

                {currentSong?.requestedBy && (
                  <div className="pt-1">
                    <span className="px-2.5 py-1 bg-[#181924] border border-[#2d3042] font-mono text-[10px] text-purple-300 font-bold uppercase">
                      Diajukan oleh @{currentSong.requestedBy.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Playback Scrubber */}
            <div className="space-y-1.5 pt-2 border-t border-[#dce7f7] dark:border-[#222c45]">
              <div className="flex justify-between text-[11px] font-mono text-[#5d729c] dark:text-[#8fa1c4]">
                <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
              </div>
              <div className="w-full bg-[#dce7f7] dark:bg-[#1a233b] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#142247] dark:bg-[#9ab3f5] rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Tactical Playback Controls with Strict RBAC (Host Only) */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4] uppercase font-bold">
                {isHost ? 'KONTROL HOST AKTIF' : 'SIARAN LANGSUNG HOST'}
              </span>

              {isHost ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleHostControl('prev')}
                    className="p-2 rounded-xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] hover:opacity-85 transition active:scale-90"
                    title="Lagu Sebelumnya"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHostControl(isPlaying ? 'pause' : 'play')}
                    className="p-3 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] transition active:scale-95 shadow-md"
                    title={isPlaying ? 'Jeda Siaran' : 'Mulai Siaran'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={() => handleHostControl('next')}
                    className="p-2 rounded-xl bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#142247] dark:text-[#9ab3f5] hover:opacity-85 transition active:scale-90"
                    title="Lagu Berikutnya"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-xs font-semibold text-[#142247] dark:text-[#9ab3f5]">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#142247] dark:bg-[#9ab3f5] h-full animate-bounce" />
                    <span className="w-0.5 bg-[#142247] dark:bg-[#9ab3f5] h-2 animate-pulse" />
                    <span className="w-0.5 bg-[#142247] dark:bg-[#9ab3f5] h-1.5 animate-bounce" />
                  </div>
                  <span>Mendengarkan Siaran Host</span>
                </div>
              )}
            </div>

            {/* Quick Emoji Reactions */}
            <div className="pt-3 border-t border-[#dce7f7] dark:border-[#222c45] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4] uppercase font-bold mr-1">Reaksi:</span>
              {['🔥', '❤️', '🎵', '👏', '🚀', '🎧'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="px-3 py-1.5 bg-[#edf3fd] dark:bg-[#1a233b] hover:opacity-80 border border-[#d2e2f8] dark:border-[#283556] rounded-xl text-sm transition active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Queue Column (Fantasy Themed) */}
          <div className="bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-2.5">
              <span className="text-xs font-mono uppercase font-bold text-[#142247] dark:text-[#f0f4fc]">
                Antrean Sesi ({activeRoom.queue.length})
              </span>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="text-[11px] font-mono text-[#142247] dark:text-[#9ab3f5] hover:underline font-bold"
              >
                + Ajukan Lagu
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {activeRoom.queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5d729c] dark:text-[#8fa1c4] space-y-2">
                  <ListMusic className="w-8 h-8 opacity-40 text-[#142247] dark:text-[#9ab3f5]" />
                  <p className="text-xs font-semibold">Antrean room masih kosong. Ajukan lagu favoritmu!</p>
                </div>
              ) : (
                activeRoom.queue.map((s, idx) => (
                  <div key={idx} className="p-2.5 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="font-mono text-xs font-bold text-[#5d729c] dark:text-[#8fa1c4] w-4">{idx + 1}</span>
                      <img src={s.thumbnail} alt={s.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">{s.title}</h4>
                        <p className="text-[10px] text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">{s.artist}</p>
                        {s.requestedBy && (
                          <span className="text-[9px] font-mono text-[#2b427b] dark:text-[#9ab3f5] font-bold">
                            Req: @{s.requestedBy.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SONG REQUESTS (HOST APPROVAL / LISTENER STATUS) */}
      {/* ============================================================== */}
      {activeTab === 'requests' && (
        <div className="bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dce7f7] dark:border-[#222c45] pb-4">
            <div>
              <h2 className="text-xl font-black text-[#142247] dark:text-white">Manajemen Permintaan Lagu</h2>
              <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4] mt-0.5">
                {isHost
                  ? 'Sebagai Host, Anda memiliki hak penuh untuk menerima (ACCEPT) atau menolak (REJECT) lagu.'
                  : 'Pantau status pengajuan lagu Anda atau ajukan lagu baru ke Host.'}
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 border border-[#d2e2f8] dark:border-[#283556] bg-[#edf3fd] dark:bg-[#1a233b] p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setRequestFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition ${requestFilter === 'pending' ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247]' : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'}`}
              >
                Menunggu ({pendingRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('accepted')}
                className={`px-3 py-1.5 rounded-lg transition ${requestFilter === 'accepted' ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247]' : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'}`}
              >
                Diterima ({acceptedRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg transition ${requestFilter === 'rejected' ? 'bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247]' : 'text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white'}`}
              >
                Ditolak ({rejectedRequests.length})
              </button>
            </div>
          </div>

          {/* Request List */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center text-[#5d729c] dark:text-[#8fa1c4] space-y-2">
                <Inbox className="w-10 h-10 mx-auto opacity-30 text-[#142247] dark:text-[#9ab3f5]" />
                <p className="text-xs font-semibold">
                  {requestFilter === 'pending' ? 'Belum ada permintaan lagu yang sedang menunggu persetujuan.' : `Belum ada riwayat permintaan ${requestFilter}.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="p-4 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img src={req.song.thumbnail} alt={req.song.title} className="w-12 h-12 object-cover rounded-xl shrink-0 border border-[#dce7f7] dark:border-[#222c45]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#142247] dark:text-white">{req.song.title}</h4>
                      <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">{req.song.artist} • {Math.floor(req.song.duration / 60)}:{String(Math.floor(req.song.duration % 60)).padStart(2, '0')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <img src={req.requesterAvatar} alt={req.requesterName} className="w-4 h-4 rounded-full" />
                        <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4]">
                          Diajukan oleh <strong className="text-[#142247] dark:text-white">@{req.requesterUsername}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Host vs Listener */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {req.status === 'pending' && isHost && (
                      <>
                        <button
                          onClick={() => handleHostRespond(req.id, 'accept')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terima (Accept)</span>
                        </button>
                        <button
                          onClick={() => handleHostRespond(req.id, 'reject')}
                          className="px-4 py-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak (Reject)</span>
                        </button>
                      </>
                    )}

                    {req.status === 'pending' && !isHost && req.requesterId === participantId && (
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#d2e2f8] dark:border-[#283556] text-[#5d729c] dark:text-[#8fa1c4] hover:text-[#142247] dark:hover:text-white text-xs font-semibold transition"
                      >
                        Batalkan Pengajuan
                      </button>
                    )}

                    {req.status === 'accepted' && (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                        ✓ Telah Diterima ke Antrean
                      </span>
                    )}

                    {req.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold">
                        ✕ Ditolak Host
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: QUEUE */}
      {/* ============================================================== */}
      {activeTab === 'queue' && (
        <div className="bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-3">
            <h3 className="text-base font-bold text-[#142247] dark:text-white">Daftar Antrean Musik Sesi</h3>
            <span className="text-xs font-mono text-[#5d729c] dark:text-[#8fa1c4]">{activeRoom.queue.length} Lagu</span>
          </div>

          <div className="space-y-2">
            {activeRoom.queue.length === 0 ? (
              <div className="py-12 text-center text-[#5d729c] dark:text-[#8fa1c4] text-xs font-semibold">
                Antrean room masih kosong. Ajukan lagu favoritmu melalui tombol "Ajukan Lagu"!
              </div>
            ) : (
              activeRoom.queue.map((s, idx) => (
                <div key={idx} className="p-3 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#5d729c] dark:text-[#8fa1c4] w-5">{idx + 1}</span>
                    <img src={s.thumbnail} alt={s.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-[#142247] dark:text-white">{s.title}</h4>
                      <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4]">{s.artist}</p>
                    </div>
                  </div>
                  {s.requestedBy && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] text-[#2b427b] dark:text-[#9ab3f5] font-bold">
                      Req: @{s.requestedBy.username}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CHAT */}
      {/* ============================================================== */}
      {activeTab === 'chat' && (
        <div className="bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-2">
            <span className="text-xs uppercase font-bold text-[#142247] dark:text-[#f0f4fc]">Ruang Obrolan Sesi</span>
            <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4]">Pesan Realtime</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5d729c] dark:text-[#8fa1c4] space-y-2">
                <MessageSquare className="w-8 h-8 opacity-30 text-[#142247] dark:text-[#9ab3f5]" />
                <p className="text-xs font-semibold">
                  Belum ada percakapan. Jadilah yang pertama memulai obrolan!
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#142247] dark:text-white">{msg.participantName}</span>
                    <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#142247] dark:text-slate-200 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl p-2.5 inline-block max-w-lg">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-[#dce7f7] dark:border-[#222c45]">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tulis pesan obrolan..."
              className="flex-1 px-3 py-2 bg-white dark:bg-[#151b2e] border border-[#d2e2f8] dark:border-[#283556] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#142247] hover:opacity-90 text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold rounded-xl transition"
            >
              Kirim
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: MEMBERS (GENUINE PARTICIPANTS ONLY — NO DUMMY USERS) */}
      {/* ============================================================== */}
      {activeTab === 'members' && (
        <div className="bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-3">
            <h3 className="text-base font-bold text-[#142247] dark:text-white">Peserta Terhubung ({activeParticipants.length})</h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">● Live Synchronization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeParticipants.map((p) => (
              <div key={p.id} className="p-3 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl flex items-center gap-3">
                <img src={p.avatar} alt={p.name} className="w-10 h-10 object-cover rounded-full border border-[#dce7f7] dark:border-[#222c45]" />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">{p.name}</h4>
                    {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <span className="text-[10px] font-mono text-[#5d729c] dark:text-[#8fa1c4] block">
                    {p.isHost ? 'Host Sesi' : `@${p.username || 'listener'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {activeParticipants.length <= 1 && (
            <div className="p-4 bg-[#edf3fd] dark:bg-[#1a233b] border border-[#d2e2f8] dark:border-[#283556] rounded-xl text-center text-xs font-medium text-[#5d729c] dark:text-[#8fa1c4]">
              Belum ada pendengar lain di room ini. Bagikan kode <strong className="text-[#142247] dark:text-white font-mono">{activeRoom.code}</strong> untuk mengundang kawan!
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SEARCH & REQUEST SONG */}
      {/* ============================================================== */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white/95 dark:bg-[#12172a] border border-[#A8C5FF] dark:border-[#283556] rounded-3xl shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#dce7f7] dark:border-[#222c45] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#142247] dark:text-white">Ajukan Lagu (Song Request)</h3>
                <p className="text-xs text-[#5d729c] dark:text-[#8fa1c4]">Cari lagu dari katalog musik PAPABVTIFY untuk diajukan ke Host.</p>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-2 rounded-full text-[#5d729c] hover:text-[#142247] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d93be]" />
              <input
                type="text"
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                placeholder="Cari judul lagu, artis, atau album..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl text-xs text-[#142247] dark:text-white placeholder-[#7d93be] focus:outline-none focus:border-[#142247]"
              />
            </div>

            {/* Cooldown Warning if active */}
            {requestCooldownSec > 0 && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Cooldown aktif: {requestCooldownSec}s sebelum pengajuan berikutnya.</span>
              </div>
            )}

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
              {isSearching ? (
                <div className="py-12 text-center text-[#5d729c] dark:text-[#8fa1c4] text-xs">Mencari katalog lagu...</div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-[#5d729c] dark:text-[#8fa1c4] text-xs">
                  {requestSearchQuery ? 'Tidak ada hasil ditemukan.' : 'Ketik kata kunci untuk mulai mencari lagu.'}
                </div>
              ) : (
                searchResults.map((song) => (
                  <div key={song.id} className="p-3 bg-[#f0f5fe] dark:bg-[#161d32] border border-[#d2e2f8] dark:border-[#243152] rounded-xl hover:border-[#A8C5FF] transition flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={song.thumbnail} alt={song.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">{song.title}</h4>
                        <p className="text-[11px] text-[#5d729c] dark:text-[#8fa1c4] truncate font-medium">{song.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSongSubmit(song)}
                      disabled={requestCooldownSec > 0}
                      className="px-3.5 py-1.5 bg-[#142247] hover:opacity-90 disabled:opacity-40 text-white dark:bg-[#9ab3f5] dark:text-[#142247] text-xs font-bold rounded-xl transition shrink-0 active:scale-95 shadow-sm"
                    >
                      Ajukan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
