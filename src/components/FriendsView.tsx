import React, { useState, useEffect } from 'react';
import { FriendService, FriendUser, SocialActivity, PrivacySettings } from '../services/friendService';
import { Song, UserProfile } from '../types/music';
import {
  Users,
  UserPlus,
  Radio,
  Check,
  X,
  Shield,
  Activity,
  Music,
  Clock,
  Heart,
  Share2,
  Lock,
  Globe,
  Smile
} from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  onSelectSong: (song: Song) => void;
  onOpenRoom?: (roomCode: string) => void;
}

export const FriendsView: React.FC<Props> = ({
  userProfile,
  onSelectSong,
  onOpenRoom
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'requests' | 'privacy'>('friends');
  const [friends, setFriends] = useState<FriendUser[]>(() => FriendService.getFriends());
  const [activities, setActivities] = useState<SocialActivity[]>(() => FriendService.getActivityFeed());
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => FriendService.getPrivacySettings());

  const [searchUsername, setSearchUsername] = useState('');
  const [searchStatus, setSearchStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRequests = friends.filter(f => f.relationship === 'pending_received');
  const activeFriends = friends.filter(f => f.relationship === 'friend');
  const sentRequests = friends.filter(f => f.relationship === 'pending_sent');

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setIsSubmitting(true);
    setSearchStatus(null);

    const res = await FriendService.sendFriendRequest(searchUsername);
    setIsSubmitting(false);

    setSearchStatus({
      message: res.message,
      isError: !res.success
    });

    if (res.success) {
      setSearchUsername('');
      setFriends(FriendService.getFriends());
    }
  };

  const handleAccept = (friendId: string) => {
    FriendService.acceptFriendRequest(friendId);
    setFriends(FriendService.getFriends());
  };

  const handleReject = (friendId: string) => {
    FriendService.rejectFriendRequest(friendId);
    setFriends(FriendService.getFriends());
  };

  const handleRemove = (friendId: string) => {
    FriendService.removeFriend(friendId);
    setFriends(FriendService.getFriends());
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, val: any) => {
    FriendService.updatePrivacySettings({ [key]: val });
    setPrivacy(FriendService.getPrivacySettings());
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 sm:px-10 py-5 space-y-6 max-w-7xl mx-auto select-none pb-28 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#e1ebfa] via-[#eaf1fd] to-[#f0f5fe] dark:from-[#101A35] dark:via-[#16254c] dark:to-[#1b2b54] border border-[#d2e2f8] dark:border-[#1E2D56] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-[#d2e2f8] dark:border-white/10 text-xs font-bold text-[#142247] dark:text-[#42DDAA]">
            <Users className="w-3.5 h-3.5 text-[#315BCE] dark:text-[#42DDAA]" />
            <span>Social Listening & Aktivitas Teman</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight">
            Teman & Musik Bersama
          </h1>
          <p className="text-xs sm:text-sm text-[#5d729c] dark:text-[#94A6D2]">
            Bagikan selera musik, lihat apa yang sedang didengarkan teman secara realtime, dan nikmati playlist bersama.
          </p>
        </div>

        {/* Add Friend Input Field */}
        <form onSubmit={handleSendRequest} className="w-full sm:w-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Username teman (cth: @fabb)"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] text-xs text-[#142247] dark:text-white placeholder-[#8fa1c4] outline-none focus:border-[#315BCE] w-52 sm:w-64"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !searchUsername.trim()}
            className="px-4 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </form>
      </div>

      {searchStatus && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
          searchStatus.isError
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-[#42DDAA] border border-emerald-500/20'
        }`}>
          <span>{searchStatus.message}</span>
          <button onClick={() => setSearchStatus(null)} className="p-1 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dce7f7] dark:border-[#1E2D56] pb-3">
        {[
          { key: 'friends', label: `Daftar Teman (${activeFriends.length})`, icon: Users },
          { key: 'activity', label: 'Aktivitas Terkini', icon: Activity },
          { key: 'requests', label: `Permintaan (${pendingRequests.length + sentRequests.length})`, icon: UserPlus },
          { key: 'privacy', label: 'Privasi & Keamanan', icon: Shield },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] shadow-sm'
                  : 'text-[#5d729c] dark:text-[#94A6D2] hover:text-[#142247] dark:hover:text-white hover:bg-white dark:hover:bg-[#101A35]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Friends List */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {activeFriends.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-3xl bg-white/60 dark:bg-[#101A35]/60 border border-[#dce7f7] dark:border-[#1E2D56]">
              <div className="w-14 h-14 rounded-2xl bg-[#edf3fd] dark:bg-[#152347] flex items-center justify-center mx-auto text-[#315BCE] dark:text-[#42DDAA]">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#142247] dark:text-white">
                Belum Ada Teman Terhubung
              </h3>
              <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] max-w-sm mx-auto">
                Tambahkan teman menggunakan username mereka pada kolom di atas untuk melihat musik yang sedang mereka dengarkan!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeFriends.map(f => (
                <div
                  key={f.id}
                  className="p-4 rounded-3xl bg-white/90 dark:bg-[#101A35]/90 border border-[#dce7f7] dark:border-[#1E2D56] shadow-sm flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative">
                      <img
                        src={f.avatar}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover border border-black/5 dark:border-white/10"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#101A35] ${
                        f.status === 'listening' ? 'bg-[#42DDAA] animate-pulse' : f.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">
                        {f.displayName}
                      </h4>
                      <p className="text-[11px] font-mono text-[#5d729c] dark:text-[#94A6D2] truncate">
                        @{f.username}
                      </p>
                      {f.currentlyListening && (
                        <p className="text-[10px] text-[#315BCE] dark:text-[#42DDAA] truncate mt-0.5 flex items-center gap-1 font-semibold">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          <span>{f.currentlyListening.title}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(f.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-90"
                    title="Hapus Teman"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Activity Feed */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-3xl bg-white/60 dark:bg-[#101A35]/60 border border-[#dce7f7] dark:border-[#1E2D56]">
              <div className="w-14 h-14 rounded-2xl bg-[#edf3fd] dark:bg-[#152347] flex items-center justify-center mx-auto text-[#315BCE] dark:text-[#42DDAA]">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#142247] dark:text-white">
                Aktivitas Musik Hening
              </h3>
              <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] max-w-sm mx-auto">
                Ketika Anda atau teman Anda memutar musik atau bergabung di Listening Room, aktivitas realtime akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activities.map(act => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#101A35]/90 border border-[#dce7f7] dark:border-[#1E2D56] shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={act.userAvatar}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#142247] dark:text-white leading-snug">
                        <span className="font-black">{act.userName}</span> {act.subtitle}
                      </p>
                      <h4 className="text-xs font-bold text-[#315BCE] dark:text-[#42DDAA] truncate mt-0.5">
                        {act.title}
                      </h4>
                    </div>
                  </div>
                  {act.song && (
                    <button
                      onClick={() => onSelectSong(act.song!)}
                      className="px-3 py-1.5 rounded-xl bg-[#edf3fd] dark:bg-[#1a2548] text-[11px] font-bold text-[#142247] dark:text-white hover:bg-[#142247] hover:text-white dark:hover:bg-[#42DDAA] dark:hover:text-[#070B18] transition flex items-center gap-1.5 shrink-0"
                    >
                      <Music className="w-3 h-3" />
                      <span>Putar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-5">
          {/* Pending Received */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#142247] dark:text-[#EAF0FF]">
              Permintaan Masuk ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] italic">
                Tidak ada permintaan pertemanan yang masuk saat ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingRequests.map(r => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={r.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#142247] dark:text-white truncate">{r.displayName}</h4>
                        <span className="text-[10px] font-mono text-[#5d729c]">@{r.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        title="Terima"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition"
                        title="Tolak"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Sent */}
          <div className="space-y-2.5 pt-2 border-t border-[#dce7f7] dark:border-[#1E2D56]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#142247] dark:text-[#EAF0FF]">
              Permintaan Terkirim ({sentRequests.length})
            </h3>
            {sentRequests.length === 0 ? (
              <p className="text-xs text-[#5d729c] dark:text-[#94A6D2] italic">
                Tidak ada permintaan terkirim yang menunggu.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sentRequests.map(r => (
                  <div key={r.id} className="p-3 rounded-2xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#142247] dark:text-white">@{r.username}</span>
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Menunggu persetujuan</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Privacy Settings */}
      {activeTab === 'privacy' && (
        <div className="max-w-xl space-y-4 rounded-3xl bg-white/90 dark:bg-[#101A35]/90 border border-[#dce7f7] dark:border-[#1E2D56] p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#142247] dark:text-white">
            Pengaturan Visibilitas Sosial
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#edf3fd] dark:bg-[#16254c]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#142247] dark:text-white">Bagikan Musik yang Sedang Diputar</h4>
                <p className="text-[11px] text-[#5d729c] dark:text-[#94A6D2]">Tampilkan lagu aktif ke teman di daftar teman</p>
              </div>
              <select
                value={privacy.shareListeningActivity}
                onChange={(e) => handlePrivacyChange('shareListeningActivity', e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#101A35] text-xs font-bold text-[#142247] dark:text-white border border-[#dce7f7] dark:border-[#1E2D56] outline-none"
              >
                <option value="public">Publik</option>
                <option value="friends">Hanya Teman</option>
                <option value="private">Privat (Sembunyikan)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#edf3fd] dark:bg-[#16254c]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#142247] dark:text-white">Izinkan Permintaan Pertemanan</h4>
                <p className="text-[11px] text-[#5d729c] dark:text-[#94A6D2]">Pengguna lain dapat mengirimkan request ke username Anda</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.allowFriendRequests}
                onChange={(e) => handlePrivacyChange('allowFriendRequests', e.target.checked)}
                className="w-4 h-4 accent-[#315BCE]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
