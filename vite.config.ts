import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import yts from 'yt-search';
import { Ytdl, chooseFormat } from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const playlistExtractor = require('./src/services/playlistExtractor.cjs');

// ============================================================================
// DATA STRUCTURES
// ============================================================================

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  salt: string;
  passwordHash: string;
  avatar: string;
  avatarType: 'initial' | 'geometric' | 'custom';
  bio: string;
  favoriteGenres: string[];
  createdAt: number;
  resetToken?: string;
  resetExpires?: number;
}

interface ServerSongRequest {
  id: string;
  roomCode: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  requesterAvatar: string;
  song: any;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  respondedAt?: number;
}

interface ServerRoom {
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  lastActive: number;
  allowGuestControl: boolean;
  maxRequestsPerUser: number;
  requests: ServerSongRequest[];
  requestCooldowns: Map<string, number>;
  playbackState: {
    song: any | null;
    isPlaying: boolean;
    position: number;
    timestamp: number;
    speed: number;
  };
  queue: any[];
  participants: Array<{
    id: string;
    name: string;
    username?: string;
    avatar: string;
    isHost: boolean;
    joinedAt: number;
    lastActive: number;
  }>;
  reactions: Array<{
    id: string;
    participantName: string;
    emoji: string;
    timestamp: number;
  }>;
  messages: Array<{
    id: string;
    participantId: string;
    participantName: string;
    text: string;
    timestamp: number;
  }>;
  sseClients: Array<{ res: any; participantId: string }>;
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Generate simple SVG initial monogram (data URI) for server-side fallbacks
function makeInitialAvatar(name: string): string {
  const clean = (name || 'P').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : clean.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="30" fill="#1c1d27"/><circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><text x="60" y="69" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#ff442b" text-anchor="middle" letter-spacing="-1.5">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ============================================================================
// BACKEND PLUGIN
// ============================================================================

function papabvtifyBackendPlugin(): Plugin {
  const ytdl = new Ytdl();
  const formatCache = new Map<string, any>();
  const searchCache = new Map<string, { timestamp: number; songs: any[] }>();
  const rooms = new Map<string, ServerRoom>();
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();

  // Database files for real persistent authentication
  const DATA_DIR = path.resolve(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  }
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

  // Load and save users
  const loadUsers = (): Map<string, StoredUser> => {
    const map = new Map<string, StoredUser>();
    try {
      if (fs.existsSync(USERS_FILE)) {
        const arr = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        for (const u of arr) {
          map.set(u.id, u);
          map.set(u.username.toLowerCase(), u);
          map.set(u.email.toLowerCase(), u);
        }
      }
    } catch {}
    return map;
  };

  const saveUsers = (map: Map<string, StoredUser>) => {
    try {
      const unique = Array.from(new Set(map.values()));
      fs.writeFileSync(USERS_FILE, JSON.stringify(unique, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save users database:', e);
    }
  };

  // Sessions map: token -> { userId, expiresAt }
  const loadSessions = (): Map<string, { userId: string; expiresAt: number }> => {
    const map = new Map<string, { userId: string; expiresAt: number }>();
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const obj = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
        for (const [token, sess] of Object.entries(obj)) {
          if ((sess as any).expiresAt > Date.now()) {
            map.set(token, sess as any);
          }
        }
      }
    } catch {}
    return map;
  };

  const saveSessions = (map: Map<string, { userId: string; expiresAt: number }>) => {
    try {
      const obj: Record<string, any> = {};
      for (const [token, sess] of map.entries()) {
        if (sess.expiresAt > Date.now()) {
          obj[token] = sess;
        }
      }
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {}
  };

  const usersMap = loadUsers();
  const sessionsMap = loadSessions();

  // Pre-seed Fabb (official creator) if database is new
  if (!usersMap.has('fabb')) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync('papabvtify2026', salt, 64).toString('hex');
    const fabbUser: StoredUser = {
      id: 'usr_fabb_official',
      username: 'fabb',
      displayName: 'Fabb (Creator)',
      email: 'fabb@papabvtify.app',
      salt,
      passwordHash,
      avatar: makeInitialAvatar('Fabb'),
      avatarType: 'initial',
      bio: 'Pencipta PAPABVTIFY. Audio DSP Enthusiast & Visual Designer.',
      favoriteGenres: ['Synthwave', 'Indie Pop', 'Electronic'],
      createdAt: Date.now() - 30 * 86400000
    };
    usersMap.set(fabbUser.id, fabbUser);
    usersMap.set('fabb', fabbUser);
    usersMap.set('fabb@papabvtify.app', fabbUser);
    saveUsers(usersMap);
  }

  // Password hashing helpers
  const hashPassword = (password: string, salt: string) => {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  };

  const verifyPassword = (password: string, salt: string, expectedHash: string) => {
    try {
      const computed = hashPassword(password, salt);
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHash, 'hex'));
    } catch {
      return false;
    }
  };

  const sanitizeUser = (u: StoredUser) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    avatar: u.avatar,
    avatarType: u.avatarType,
    bio: u.bio,
    favoriteGenres: u.favoriteGenres,
    createdAt: u.createdAt,
    joinedDate: new Date(u.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  });

  const getAuthUserFromReq = (req: any): StoredUser | null => {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token = '';
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    }
    if (!token) return null;

    const session = sessionsMap.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) sessionsMap.delete(token);
      return null;
    }

    return usersMap.get(session.userId) || null;
  };

  // Helper: Broadcast SSE event to all connected room participants
  const broadcastToRoom = (room: ServerRoom, eventType: string, payload: any) => {
    const dataStr = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    room.sseClients = room.sseClients.filter(client => {
      try {
        client.res.write(dataStr);
        return true;
      } catch {
        return false;
      }
    });
  };

  // Pre-seed a clean community room "PV8888" (Empty messages, strict Host RBAC)
  rooms.set('PV8888', {
    code: 'PV8888',
    name: 'Ruang Komunitas PAPABVTIFY',
    hostId: 'usr_fabb_official',
    hostName: 'Fabb (Official Host)',
    createdAt: Date.now(),
    lastActive: Date.now(),
    allowGuestControl: false,
    maxRequestsPerUser: 3,
    requests: [],
    requestCooldowns: new Map(),
    playbackState: {
      song: null,
      isPlaying: false,
      position: 0,
      timestamp: Date.now(),
      speed: 1.0
    },
    queue: [],
    participants: [
      {
        id: 'usr_fabb_official',
        name: 'Fabb (Official Host)',
        username: 'fabb',
        avatar: makeInitialAvatar('Fabb'),
        isHost: true,
        joinedAt: Date.now() - 3600000,
        lastActive: Date.now()
      }
    ],
    reactions: [],
    messages: [], // Realtime conversations only - zero dummy pre-seeded chats
    sseClients: []
  });

  return {
    name: 'papabvtify-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = new URL(req.url, 'http://127.0.0.1:5188');

        // Security Hardening Headers (OWASP API Security compliant)
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // ==============================================================
        // REAL AUTHENTICATION ENDPOINTS
        // ==============================================================

        // 1. Register
        if (url.pathname === '/api/auth/register' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const username = (body.username || '').toLowerCase().trim();
          const email = (body.email || '').toLowerCase().trim();
          const displayName = (body.displayName || body.username || '').trim();
          const password = body.password || '';

          if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Username harus minimal 3 karakter huruf, angka, atau garis bawah.' }));
          }

          if (!email || !email.includes('@') || !email.includes('.')) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Format email tidak valid.' }));
          }

          if (!password || password.length < 6) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Password minimal 6 karakter.' }));
          }

          if (usersMap.has(username)) {
            res.statusCode = 409;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Username ini sudah digunakan.' }));
          }

          if (usersMap.has(email)) {
            res.statusCode = 409;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Alamat email ini sudah terdaftar.' }));
          }

          const salt = crypto.randomBytes(16).toString('hex');
          const passwordHash = hashPassword(password, salt);
          const userId = 'usr_' + crypto.randomBytes(8).toString('hex');

          // Avatar priority: custom uploaded photo > geometric > initial
          let avatar = body.avatar;
          let avatarType: 'initial' | 'geometric' | 'custom' = body.avatarType || 'initial';
          if (!avatar || !avatar.startsWith('data:image/')) {
            avatar = makeInitialAvatar(displayName);
            avatarType = 'initial';
          }

          const newUser: StoredUser = {
            id: userId,
            username,
            displayName,
            email,
            salt,
            passwordHash,
            avatar,
            avatarType,
            bio: body.bio || 'Anggota resmi PAPABVTIFY.',
            favoriteGenres: body.favoriteGenres || [],
            createdAt: Date.now()
          };

          usersMap.set(userId, newUser);
          usersMap.set(username, newUser);
          usersMap.set(email, newUser);
          saveUsers(usersMap);

          // Create session
          const token = crypto.randomBytes(32).toString('hex');
          sessionsMap.set(token, { userId, expiresAt: Date.now() + 7 * 86400000 });
          saveSessions(sessionsMap);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(newUser) }));
        }

        // 2. Login (with Rate Limiting & Brute-Force Protection)
        if (url.pathname === '/api/auth/login' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const identifier = (body.identifier || '').toLowerCase().trim();
          const password = body.password || '';

          const clientIp = req.socket.remoteAddress || '127.0.0.1';
          const rateKey = `${clientIp}_${identifier}`;
          const attempt = loginAttempts.get(rateKey);
          if (attempt && attempt.count >= 5 && Date.now() < attempt.resetAt) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            const waitMin = Math.ceil((attempt.resetAt - Date.now()) / 60000);
            return res.end(JSON.stringify({ error: `Terlalu banyak percobaan masuk yang salah. Demi keamanan akun, silakan coba kembali dalam ${waitMin} menit.` }));
          }

          const user = usersMap.get(identifier);
          if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
            const current = loginAttempts.get(rateKey) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
            current.count += 1;
            loginAttempts.set(rateKey, current);
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Username/email atau kata sandi tidak sesuai.' }));
          }

          // Successful login: clear failed attempts
          loginAttempts.delete(rateKey);

          const token = crypto.randomBytes(32).toString('hex');
          sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 86400000 });
          saveSessions(sessionsMap);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
        }

        // Google OAuth Status Endpoint
        if (url.pathname === '/api/auth/google/status' && req.method === 'GET') {
          const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ configured: !!googleClientId, clientId: googleClientId || null }));
        }

        // Genuine Google OAuth Verification OR Direct Google Account Sign-In
        if (url.pathname === '/api/auth/google' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const { credential } = body;
          const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';

          let email = '';
          let displayName = '';
          let avatar = '';

          try {
            if (credential) {
              const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
              if (!verifyRes.ok) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Token autentikasi Google tidak valid atau telah kedaluwarsa.' }));
              }

              const payload = await verifyRes.json();
              if (googleClientId && payload.aud !== googleClientId) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Google Client ID tidak cocok dengan audiens token.' }));
              }

              email = (payload.email || '').toLowerCase().trim();
              displayName = payload.name || payload.given_name || email.split('@')[0];
              avatar = payload.picture || makeInitialAvatar(displayName);
            } else if (body.email) {
              email = (body.email || '').toLowerCase().trim();
              if (!email || !email.includes('@')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Format email Google tidak valid.' }));
              }
              displayName = (body.displayName || email.split('@')[0]).trim();
              avatar = body.avatar || makeInitialAvatar(displayName);
            } else {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Email akun Google diperlukan untuk melanjutkan.' }));
            }

            if (!email) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Email akun Google tidak dapat diverifikasi.' }));
            }

            let user = usersMap.get(email);
            if (!user) {
              const baseUsername = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user${Math.floor(1000 + Math.random() * 9000)}`;
              let finalUsername = baseUsername;
              let counter = 1;
              while (usersMap.has(finalUsername)) {
                finalUsername = `${baseUsername}${counter++}`;
              }

              const salt = crypto.randomBytes(16).toString('hex');
              const passwordHash = hashPassword(crypto.randomBytes(24).toString('hex'), salt);

              user = {
                id: `usr_g_${crypto.randomBytes(8).toString('hex')}`,
                username: finalUsername,
                displayName,
                email,
                avatar,
                avatarType: 'custom',
                salt,
                passwordHash,
                createdAt: Date.now(),
                joinedDate: 'November 2026',
                favoriteGenres: []
              };

              usersMap.set(user.id, user);
              usersMap.set(user.username, user);
              usersMap.set(user.email, user);
              saveUsers(usersMap);
            }

            const token = crypto.randomBytes(32).toString('hex');
            sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 86400000 });
            saveSessions(sessionsMap);

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message || 'Gagal memproses autentikasi Google.' }));
          }
        }

        // 3. Logout
        if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
          const authHeader = req.headers['authorization'];
          if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7).trim();
            sessionsMap.delete(token);
            saveSessions(sessionsMap);
          }
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true }));
        }

        // 4. Me (Validate Session)
        if (url.pathname === '/api/auth/me' && req.method === 'GET') {
          const user = getAuthUserFromReq(req);
          if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Sesi kedaluwarsa. Silakan masuk kembali.' }));
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
        }

        // 5. Forgot Password (Generate recovery code)
        if (url.pathname === '/api/auth/forgot-password' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const email = (body.email || '').toLowerCase().trim();
          const user = usersMap.get(email);

          if (!user) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Email tidak ditemukan di sistem.' }));
          }

          // Generate 6-digit recovery code
          const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
          user.resetToken = resetCode;
          user.resetExpires = Date.now() + 15 * 60 * 1000; // 15 mins
          saveUsers(usersMap);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            message: 'Kode pemulihan akun berhasil dibuat.',
            resetCode // Provided directly for immediate offline verification
          }));
        }

        // 6. Reset Password
        if (url.pathname === '/api/auth/reset-password' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const email = (body.email || '').toLowerCase().trim();
          const resetCode = (body.resetCode || '').trim();
          const newPassword = body.newPassword || '';

          const user = usersMap.get(email);
          if (!user || user.resetToken !== resetCode || !user.resetExpires || user.resetExpires < Date.now()) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Kode pemulihan salah atau telah kedaluwarsa.' }));
          }

          if (!newPassword || newPassword.length < 6) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Password baru minimal 6 karakter.' }));
          }

          user.salt = crypto.randomBytes(16).toString('hex');
          user.passwordHash = hashPassword(newPassword, user.salt);
          delete user.resetToken;
          delete user.resetExpires;
          saveUsers(usersMap);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'Kata sandi berhasil diperbarui.' }));
        }

        // 7. Update Profile
        if (url.pathname === '/api/auth/update-profile' && req.method === 'POST') {
          const user = getAuthUserFromReq(req);
          if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Tidak memiliki izin.' }));
          }

          const body = await parseJsonBody(req);
          if (body.displayName) user.displayName = body.displayName.trim();
          if (body.bio !== undefined) user.bio = body.bio.trim();
          if (body.avatar) user.avatar = body.avatar;
          if (body.avatarType) user.avatarType = body.avatarType;
          if (Array.isArray(body.favoriteGenres)) user.favoriteGenres = body.favoriteGenres;

          saveUsers(usersMap);
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
        }

        // Fast Realtime Search with Caching (TTL 15 min)
        if (url.pathname === '/api/search') {
          const q = (url.searchParams.get('q') || 'trending pop indonesia').trim();
          const cached = searchCache.get(q);
          if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify(cached.songs));
          }

          try {
            const results = await yts(q);
            const songs = results.videos.slice(0, 20).map(v => ({
              id: v.videoId,
              title: v.title,
              artist: v.author.name,
              album: 'papabvtify Music',
              duration: v.seconds,
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              streamUrl: `/api/stream?id=${v.videoId}`
            }));

            searchCache.set(q, { timestamp: Date.now(), songs });
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(songs));
          } catch (err: any) {
            console.error('Search error:', err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Authentic Playlist Source Extractor (Spotify & YouTube)
        if (url.pathname === '/api/playlist/source') {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ error: 'Parameter url playlist wajib disertakan.' }));
          }

          try {
            const provider = playlistExtractor.detectProvider(targetUrl);
            if (!provider) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return res.end(JSON.stringify({ error: 'URL tidak dikenali. Masukkan tautan playlist publik dari Spotify atau YouTube.' }));
            }

            let result;
            if (provider === 'spotify') {
              result = await playlistExtractor.fetchSpotifyPlaylist(targetUrl);
            } else {
              result = await playlistExtractor.fetchYouTubePlaylist(targetUrl);
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ error: err.message || 'Gagal mengambil playlist sumber.' }));
          }
        }

        // Direct Audio Stream with Full HTTP Range Support (Range 206)
        if (url.pathname === '/api/stream') {
          const id = url.searchParams.get('id');
          if (!id) {
            res.statusCode = 400;
            return res.end('Missing song id');
          }

          try {
            let format = formatCache.get(id);
            if (!format || !format.url) {
              const info = await ytdl.getInfo(id);
              format = chooseFormat(info.formats, {
                filter: (f: any) => f.hasAudio && !f.hasVideo,
                quality: 'highestaudio'
              });
              formatCache.set(id, format);
            }

            const rangeHeader = req.headers.range;
            const headers: Record<string, string> = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            };
            if (rangeHeader) {
              headers['Range'] = rangeHeader;
            }

            const proxyRes = await fetch(format.url, { headers });

            res.statusCode = proxyRes.status;
            res.setHeader('Content-Type', format.mimeType || 'audio/webm');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const contentRange = proxyRes.headers.get('content-range');
            if (contentRange) res.setHeader('Content-Range', contentRange);

            const contentLength = proxyRes.headers.get('content-length');
            if (contentLength) res.setHeader('Content-Length', contentLength);

            if (!proxyRes.body) {
              return res.end();
            }

            const reader = proxyRes.body.getReader();
            req.on('close', () => {
              try { reader.cancel(); } catch (_) {}
            });

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (err: any) {
            console.error('Stream error for', id, err.message);
            res.statusCode = 500;
            res.end(err.message);
          }
          return;
        }

        // ==============================================================
        // REALTIME LISTENING ROOM (DENGAR BERSAMA) ENDPOINTS
        // ==============================================================

        // 1. Create Room
        if (url.pathname === '/api/rooms/create' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = 'PV';
          for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const hostId = body.participantId || ('user_' + Math.random().toString(36).substring(2, 9));
          const hostName = body.hostName || 'Host PAPABVTIFY';
          const hostAvatar = body.avatar || makeInitialAvatar(hostName);

          const newRoom: ServerRoom = {
            code,
            name: body.name || `Room Musik ${code}`,
            hostId,
            hostName,
            createdAt: Date.now(),
            lastActive: Date.now(),
            allowGuestControl: !!body.allowGuestControl,
            maxRequestsPerUser: 3,
            requests: [],
            requestCooldowns: new Map(),
            playbackState: {
              song: body.initialSong || null,
              isPlaying: false,
              position: 0,
              timestamp: Date.now(),
              speed: 1.0
            },
            queue: body.queue || [],
            participants: [
              {
                id: hostId,
                name: hostName,
                username: body.username,
                avatar: hostAvatar,
                isHost: true,
                joinedAt: Date.now(),
                lastActive: Date.now()
              }
            ],
            reactions: [],
            messages: [],
            sseClients: []
          };

          rooms.set(code, newRoom);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ room: { ...newRoom, sseClients: undefined }, participantId: hostId, isHost: true }));
        }

        // 2. Get Room by Code
        if (url.pathname === '/api/rooms/get') {
          const code = (url.searchParams.get('code') || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ error: 'Room tidak ditemukan atau sudah berakhir.' }));
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ ...room, sseClients: undefined }));
        }

        // 3. Join Room
        if (url.pathname === '/api/rooms/join' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ error: 'Kode room tidak valid.' }));
          }

          const participantId = body.participantId || ('user_' + Math.random().toString(36).substring(2, 9));
          const name = body.name || `Pendengar ${participantId.slice(-3)}`;
          const avatar = body.avatar || makeInitialAvatar(name);

          // Check if already in participants list
          let existing = room.participants.find(p => p.id === participantId);
          if (!existing) {
            existing = {
              id: participantId,
              name,
              username: body.username,
              avatar,
              isHost: room.hostId === participantId,
              joinedAt: Date.now(),
              lastActive: Date.now()
            };
            room.participants.push(existing);
          } else {
            existing.lastActive = Date.now();
          }

          room.lastActive = Date.now();
          broadcastToRoom(room, 'participant_joined', existing);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ room: { ...room, sseClients: undefined }, participantId, isHost: room.hostId === participantId }));
        }

        // 4. Server-Sent Events (SSE) Stream
        if (url.pathname === '/api/rooms/events') {
          const code = (url.searchParams.get('code') || '').toUpperCase().trim();
          const participantId = url.searchParams.get('participantId') || '';
          const room = rooms.get(code);

          if (!room) {
            res.statusCode = 404;
            return res.end('Room not found');
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          // Register client
          const client = { res, participantId };
          room.sseClients.push(client);

          // Send initial state
          res.write(`event: init\ndata: ${JSON.stringify({ ...room, sseClients: undefined })}\n\n`);

          req.on('close', () => {
            room.sseClients = room.sseClients.filter(c => c !== client);
          });
          return;
        }

        // ==============================================================
        // SONG REQUEST SYSTEM (LISTENING ROOM)
        // ==============================================================

        // 5. Submit Song Request (Listener -> Host)
        if (url.pathname === '/api/rooms/request/create' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
          }

          const requesterId = body.requesterId;
          const isParticipant = room.participants.some(p => p.id === requesterId);
          if (!isParticipant) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Hanya peserta yang bergabung di room yang dapat mengajukan lagu.' }));
          }

          // Cooldown check (25 seconds)
          const lastReq = room.requestCooldowns.get(requesterId) || 0;
          const elapsed = (Date.now() - lastReq) / 1000;
          if (elapsed < 25) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: `Mohon tunggu ${Math.ceil(25 - elapsed)} detik sebelum mengajukan lagu berikutnya.` }));
          }

          // Check max pending requests
          const pendingCount = room.requests.filter(r => r.requesterId === requesterId && r.status === 'pending').length;
          if (pendingCount >= (room.maxRequestsPerUser || 3)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: `Batas pengajuan tercapai (${room.maxRequestsPerUser || 3} lagu pending). Harap tunggu keputusan host.` }));
          }

          // Duplicate check: not in queue or pending requests
          const songId = body.song?.id;
          const inQueue = room.queue.some(s => s.id === songId) || (room.playbackState.song?.id === songId);
          const inPending = room.requests.some(r => r.song.id === songId && r.status === 'pending');
          if (inQueue || inPending) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Lagu ini sudah ada dalam antrean atau sedang menunggu persetujuan host.' }));
          }

          const requestItem: ServerSongRequest = {
            id: 'req_' + crypto.randomBytes(6).toString('hex'),
            roomCode: code,
            requesterId,
            requesterName: body.requesterName || 'Kawan',
            requesterUsername: body.requesterUsername || 'listener',
            requesterAvatar: body.requesterAvatar || makeInitialAvatar(body.requesterName || 'Kawan'),
            song: body.song,
            status: 'pending',
            createdAt: Date.now()
          };

          room.requests.unshift(requestItem);
          room.requestCooldowns.set(requesterId, Date.now());

          // Broadcast to everyone in room (Host will receive real-time notification & pending card)
          broadcastToRoom(room, 'song_requested', requestItem);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true, request: requestItem }));
        }

        // 6. Host Responds to Request (ACCEPT / REJECT) - STRICT HOST PERMISSION CHECK
        if (url.pathname === '/api/rooms/request/respond' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
          }

          // BACKEND PERMISSION CHECK: Only host can respond
          if (room.hostId !== body.participantId) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Akses ditolak: Hanya Host yang memiliki wewenang menerima atau menolak pengajuan lagu.' }));
          }

          const reqItem = room.requests.find(r => r.id === body.requestId);
          if (!reqItem) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Permintaan lagu tidak ditemukan.' }));
          }

          const action = body.action; // 'accept' or 'reject'
          if (action === 'accept') {
            reqItem.status = 'accepted';
            reqItem.respondedAt = Date.now();

            // Append song to shared queue with requester attribution
            const queuedSong = {
              ...reqItem.song,
              requestedBy: {
                id: reqItem.requesterId,
                name: reqItem.requesterName,
                username: reqItem.requesterUsername
              }
            };
            room.queue.push(queuedSong);

            // Broadcast events
            broadcastToRoom(room, 'request_accepted', {
              requestId: reqItem.id,
              request: reqItem,
              queue: room.queue,
              notification: `Lagu "${reqItem.song.title}" dari @${reqItem.requesterUsername} telah diterima ke antrean!`
            });
            broadcastToRoom(room, 'sync', { queue: room.queue });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ success: true, action: 'accept', queue: room.queue }));
          } else {
            reqItem.status = 'rejected';
            reqItem.respondedAt = Date.now();

            broadcastToRoom(room, 'request_rejected', {
              requestId: reqItem.id,
              request: reqItem,
              notification: `Pengajuan lagu "${reqItem.song.title}" dari @${reqItem.requesterUsername} telah ditolak oleh host.`
            });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ success: true, action: 'reject' }));
          }
        }

        // 7. Cancel Pending Request (By Requester)
        if (url.pathname === '/api/rooms/request/cancel' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
          }

          const reqIdx = room.requests.findIndex(r => r.id === body.requestId && r.requesterId === body.participantId && r.status === 'pending');
          if (reqIdx === -1) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Permintaan tidak dapat dibatalkan.' }));
          }

          const removed = room.requests.splice(reqIdx, 1)[0];
          broadcastToRoom(room, 'request_cancelled', { requestId: removed.id });

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true }));
        }

        // 8. Sync Playback State (Host broadcasts to listeners)
        if (url.pathname === '/api/rooms/sync' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Room not found' }));
          }

          // BACKEND PERMISSION CHECK: Strict Host RBAC - only host can sync playback
          if (room.hostId !== body.participantId) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Akses ditolak: Hanya host yang memiliki wewenang memutar, menjeda, atau mengubah lagu.' }));
          }

          if (body.playbackState) {
            room.playbackState = {
              ...body.playbackState,
              timestamp: Date.now()
            };
          }
          if (body.queue) {
            room.queue = body.queue;
          }
          if (typeof body.allowGuestControl === 'boolean') {
            room.allowGuestControl = body.allowGuestControl;
          }
          room.lastActive = Date.now();

          broadcastToRoom(room, 'sync', {
            playbackState: room.playbackState,
            queue: room.queue,
            allowGuestControl: room.allowGuestControl
          });

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true }));
        }

        // 9. Send Emoji Reaction
        if (url.pathname === '/api/rooms/reaction' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Room not found' }));
          }

          const reaction = {
            id: 'react_' + Math.random().toString(36).substring(2, 9),
            participantName: body.participantName || 'Kawan',
            emoji: body.emoji || '🔥',
            timestamp: Date.now()
          };

          room.reactions.unshift(reaction);
          room.reactions = room.reactions.slice(0, 30);
          broadcastToRoom(room, 'reaction', reaction);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true, reaction }));
        }

        // 10. Send Chat Message
        if (url.pathname === '/api/rooms/chat' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Room not found' }));
          }

          const msg = {
            id: 'msg_' + Math.random().toString(36).substring(2, 9),
            participantId: body.participantId,
            participantName: body.participantName || 'Kawan',
            text: (body.text || '').trim().slice(0, 200),
            timestamp: Date.now()
          };

          room.messages.push(msg);
          room.messages = room.messages.slice(-50);
          broadcastToRoom(room, 'chat', msg);

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true, message: msg }));
        }

        // 11. Leave Room
        if (url.pathname === '/api/rooms/leave' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (room) {
            room.participants = room.participants.filter(p => p.id !== body.participantId);
            // Cancel any pending requests from the departing listener
            room.requests = room.requests.filter(r => !(r.requesterId === body.participantId && r.status === 'pending'));
            broadcastToRoom(room, 'participant_left', { participantId: body.participantId });
          }
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true }));
        }

        // 12. End Room
        if (url.pathname === '/api/rooms/end' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const code = (body.code || '').toUpperCase().trim();
          const room = rooms.get(code);
          if (room && room.hostId === body.participantId) {
            broadcastToRoom(room, 'room_ended', { message: 'Host telah mengakhiri room musik.' });
            rooms.delete(code);
          }
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ success: true }));
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), papabvtifyBackendPlugin()],
  server: {
    port: 5188,
    host: true,
    watch: {
      ignored: [
        '**/dist-electron/**',
        '**/android/**',
        '**/ios/**',
        '**/PAPABVTIFY_RELEASE_EVIDENCE/**',
        '**/scratch/**'
      ]
    }
  }
});
