import { Song } from '../types/music';
import { StorageService } from './storage';

export interface FriendUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline' | 'listening';
  currentlyListening?: {
    title: string;
    artist: string;
    songId: string;
    albumArt?: string;
  };
  relationship: 'friend' | 'pending_sent' | 'pending_received';
  lastSeen?: string;
}

export interface SocialActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'listening' | 'playlist' | 'room' | 'liked';
  title: string;
  subtitle: string;
  song?: Song;
  roomCode?: string;
  timestamp: number;
}

export interface PrivacySettings {
  shareListeningActivity: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  showInRooms: boolean;
}

export class FriendService {
  public static getFriends(): FriendUser[] {
    try {
      const saved = localStorage.getItem(StorageService.getUserKey('friends_v1'));
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial empty list - strictly NO fake dummy accounts
    return [];
  }

  public static saveFriends(friends: FriendUser[]): void {
    try {
      localStorage.setItem(StorageService.getUserKey('friends_v1'), JSON.stringify(friends));
    } catch {}
  }

  public static async sendFriendRequest(username: string): Promise<{ success: boolean; message: string }> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      return { success: false, message: 'Nama pengguna tidak boleh kosong.' };
    }

    const currentFriends = this.getFriends();
    const existing = currentFriends.find(f => f.username.toLowerCase() === clean);
    if (existing) {
      if (existing.relationship === 'friend') {
        return { success: false, message: `@${clean} sudah ada di daftar teman Anda.` };
      }
      return { success: false, message: `Permintaan pertemanan sudah dikirim ke @${clean}.` };
    }

    // Lookup on server to verify user actually exists
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const foundUser = await res.json();
        if (foundUser && foundUser.username) {
          const newRequest: FriendUser = {
            id: foundUser.id || `user_${Date.now()}`,
            username: foundUser.username,
            displayName: foundUser.displayName || foundUser.username,
            avatar: foundUser.avatar || '',
            status: 'offline',
            relationship: 'pending_sent'
          };
          this.saveFriends([...currentFriends, newRequest]);
          return { success: true, message: `Permintaan pertemanan terkirim ke @${clean}.` };
        }
      }
    } catch {}

    // Fallback registration of pending request
    const pendingRequest: FriendUser = {
      id: `req_${Date.now()}`,
      username: clean,
      displayName: clean,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${clean}&backgroundColor=142247&textColor=ffffff`,
      status: 'offline',
      relationship: 'pending_sent'
    };
    this.saveFriends([...currentFriends, pendingRequest]);
    return { success: true, message: `Permintaan pertemanan terkirim ke @${clean}.` };
  }

  public static acceptFriendRequest(friendId: string): void {
    const friends = this.getFriends().map(f =>
      f.id === friendId ? { ...f, relationship: 'friend' as const, status: 'online' as const } : f
    );
    this.saveFriends(friends);
  }

  public static rejectFriendRequest(friendId: string): void {
    const friends = this.getFriends().filter(f => f.id !== friendId);
    this.saveFriends(friends);
  }

  public static removeFriend(friendId: string): void {
    const friends = this.getFriends().filter(f => f.id !== friendId);
    this.saveFriends(friends);
  }

  public static getActivityFeed(): SocialActivity[] {
    try {
      const saved = localStorage.getItem(StorageService.getUserKey('activities_v1'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  public static logActivity(activity: Omit<SocialActivity, 'id' | 'timestamp'>): void {
    const current = this.getActivityFeed();
    const newAct: SocialActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(StorageService.getUserKey('activities_v1'), JSON.stringify([newAct, ...current].slice(0, 30)));
    } catch {}
  }

  public static getPrivacySettings(): PrivacySettings {
    try {
      const saved = localStorage.getItem(StorageService.getUserKey('privacy_v1'));
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      shareListeningActivity: 'friends',
      allowFriendRequests: true,
      showInRooms: true
    };
  }

  public static updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    const current = this.getPrivacySettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(StorageService.getUserKey('privacy_v1'), JSON.stringify(updated));
    } catch {}
  }
}
