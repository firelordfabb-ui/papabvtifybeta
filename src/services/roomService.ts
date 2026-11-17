import { ListeningRoom, RoomParticipant, RoomReaction, RoomChatMessage, Song, SongRequest } from '../types/music';
import { StorageService } from './storage';
import { ApiConfig } from './apiConfig';

export type RoomEventCallback = (event: {
  type: 
    | 'init' 
    | 'sync' 
    | 'reaction' 
    | 'chat' 
    | 'participant_joined' 
    | 'participant_left' 
    | 'room_ended'
    | 'song_requested'
    | 'request_accepted'
    | 'request_rejected'
    | 'request_cancelled';
  data: any;
}) => void;

export class RoomService {
  private static eventSource: EventSource | null = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static activeCallback: RoomEventCallback | null = null;

  /**
   * Safely parses JSON response, checking Content-Type to prevent HTML doctype crash
   */
  private static async safeJson(res: Response): Promise<any> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      await res.text().catch(() => '');
      if (res.status === 404) {
        throw new Error('Layanan room atau endpoint tidak ditemukan di server.');
      }
      throw new Error(`Respon server tidak valid (${res.status}).`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Permintaan gagal dengan status ${res.status}.`);
    }
    return data;
  }

  /**
   * Initializes local cross-tab BroadcastChannel for zero-latency local sync
   */
  private static initBroadcastChannel(code: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(`papabvtify_room_${code}`);
        this.broadcastChannel.onmessage = (event) => {
          if (this.activeCallback && event.data) {
            this.activeCallback(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed:', e);
      }
    }
  }

  /**
   * Creates a new listening room on the server
   */
  public static async createRoom(
    roomName: string,
    hostName: string,
    initialSong: Song | null,
    allowGuestControl: boolean = false
  ): Promise<{ room: ListeningRoom; participantId: string; isHost: boolean }> {
    const user = StorageService.getUserRoomIdentity();
    const res = await ApiConfig.safeFetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomName,
        hostName: hostName || user.name,
        username: user.username,
        avatar: user.avatar,
        initialSong,
        allowGuestControl
      })
    });

    const data = await this.safeJson(res);
    return data;
  }

  /**
   * Joins an existing listening room using 6-character room code
   */
  public static async joinRoom(
    code: string,
    participantName: string
  ): Promise<{ room: ListeningRoom; participantId: string; isHost: boolean }> {
    const user = StorageService.getUserRoomIdentity();
    const res = await ApiConfig.safeFetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        name: participantName || user.name,
        username: user.username,
        avatar: user.avatar
      })
    });

    const data = await this.safeJson(res);
    return data;
  }

  /**
   * Connects to Server-Sent Events (SSE) for realtime synchronization
   */
  public static connect(code: string, participantId: string, onEvent: RoomEventCallback) {
    this.disconnect();
    this.activeCallback = onEvent;
    this.initBroadcastChannel(code);

    const sseUrl = ApiConfig.resolveApiUrl(`/api/rooms/events?code=${encodeURIComponent(code)}&participantId=${encodeURIComponent(participantId)}`);
    const es = new EventSource(sseUrl);

    es.addEventListener('init', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'init', data });
      } catch (_) {}
    });

    es.addEventListener('sync', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'sync', data });
      } catch (_) {}
    });

    es.addEventListener('reaction', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'reaction', data });
      } catch (_) {}
    });

    es.addEventListener('chat', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'chat', data });
      } catch (_) {}
    });

    es.addEventListener('participant_joined', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'participant_joined', data });
      } catch (_) {}
    });

    es.addEventListener('participant_left', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'participant_left', data });
      } catch (_) {}
    });

    es.addEventListener('room_ended', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'room_ended', data });
      } catch (_) {}
    });

    // Song Request Events
    es.addEventListener('song_requested', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'song_requested', data });
      } catch (_) {}
    });

    es.addEventListener('request_accepted', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'request_accepted', data });
      } catch (_) {}
    });

    es.addEventListener('request_rejected', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'request_rejected', data });
      } catch (_) {}
    });

    es.addEventListener('request_cancelled', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent({ type: 'request_cancelled', data });
      } catch (_) {}
    });

    es.onerror = () => {
      console.warn('SSE connection interrupted, attempting auto-reconnect...');
    };

    this.eventSource = es;
  }

  /**
   * Submit Song Request (Listener -> Host)
   */
  public static async requestSong(
    code: string,
    song: Song,
    requester: { id: string; name: string; username?: string; avatar?: string }
  ): Promise<{ success: boolean; request?: SongRequest; error?: string }> {
    try {
      const res = await ApiConfig.safeFetch('/api/rooms/request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          song,
          requesterId: requester.id,
          requesterName: requester.name,
          requesterUsername: requester.username || requester.name.toLowerCase().replace(/\s+/g, '_'),
          requesterAvatar: requester.avatar
        })
      });

      const data = await this.safeJson(res);

      // Also dispatch to local broadcast channel
      if (this.broadcastChannel && data.request) {
        try {
          this.broadcastChannel.postMessage({
            type: 'song_requested',
            data: data.request
          });
        } catch (_) {}
      }

      return { success: true, request: data.request };
    } catch (err: any) {
      return { success: false, error: err.message || 'Jaringan bermasalah.' };
    }
  }

  /**
   * Host Responds to Song Request (Accept / Reject) - strictly validated by backend
   */
  public static async respondToRequest(
    code: string,
    requestId: string,
    action: 'accept' | 'reject',
    hostParticipantId: string
  ): Promise<{ success: boolean; error?: string; queue?: Song[] }> {
    try {
      const res = await ApiConfig.safeFetch('/api/rooms/request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          requestId,
          action,
          participantId: hostParticipantId
        })
      });

      const data = await this.safeJson(res);

      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            type: action === 'accept' ? 'request_accepted' : 'request_rejected',
            data: { requestId, action, queue: data.queue }
          });
        } catch (_) {}
      }

      return { success: true, queue: data.queue };
    } catch (err: any) {
      return { success: false, error: err.message || 'Jaringan bermasalah.' };
    }
  }

  /**
   * Listener cancels their pending song request
   */
  public static async cancelRequest(
    code: string,
    requestId: string,
    requesterId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await ApiConfig.safeFetch('/api/rooms/request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, requestId, participantId: requesterId })
      });
      await this.safeJson(res);

      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            type: 'request_cancelled',
            data: { requestId }
          });
        } catch (_) {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Broadcasts playback state (called by Host or authorized Guest)
   */
  public static async broadcastSync(
    code: string,
    participantId: string,
    playbackState: {
      song: Song | null;
      isPlaying: boolean;
      position: number;
      speed: number;
    },
    queue?: Song[],
    allowGuestControl?: boolean
  ) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'sync',
          data: {
            playbackState: {
              ...playbackState,
              timestamp: Date.now()
            },
            queue,
            allowGuestControl
          }
        });
      } catch (_) {}
    }

    try {
      await ApiConfig.safeFetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          participantId,
          playbackState,
          queue,
          allowGuestControl
        })
      });
    } catch (err) {
      console.warn('Failed to broadcast room sync to server:', err);
    }
  }

  /**
   * Sends emoji reaction
   */
  public static async sendReaction(code: string, participantName: string, emoji: string) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'reaction',
          data: {
            id: 'react_local_' + Math.random(),
            participantName,
            emoji,
            timestamp: Date.now()
          }
        });
      } catch (_) {}
    }

    try {
      await ApiConfig.safeFetch('/api/rooms/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, participantName, emoji })
      });
    } catch (_) {}
  }

  /**
   * Sends chat message
   */
  public static async sendChat(code: string, participantId: string, participantName: string, text: string) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'chat',
          data: {
            id: 'chat_local_' + Math.random(),
            participantId,
            participantName,
            text,
            timestamp: Date.now()
          }
        });
      } catch (_) {}
    }

    try {
      await ApiConfig.safeFetch('/api/rooms/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, participantId, participantName, text })
      });
    } catch (_) {}
  }

  /**
   * Leaves active room
   */
  public static async leaveRoom(code: string, participantId: string) {
    this.disconnect();
    try {
      await ApiConfig.safeFetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, participantId })
      });
    } catch (_) {}
  }

  /**
   * Ends room (Host only)
   */
  public static async endRoom(code: string, participantId: string) {
    this.disconnect();
    try {
      await ApiConfig.safeFetch('/api/rooms/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, participantId })
      });
    } catch (_) {}
  }

  /**
   * Disconnects SSE and closes BroadcastChannel
   */
  public static disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (_) {}
      this.broadcastChannel = null;
    }
    this.activeCallback = null;
  }

  /**
   * Computes expected playback position based on host timestamp and elapsed time
   */
  public static calculateTargetPosition(
    hostPosition: number,
    hostTimestamp: number,
    speed: number = 1.0,
    isPlaying: boolean = true
  ): number {
    if (!isPlaying) return hostPosition;
    const elapsedSec = (Date.now() - hostTimestamp) / 1000;
    return Math.max(0, hostPosition + elapsedSec * speed);
  }
}
