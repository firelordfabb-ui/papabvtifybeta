const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yts = require('yt-search');
const { Ytdl, chooseFormat } = require('@distube/ytdl-core');
const playlistExtractor = require('./src/services/playlistExtractor.cjs');

const ytdl = new Ytdl();

// Lightweight Bounded Cache (max 40 entries with FIFO eviction) to keep memory footprint strictly minimal
class BoundedCache {
  constructor(maxSize = 40) {
    this.maxSize = maxSize;
    this.map = new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(key, val) {
    if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, val);
  }
  has(key) {
    return this.map.has(key);
  }
  delete(key) {
    return this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const formatCache = new BoundedCache(40);
const searchCache = new BoundedCache(40);
const rooms = new Map();
const loginAttempts = new Map();

// Database directories with safe Windows Program Files AppData fallback
function getDataDir() {
  if (process.env.PAPABVTIFY_DATA_DIR) {
    return process.env.PAPABVTIFY_DATA_DIR;
  }
  const localDir = path.resolve(__dirname, 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : '/tmp');
    const roamingDir = path.join(appData, 'papabvtify', 'data');
    if (!fs.existsSync(roamingDir)) {
      try { fs.mkdirSync(roamingDir, { recursive: true }); } catch {}
    }
    return roamingDir;
  }
}
const DATA_DIR = getDataDir();
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const USER_DATA_FILE = path.join(DATA_DIR, 'user_data.json');
const DIST_DIR = path.resolve(__dirname, 'dist');

function makeInitialAvatar(name) {
  const clean = (name || 'P').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : clean.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="30" fill="#1c1d27"/><circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><text x="60" y="69" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#ff442b" text-anchor="middle" letter-spacing="-1.5">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function loadUsers() {
  const map = new Map();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const arr = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      for (const u of arr) {
        map.set(u.id, u);
        map.set(u.username.toLowerCase(), u);
        map.set(u.email.toLowerCase(), u);
        if (u.googleSub) {
          map.set(`gsub_${u.googleSub}`, u);
        }
      }
    }
  } catch {}
  return map;
}

function saveUsers(map) {
  try {
    const unique = Array.from(new Set(map.values()));
    fs.writeFileSync(USERS_FILE, JSON.stringify(unique, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save users database:', e);
  }
}

function loadSessions() {
  const map = new Map();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const obj = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      for (const [token, sess] of Object.entries(obj)) {
        if (sess.expiresAt > Date.now()) {
          map.set(token, sess);
        }
      }
    }
  } catch {}
  return map;
}

function saveSessions(map) {
  try {
    const obj = {};
    for (const [token, sess] of map.entries()) {
      if (sess.expiresAt > Date.now()) {
        obj[token] = sess;
      }
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

function loadUserData() {
  const map = new Map();
  try {
    if (fs.existsSync(USER_DATA_FILE)) {
      const obj = JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf-8'));
      for (const [userId, data] of Object.entries(obj)) {
        map.set(userId, data);
      }
    }
  } catch (e) {
    console.error('Failed to load user data database:', e);
  }
  return map;
}

function saveUserData(map) {
  try {
    const obj = {};
    for (const [userId, data] of map.entries()) {
      obj[userId] = data;
    }
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save user data database:', e);
  }
}

const usersMap = loadUsers();
const sessionsMap = loadSessions();
const userDataMap = loadUserData();

// Seed official creator account if new
if (!usersMap.has('fabb')) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync('papabvtify2026', salt, 64).toString('hex');
  const fabbUser = {
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

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  try {
    const computed = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

function sanitizeUser(u) {
  return {
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
  };
}

function getAuthUserFromReq(req) {
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
}

function broadcastToRoom(room, eventType, payload) {
  const dataStr = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  room.sseClients = room.sseClients.filter(client => {
    try {
      client.res.write(dataStr);
      return true;
    } catch {
      return false;
    }
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Pre-seed community room PV8888
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
  messages: [],
  sseClients: []
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function createServer() {
  return http.createServer(async (req, res) => {
    // Security Hardening Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, X-Participant-Id, X-User-Id');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const host = req.headers.host || '127.0.0.1';
    const url = new URL(req.url, `http://${host}`);

    // --- Direct APK Download Route for Mobile Devices ---
    if (url.pathname === '/download-apk' || url.pathname === '/PAPABVTIFY.apk' || url.pathname === '/apk') {
      const apkPath = 'C:\\Users\\fabiangarfield\\Downloads\\PAPABVTIFY.apk';
      if (fs.existsSync(apkPath)) {
        const stat = fs.statSync(apkPath);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="PAPABVTIFY.apk"'
        });
        return fs.createReadStream(apkPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('APK belum siap atau belum selesai diunduh.');
      }
    }

    // --- API ENDPOINTS ---
    if (url.pathname.startsWith('/api/')) {
      // 0. Health Check
      if (url.pathname === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ status: 'ok', time: Date.now(), platform: 'PAPABVTIFY Backend Node' }));
      }

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

        let avatar = body.avatar;
        let avatarType = body.avatarType || 'initial';
        if (!avatar || !avatar.startsWith('data:image/')) {
          avatar = makeInitialAvatar(displayName);
          avatarType = 'initial';
        }

        const newUser = {
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

        const token = crypto.randomBytes(32).toString('hex');
        sessionsMap.set(token, { userId, expiresAt: Date.now() + 7 * 86400000 });
        saveSessions(sessionsMap);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(newUser) }));
      }

      // 2. Login
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
          return res.end(JSON.stringify({ error: `Terlalu banyak percobaan masuk yang salah. Silakan coba kembali dalam ${waitMin} menit.` }));
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

        loginAttempts.delete(rateKey);
        const token = crypto.randomBytes(32).toString('hex');
        sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 86400000 });
        saveSessions(sessionsMap);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
      }

      // 3. Google Status
      if (url.pathname === '/api/auth/google/status' && req.method === 'GET') {
        const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ configured: !!googleClientId, clientId: googleClientId || null }));
      }

      // 4. Google Auth (Genuine Token Verification OR Seamless Direct Google Account Sign-In)
      if (url.pathname === '/api/auth/google' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { credential } = body;
        const googleClientId = process.env.GOOGLE_CLIENT_ID || '';

        let email = '';
        let displayName = '';
        let avatar = '';
        let googleSub = '';

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
            googleSub = payload.sub || '';
          } else if (body.email) {
            email = (body.email || '').toLowerCase().trim();
            if (!email || !email.includes('@')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Format email Google tidak valid.' }));
            }
            displayName = (body.displayName || email.split('@')[0]).trim();
            avatar = body.avatar || makeInitialAvatar(displayName);
            googleSub = body.googleId || '';
          } else {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              error: 'Email atau kredensial akun Google diperlukan untuk melanjutkan.'
            }));
          }

          if (!email) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Email akun Google tidak dapat diverifikasi.' }));
          }

          // Link existing account by googleSub or email
          let user = (googleSub && usersMap.get(`gsub_${googleSub}`)) || usersMap.get(email);
          if (user) {
            if (googleSub && !user.googleSub) {
              user.googleSub = googleSub;
              usersMap.set(`gsub_${googleSub}`, user);
            }
            if (avatar && (!user.avatar || user.avatarType === 'initial')) {
              user.avatar = avatar;
              user.avatarType = 'custom';
            }
            saveUsers(usersMap);
          } else {
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
              googleSub,
              username: finalUsername,
              displayName,
              email,
              avatar,
              avatarType: 'custom',
              salt,
              passwordHash,
              createdAt: Date.now(),
              joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
              favoriteGenres: []
            };

            usersMap.set(user.id, user);
            usersMap.set(user.username, user);
            usersMap.set(user.email, user);
            if (googleSub) {
              usersMap.set(`gsub_${googleSub}`, user);
            }
            saveUsers(usersMap);
          }

          const token = crypto.randomBytes(32).toString('hex');
          sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 86400000 });
          saveSessions(sessionsMap);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: err.message || 'Gagal memproses autentikasi Google.' }));
        }
      }

      // 5. Logout
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

      // 6. Me
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

      // 7b. User Data Isolation & Cloud Synchronization
      if (url.pathname === '/api/user/data' && req.method === 'GET') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Sesi kedaluwarsa atau belum terautentikasi.' }));
        }

        let data = userDataMap.get(user.id);
        if (!data) {
          data = {
            userId: user.id,
            favorites: [],
            playlists: [],
            recentlyPlayed: [],
            playbackHistory: [],
            stats: {
              totalListeningSeconds: 0,
              totalSongsPlayed: 0,
              songPlayCounts: {},
              artistPlayCounts: {},
              dailyListeningSeconds: {},
              history: []
            },
            queue: [],
            searchHistory: [],
            followedArtists: [],
            audioLab: null,
            downloads: [],
            friends: [],
            playbackMode: 'follow_playlist',
            updatedAt: Date.now()
          };
          userDataMap.set(user.id, data);
          saveUserData(userDataMap);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, data }));
      }

      if (url.pathname === '/api/user/sync' && req.method === 'POST') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Sesi kedaluwarsa atau belum terautentikasi.' }));
        }

        const body = await parseJsonBody(req);
        let existing = userDataMap.get(user.id) || { userId: user.id };

        // Strictly update fields belonging to this authenticated user
        if (Array.isArray(body.favorites)) existing.favorites = body.favorites;
        if (Array.isArray(body.playlists)) {
          existing.playlists = body.playlists.map(pl => ({ ...pl, userId: user.id }));
        }
        if (Array.isArray(body.recentlyPlayed)) existing.recentlyPlayed = body.recentlyPlayed.slice(0, 50);
        if (Array.isArray(body.playbackHistory)) existing.playbackHistory = body.playbackHistory.slice(0, 100);
        if (body.stats && typeof body.stats === 'object') existing.stats = body.stats;
        if (Array.isArray(body.queue)) existing.queue = body.queue;
        if (Array.isArray(body.searchHistory)) existing.searchHistory = body.searchHistory.slice(0, 20);
        if (Array.isArray(body.followedArtists)) existing.followedArtists = body.followedArtists;
        if (body.audioLab && typeof body.audioLab === 'object') existing.audioLab = body.audioLab;
        if (Array.isArray(body.downloads)) existing.downloads = body.downloads;
        if (Array.isArray(body.friends)) existing.friends = body.friends;
        if (body.playbackMode) existing.playbackMode = body.playbackMode;
        if (body.underwaterConfig) existing.underwaterConfig = body.underwaterConfig;

        existing.updatedAt = Date.now();
        userDataMap.set(user.id, existing);
        saveUserData(userDataMap);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, updatedAt: existing.updatedAt }));
      }

      // User Playlists - Strict per-user ownership and IDOR prevention
      if (url.pathname === '/api/user/playlists' && req.method === 'GET') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Autentikasi diperlukan.' }));
        }
        const data = userDataMap.get(user.id) || { playlists: [] };
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, playlists: data.playlists || [] }));
      }

      if (url.pathname === '/api/user/playlists' && req.method === 'POST') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Autentikasi diperlukan.' }));
        }
        const body = await parseJsonBody(req);
        const title = (body.title || 'Playlist Baru').trim();
        let data = userDataMap.get(user.id);
        if (!data) {
          data = { userId: user.id, playlists: [], favorites: [] };
          userDataMap.set(user.id, data);
        }
        if (!data.playlists) data.playlists = [];

        const newPlaylist = {
          id: body.id || `pl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          userId: user.id, // Strictly bind to authenticated user
          title,
          description: body.description || '',
          covers: body.covers || [],
          songIds: body.songIds || [],
          songs: body.songs || [],
          songCount: (body.songs || body.songIds || []).length,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const existingIdx = data.playlists.findIndex(p => p.id === newPlaylist.id);
        if (existingIdx >= 0) {
          data.playlists[existingIdx] = { ...data.playlists[existingIdx], ...newPlaylist, userId: user.id };
        } else {
          data.playlists.push(newPlaylist);
        }

        saveUserData(userDataMap);
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, playlist: newPlaylist }));
      }

      if (url.pathname === '/api/user/playlists' && req.method === 'DELETE') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Autentikasi diperlukan.' }));
        }
        const playlistId = url.searchParams.get('id');
        let data = userDataMap.get(user.id);
        if (data && data.playlists) {
          data.playlists = data.playlists.filter(p => p.id !== playlistId);
          saveUserData(userDataMap);
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (url.pathname === '/api/user/favorites/toggle' && req.method === 'POST') {
        const user = getAuthUserFromReq(req);
        if (!user) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Autentikasi diperlukan.' }));
        }
        const body = await parseJsonBody(req);
        const songId = body.songId;
        if (!songId) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'songId wajib disertakan.' }));
        }

        let data = userDataMap.get(user.id);
        if (!data) {
          data = { userId: user.id, favorites: [] };
          userDataMap.set(user.id, data);
        }
        if (!data.favorites) data.favorites = [];

        const idx = data.favorites.indexOf(songId);
        let isLiked = false;
        if (idx >= 0) {
          data.favorites.splice(idx, 1);
          isLiked = false;
        } else {
          data.favorites.unshift(songId);
          isLiked = true;
        }
        saveUserData(userDataMap);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, isLiked, favorites: data.favorites }));
      }

      // 8. Search
      if (url.pathname === '/api/search') {
        const q = (url.searchParams.get('q') || 'trending pop indonesia').trim();
        const cached = searchCache.get(q);
        if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
          res.setHeader('Content-Type', 'application/json');
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
          res.end(JSON.stringify(songs));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // 8b. Authentic Playlist Source Extractor (Spotify & YouTube)
      if (url.pathname === '/api/playlist/source') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Parameter url playlist wajib disertakan.' }));
        }

        try {
          const provider = playlistExtractor.detectProvider(targetUrl);
          if (!provider) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'URL tidak dikenali. Masukkan tautan playlist publik dari Spotify atau YouTube.' }));
          }

          let result;
          if (provider === 'spotify') {
            result = await playlistExtractor.fetchSpotifyPlaylist(targetUrl);
          } else {
            result = await playlistExtractor.fetchYouTubePlaylist(targetUrl);
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: err.message || 'Gagal mengambil playlist sumber.' }));
        }
      }

      // 9. Stream (Range 206 HTTP Chunking)
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
              filter: f => f.hasAudio && !f.hasVideo,
              quality: 'highestaudio'
            });
            formatCache.set(id, format);
          }

          const rangeHeader = req.headers.range;
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          };
          if (rangeHeader) headers['Range'] = rangeHeader;

          const proxyRes = await fetch(format.url, { headers });
          res.statusCode = proxyRes.status;
          res.setHeader('Content-Type', format.mimeType || 'audio/webm');
          res.setHeader('Accept-Ranges', 'bytes');

          const contentRange = proxyRes.headers.get('content-range');
          if (contentRange) res.setHeader('Content-Range', contentRange);

          const contentLength = proxyRes.headers.get('content-length');
          if (contentLength) res.setHeader('Content-Length', contentLength);

          if (!proxyRes.body) return res.end();

          const reader = proxyRes.body.getReader();
          req.on('close', () => { try { reader.cancel(); } catch {} });

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
        return;
      }

      // 10. Rooms (Create, Get, Join, Events, Request, Sync, Reaction, Chat, Leave, End)
      if (url.pathname === '/api/rooms/create' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const name = (body.name || 'Ruang Musik PAPABVTIFY').trim();
        const hostName = (body.hostName || 'Host').trim();
        const username = body.username || hostName.toLowerCase().replace(/[^a-z0-9_]/g, '');
        const avatar = body.avatar || makeInitialAvatar(hostName);
        const initialSong = body.initialSong || null;
        const allowGuestControl = !!body.allowGuestControl;

        // Generate unique 6-character room code (e.g. PV + 4 alphanumeric uppercase)
        let code = '';
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
          code = 'PV' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        } while (rooms.has(code));

        const participantId = 'host_' + crypto.randomBytes(6).toString('hex');

        const newRoom = {
          code,
          name,
          hostId: participantId,
          hostName,
          createdAt: Date.now(),
          lastActive: Date.now(),
          allowGuestControl,
          maxRequestsPerUser: 3,
          requests: [],
          requestCooldowns: new Map(),
          playbackState: {
            song: initialSong,
            isPlaying: !!initialSong,
            position: 0,
            timestamp: Date.now(),
            speed: 1.0
          },
          queue: initialSong ? [initialSong] : [],
          participants: [
            {
              id: participantId,
              name: hostName,
              username,
              avatar,
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
        return res.end(JSON.stringify({
          room: { ...newRoom, sseClients: undefined },
          participantId,
          isHost: true
        }));
      }

      if (url.pathname === '/api/rooms/get') {
        const code = (url.searchParams.get('code') || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ ...room, sseClients: undefined }));
      }

      if (url.pathname === '/api/rooms/join' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Kode room tidak valid.' }));
        }

        const participantId = body.participantId || ('user_' + Math.random().toString(36).substring(2, 9));
        const name = body.name || `Pendengar ${participantId.slice(-3)}`;
        const avatar = body.avatar || makeInitialAvatar(name);

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
        return res.end(JSON.stringify({ room: { ...room, sseClients: undefined }, participantId, isHost: room.hostId === participantId }));
      }

      if (url.pathname === '/api/rooms/events') {
        const code = (url.searchParams.get('code') || '').toUpperCase().trim();
        const participantId = url.searchParams.get('participantId') || '';
        const room = rooms.get(code);

        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const client = { res, participantId };
        room.sseClients.push(client);
        res.write(`event: init\ndata: ${JSON.stringify({ ...room, sseClients: undefined })}\n\n`);

        req.on('close', () => {
          room.sseClients = room.sseClients.filter(c => c !== client);
        });
        return;
      }

      if (url.pathname === '/api/rooms/request/create' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        const song = body.song;
        if (!song || !song.id) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Data lagu tidak valid.' }));
        }

        const requesterId = body.requesterId || 'guest';
        const requesterName = body.requesterName || 'Pendengar';

        // Check active pending requests limit
        const activeRequests = room.requests.filter(r => r.requesterId === requesterId && r.status === 'pending');
        if (activeRequests.length >= (room.maxRequestsPerUser || 3)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: `Batas pengajuan maksimal (${room.maxRequestsPerUser || 3} lagu pending) telah tercapai.` }));
        }

        const newRequest = {
          id: 'req_' + crypto.randomBytes(6).toString('hex'),
          song,
          requesterId,
          requesterName,
          requesterUsername: body.requesterUsername || requesterName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          requesterAvatar: body.requesterAvatar || makeInitialAvatar(requesterName),
          status: 'pending',
          createdAt: Date.now()
        };

        room.requests.push(newRequest);
        room.lastActive = Date.now();
        broadcastToRoom(room, 'song_requested', newRequest);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, request: newRequest }));
      }

      if (url.pathname === '/api/rooms/request/respond' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

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

        if (body.action === 'accept') {
          reqItem.status = 'accepted';
          room.queue.push({ ...reqItem.song, requestedBy: { id: reqItem.requesterId, name: reqItem.requesterName } });
          broadcastToRoom(room, 'request_accepted', { requestId: reqItem.id, queue: room.queue });
          broadcastToRoom(room, 'sync', { queue: room.queue });
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, action: 'accept', queue: room.queue }));
        } else {
          reqItem.status = 'rejected';
          broadcastToRoom(room, 'request_rejected', { requestId: reqItem.id });
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, action: 'reject' }));
        }
      }

      if (url.pathname === '/api/rooms/request/cancel' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        const reqItem = room.requests.find(r => r.id === body.requestId);
        if (!reqItem) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Permintaan lagu tidak ditemukan.' }));
        }

        // Only requester or host can cancel
        if (reqItem.requesterId !== body.participantId && room.hostId !== body.participantId) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Akses ditolak untuk membatalkan pengajuan ini.' }));
        }

        reqItem.status = 'rejected';
        broadcastToRoom(room, 'request_cancelled', { requestId: reqItem.id });
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (url.pathname === '/api/rooms/sync' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }

        if (room.hostId !== body.participantId && !room.allowGuestControl) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Akses ditolak: Hanya host yang dapat menyinkronkan playback.' }));
        }

        if (body.playbackState) room.playbackState = { ...body.playbackState, timestamp: Date.now() };
        if (body.queue) room.queue = body.queue;
        if (typeof body.allowGuestControl === 'boolean') room.allowGuestControl = body.allowGuestControl;
        broadcastToRoom(room, 'sync', { playbackState: room.playbackState, queue: room.queue, allowGuestControl: room.allowGuestControl });
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (url.pathname === '/api/rooms/reaction' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        const reaction = {
          id: 'react_' + crypto.randomBytes(4).toString('hex'),
          participantName: body.participantName || 'Pendengar',
          emoji: body.emoji || '🎵',
          timestamp: Date.now()
        };

        room.reactions.unshift(reaction);
        if (room.reactions.length > 20) room.reactions.pop();
        broadcastToRoom(room, 'reaction', reaction);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, reaction }));
      }

      if (url.pathname === '/api/rooms/chat' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        const text = (body.text || '').trim();
        if (!text) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Pesan tidak boleh kosong.' }));
        }

        const message = {
          id: 'msg_' + crypto.randomBytes(6).toString('hex'),
          participantId: body.participantId || 'unknown',
          participantName: body.participantName || 'Pendengar',
          text,
          timestamp: Date.now()
        };

        room.messages.push(message);
        if (room.messages.length > 50) room.messages.shift();
        broadcastToRoom(room, 'chat', message);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, message }));
      }

      if (url.pathname === '/api/rooms/leave' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (room) {
          room.participants = room.participants.filter(p => p.id !== body.participantId);
          broadcastToRoom(room, 'participant_left', { participantId: body.participantId });
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (url.pathname === '/api/rooms/end' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const code = (body.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room tidak ditemukan.' }));
        }

        if (room.hostId !== body.participantId) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Akses ditolak: Hanya host yang dapat mengakhiri room.' }));
        }

        broadcastToRoom(room, 'room_ended', { code });
        // Close SSE clients
        room.sseClients.forEach(c => {
          try { c.res.end(); } catch {}
        });
        rooms.delete(code);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      // Explicit API 404 Catch-All: NEVER fall through to index.html for any /api/ requests
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: `API endpoint ${url.pathname} tidak ditemukan.` }));
    }

    // --- STATIC ASSET SERVING FROM dist/ ---
    let safePath = '/';
    try {
      safePath = decodeURIComponent(url.pathname);
    } catch {
      safePath = url.pathname;
    }

    let filePath = path.join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

    // Dynamic asset resolution: If a specific hashed asset is requested but was recompiled with a new hash,
    // automatically find and serve the current bundle matching that extension to avoid MIME type errors
    if (!fs.existsSync(filePath) && safePath.startsWith('/assets/')) {
      const ext = path.extname(safePath).toLowerCase();
      const assetsDir = path.join(DIST_DIR, 'assets');
      try {
        if (fs.existsSync(assetsDir)) {
          const files = fs.readdirSync(assetsDir);
          const matching = files.find(f => f.startsWith('index-') && f.endsWith(ext));
          if (matching) {
            filePath = path.join(assetsDir, matching);
          }
        }
      } catch {}
    }

    // SPA Fallback: ONLY fallback to index.html for navigation requests, NEVER for missing assets/scripts/styles
    try {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(safePath).toLowerCase();
        if (!ext || ext === '.html') {
          filePath = path.join(DIST_DIR, 'index.html');
        }
      }
    } catch {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      try {
        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => {
          console.warn('[Static Serve Note]', filePath, err.message);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Error reading asset');
          }
        });
        stream.pipe(res);
      } catch (err) {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error streaming asset');
        }
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Asset not found');
    }
  });
}

function startServer(port = 5188) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(port, '0.0.0.0', () => {
      const actualPort = server.address() ? server.address().port : port;
      console.log(`[PAPABVTIFY Backend] Listening on http://0.0.0.0:${actualPort} (Accessible via LAN / 127.0.0.1)`);
      resolve({ server, port: actualPort });
    });
    server.on('error', (err) => {
      try { server.close(); } catch {}
      if (err.code === 'EADDRINUSE') {
        // Try next port to avoid colliding with any running services
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { createServer, startServer };

if (require.main === module) {
  const p = parseInt(process.env.PORT || '5188', 10);
  startServer(p);
}
