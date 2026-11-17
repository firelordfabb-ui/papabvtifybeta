// vite.config.ts
import { defineConfig } from "file:///C:/Users/fabiangarfield/.gemini/antigravity/scratch/auralis-next/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/fabiangarfield/.gemini/antigravity/scratch/auralis-next/node_modules/@vitejs/plugin-react/dist/index.js";
import yts from "file:///C:/Users/fabiangarfield/.gemini/antigravity/scratch/auralis-next/node_modules/yt-search/dist/yt-search.js";
import { Ytdl, chooseFormat } from "file:///C:/Users/fabiangarfield/.gemini/antigravity/scratch/auralis-next/node_modules/@distube/ytdl-core/dist/index.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
var __vite_injected_original_dirname = "C:\\Users\\fabiangarfield\\.gemini\\antigravity\\scratch\\auralis-next";
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}
function makeInitialAvatar(name) {
  const clean = (name || "P").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : clean.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="30" fill="#1c1d27"/><circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><text x="60" y="69" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#ff442b" text-anchor="middle" letter-spacing="-1.5">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function papabvtifyBackendPlugin() {
  const ytdl = new Ytdl();
  const formatCache = /* @__PURE__ */ new Map();
  const searchCache = /* @__PURE__ */ new Map();
  const rooms = /* @__PURE__ */ new Map();
  const DATA_DIR = path.resolve(__vite_injected_original_dirname, "data");
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
    }
  }
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
  const loadUsers = () => {
    const map = /* @__PURE__ */ new Map();
    try {
      if (fs.existsSync(USERS_FILE)) {
        const arr = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
        for (const u of arr) {
          map.set(u.id, u);
          map.set(u.username.toLowerCase(), u);
          map.set(u.email.toLowerCase(), u);
        }
      }
    } catch {
    }
    return map;
  };
  const saveUsers = (map) => {
    try {
      const unique = Array.from(new Set(map.values()));
      fs.writeFileSync(USERS_FILE, JSON.stringify(unique, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save users database:", e);
    }
  };
  const loadSessions = () => {
    const map = /* @__PURE__ */ new Map();
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const obj = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
        for (const [token, sess] of Object.entries(obj)) {
          if (sess.expiresAt > Date.now()) {
            map.set(token, sess);
          }
        }
      }
    } catch {
    }
    return map;
  };
  const saveSessions = (map) => {
    try {
      const obj = {};
      for (const [token, sess] of map.entries()) {
        if (sess.expiresAt > Date.now()) {
          obj[token] = sess;
        }
      }
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
    } catch {
    }
  };
  const usersMap = loadUsers();
  const sessionsMap = loadSessions();
  if (!usersMap.has("fabb")) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.scryptSync("papabvtify2026", salt, 64).toString("hex");
    const fabbUser = {
      id: "usr_fabb_official",
      username: "fabb",
      displayName: "Fabb (Creator)",
      email: "fabb@papabvtify.app",
      salt,
      passwordHash,
      avatar: makeInitialAvatar("Fabb"),
      avatarType: "initial",
      bio: "Pencipta PAPABVTIFY. Audio DSP Enthusiast & Visual Designer.",
      favoriteGenres: ["Synthwave", "Indie Pop", "Electronic"],
      createdAt: Date.now() - 30 * 864e5
    };
    usersMap.set(fabbUser.id, fabbUser);
    usersMap.set("fabb", fabbUser);
    usersMap.set("fabb@papabvtify.app", fabbUser);
    saveUsers(usersMap);
  }
  const hashPassword = (password, salt) => {
    return crypto.scryptSync(password, salt, 64).toString("hex");
  };
  const verifyPassword = (password, salt, expectedHash) => {
    try {
      const computed = hashPassword(password, salt);
      return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expectedHash, "hex"));
    } catch {
      return false;
    }
  };
  const sanitizeUser = (u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    avatar: u.avatar,
    avatarType: u.avatarType,
    bio: u.bio,
    favoriteGenres: u.favoriteGenres,
    createdAt: u.createdAt,
    joinedDate: new Date(u.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  });
  const getAuthUserFromReq = (req) => {
    const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
    let token = "";
    if (typeof authHeader === "string") {
      token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
    }
    if (!token) return null;
    const session = sessionsMap.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) sessionsMap.delete(token);
      return null;
    }
    return usersMap.get(session.userId) || null;
  };
  const broadcastToRoom = (room, eventType, payload) => {
    const dataStr = `event: ${eventType}
data: ${JSON.stringify(payload)}

`;
    room.sseClients = room.sseClients.filter((client) => {
      try {
        client.res.write(dataStr);
        return true;
      } catch {
        return false;
      }
    });
  };
  rooms.set("PV8888", {
    code: "PV8888",
    name: "Ruang Komunitas PAPABVTIFY",
    hostId: "usr_fabb_official",
    hostName: "Fabb (Official Host)",
    createdAt: Date.now(),
    lastActive: Date.now(),
    allowGuestControl: false,
    maxRequestsPerUser: 3,
    requests: [],
    requestCooldowns: /* @__PURE__ */ new Map(),
    playbackState: {
      song: null,
      isPlaying: false,
      position: 0,
      timestamp: Date.now(),
      speed: 1
    },
    queue: [],
    participants: [
      {
        id: "usr_fabb_official",
        name: "Fabb (Official Host)",
        username: "fabb",
        avatar: makeInitialAvatar("Fabb"),
        isHost: true,
        joinedAt: Date.now() - 36e5,
        lastActive: Date.now()
      }
    ],
    reactions: [],
    messages: [],
    // Realtime conversations only - zero dummy pre-seeded chats
    sseClients: []
  });
  return {
    name: "papabvtify-backend-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = new URL(req.url, "http://localhost:5173");
        if (url.pathname === "/api/auth/register" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const username = (body.username || "").toLowerCase().trim();
          const email = (body.email || "").toLowerCase().trim();
          const displayName = (body.displayName || body.username || "").trim();
          const password = body.password || "";
          if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Username harus minimal 3 karakter huruf, angka, atau garis bawah." }));
          }
          if (!email || !email.includes("@") || !email.includes(".")) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Format email tidak valid." }));
          }
          if (!password || password.length < 6) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Password minimal 6 karakter." }));
          }
          if (usersMap.has(username)) {
            res.statusCode = 409;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Username ini sudah digunakan." }));
          }
          if (usersMap.has(email)) {
            res.statusCode = 409;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Alamat email ini sudah terdaftar." }));
          }
          const salt = crypto.randomBytes(16).toString("hex");
          const passwordHash = hashPassword(password, salt);
          const userId = "usr_" + crypto.randomBytes(8).toString("hex");
          let avatar = body.avatar;
          let avatarType = body.avatarType || "initial";
          if (!avatar || !avatar.startsWith("data:image/")) {
            avatar = makeInitialAvatar(displayName);
            avatarType = "initial";
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
            bio: body.bio || "Anggota resmi PAPABVTIFY.",
            favoriteGenres: body.favoriteGenres || [],
            createdAt: Date.now()
          };
          usersMap.set(userId, newUser);
          usersMap.set(username, newUser);
          usersMap.set(email, newUser);
          saveUsers(usersMap);
          const token = crypto.randomBytes(32).toString("hex");
          sessionsMap.set(token, { userId, expiresAt: Date.now() + 7 * 864e5 });
          saveSessions(sessionsMap);
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(newUser) }));
        }
        if (url.pathname === "/api/auth/login" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const identifier = (body.identifier || "").toLowerCase().trim();
          const password = body.password || "";
          const user = usersMap.get(identifier);
          if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Username/email atau kata sandi tidak sesuai." }));
          }
          const token = crypto.randomBytes(32).toString("hex");
          sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 864e5 });
          saveSessions(sessionsMap);
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
        }
        if (url.pathname === "/api/auth/google/status" && req.method === "GET") {
          const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ configured: !!googleClientId, clientId: googleClientId || null }));
        }
        if (url.pathname === "/api/auth/google" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const { credential } = body;
          const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
          if (!credential) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({
              error: googleClientId ? "Token kredensial Google OAuth diperlukan." : "Layanan Google OAuth belum disetel (GOOGLE_CLIENT_ID belum dikonfigurasi di backend). Silakan mendaftar menggunakan Email & Kata Sandi."
            }));
          }
          try {
            const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
            if (!verifyRes.ok) {
              res.statusCode = 401;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ error: "Token autentikasi Google tidak valid atau telah kedaluwarsa." }));
            }
            const payload = await verifyRes.json();
            if (googleClientId && payload.aud !== googleClientId) {
              res.statusCode = 401;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ error: "Google Client ID tidak cocok dengan audiens token." }));
            }
            const email = (payload.email || "").toLowerCase().trim();
            if (!email) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ error: "Email akun Google tidak dapat diverifikasi." }));
            }
            const displayName = payload.name || payload.given_name || email.split("@")[0];
            const avatar = payload.picture || makeInitialAvatar(displayName);
            let user = usersMap.get(email);
            if (!user) {
              const baseUsername = email.split("@")[0].replace(/[^a-z0-9_]/g, "") || `user${Math.floor(1e3 + Math.random() * 9e3)}`;
              let finalUsername = baseUsername;
              let counter = 1;
              while (usersMap.has(finalUsername)) {
                finalUsername = `${baseUsername}${counter++}`;
              }
              const salt = crypto.randomBytes(16).toString("hex");
              const passwordHash = hashPassword(crypto.randomBytes(24).toString("hex"), salt);
              user = {
                id: `usr_g_${crypto.randomBytes(8).toString("hex")}`,
                username: finalUsername,
                displayName,
                email,
                avatar,
                avatarType: "custom",
                salt,
                passwordHash,
                createdAt: Date.now(),
                joinedDate: "November 2026",
                favoriteGenres: []
              };
              usersMap.set(user.username, user);
              usersMap.set(user.email, user);
              saveUsers(usersMap);
            }
            const token = crypto.randomBytes(32).toString("hex");
            sessionsMap.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 864e5 });
            saveSessions(sessionsMap);
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ success: true, token, user: sanitizeUser(user) }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Gagal memverifikasi token Google OAuth: " + err.message }));
          }
        }
        if (url.pathname === "/api/auth/logout" && req.method === "POST") {
          const authHeader = req.headers["authorization"];
          if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
            const token = authHeader.slice(7).trim();
            sessionsMap.delete(token);
            saveSessions(sessionsMap);
          }
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true }));
        }
        if (url.pathname === "/api/auth/me" && req.method === "GET") {
          const user = getAuthUserFromReq(req);
          if (!user) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Sesi kedaluwarsa. Silakan masuk kembali." }));
          }
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
        }
        if (url.pathname === "/api/auth/forgot-password" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const email = (body.email || "").toLowerCase().trim();
          const user = usersMap.get(email);
          if (!user) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Email tidak ditemukan di sistem." }));
          }
          const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
          user.resetToken = resetCode;
          user.resetExpires = Date.now() + 15 * 60 * 1e3;
          saveUsers(usersMap);
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({
            success: true,
            message: "Kode pemulihan akun berhasil dibuat.",
            resetCode
            // Provided directly for immediate offline verification
          }));
        }
        if (url.pathname === "/api/auth/reset-password" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const email = (body.email || "").toLowerCase().trim();
          const resetCode = (body.resetCode || "").trim();
          const newPassword = body.newPassword || "";
          const user = usersMap.get(email);
          if (!user || user.resetToken !== resetCode || !user.resetExpires || user.resetExpires < Date.now()) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Kode pemulihan salah atau telah kedaluwarsa." }));
          }
          if (!newPassword || newPassword.length < 6) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Password baru minimal 6 karakter." }));
          }
          user.salt = crypto.randomBytes(16).toString("hex");
          user.passwordHash = hashPassword(newPassword, user.salt);
          delete user.resetToken;
          delete user.resetExpires;
          saveUsers(usersMap);
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true, message: "Kata sandi berhasil diperbarui." }));
        }
        if (url.pathname === "/api/auth/update-profile" && req.method === "POST") {
          const user = getAuthUserFromReq(req);
          if (!user) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Tidak memiliki izin." }));
          }
          const body = await parseJsonBody(req);
          if (body.displayName) user.displayName = body.displayName.trim();
          if (body.bio !== void 0) user.bio = body.bio.trim();
          if (body.avatar) user.avatar = body.avatar;
          if (body.avatarType) user.avatarType = body.avatarType;
          if (Array.isArray(body.favoriteGenres)) user.favoriteGenres = body.favoriteGenres;
          saveUsers(usersMap);
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ success: true, user: sanitizeUser(user) }));
        }
        if (url.pathname === "/api/search") {
          const q = (url.searchParams.get("q") || "trending pop indonesia").trim();
          const cached = searchCache.get(q);
          if (cached && Date.now() - cached.timestamp < 15 * 60 * 1e3) {
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(JSON.stringify(cached.songs));
          }
          try {
            const results = await yts(q);
            const songs = results.videos.slice(0, 20).map((v) => ({
              id: v.videoId,
              title: v.title,
              artist: v.author.name,
              album: "papabvtify Music",
              duration: v.seconds,
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              streamUrl: `/api/stream?id=${v.videoId}`
            }));
            searchCache.set(q, { timestamp: Date.now(), songs });
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(songs));
          } catch (err) {
            console.error("Search error:", err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
        if (url.pathname === "/api/stream") {
          const id = url.searchParams.get("id");
          if (!id) {
            res.statusCode = 400;
            return res.end("Missing song id");
          }
          try {
            let format = formatCache.get(id);
            if (!format || !format.url) {
              const info = await ytdl.getInfo(id);
              format = chooseFormat(info.formats, {
                filter: (f) => f.hasAudio && !f.hasVideo,
                quality: "highestaudio"
              });
              formatCache.set(id, format);
            }
            const rangeHeader = req.headers.range;
            const headers = {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            };
            if (rangeHeader) {
              headers["Range"] = rangeHeader;
            }
            const proxyRes = await fetch(format.url, { headers });
            res.statusCode = proxyRes.status;
            res.setHeader("Content-Type", format.mimeType || "audio/webm");
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Access-Control-Allow-Origin", "*");
            const contentRange = proxyRes.headers.get("content-range");
            if (contentRange) res.setHeader("Content-Range", contentRange);
            const contentLength = proxyRes.headers.get("content-length");
            if (contentLength) res.setHeader("Content-Length", contentLength);
            if (!proxyRes.body) {
              return res.end();
            }
            const reader = proxyRes.body.getReader();
            req.on("close", () => {
              try {
                reader.cancel();
              } catch (_) {
              }
            });
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (err) {
            console.error("Stream error for", id, err.message);
            res.statusCode = 500;
            res.end(err.message);
          }
          return;
        }
        if (url.pathname === "/api/rooms/create" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let code = "PV";
          for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const hostId = body.participantId || "user_" + Math.random().toString(36).substring(2, 9);
          const hostName = body.hostName || "Host PAPABVTIFY";
          const hostAvatar = body.avatar || makeInitialAvatar(hostName);
          const newRoom = {
            code,
            name: body.name || `Room Musik ${code}`,
            hostId,
            hostName,
            createdAt: Date.now(),
            lastActive: Date.now(),
            allowGuestControl: !!body.allowGuestControl,
            maxRequestsPerUser: 3,
            requests: [],
            requestCooldowns: /* @__PURE__ */ new Map(),
            playbackState: {
              song: body.initialSong || null,
              isPlaying: false,
              position: 0,
              timestamp: Date.now(),
              speed: 1
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
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ room: { ...newRoom, sseClients: void 0 }, participantId: hostId, isHost: true }));
        }
        if (url.pathname === "/api/rooms/get") {
          const code = (url.searchParams.get("code") || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(JSON.stringify({ error: "Room tidak ditemukan atau sudah berakhir." }));
          }
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ ...room, sseClients: void 0 }));
        }
        if (url.pathname === "/api/rooms/join" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(JSON.stringify({ error: "Kode room tidak valid." }));
          }
          const participantId = body.participantId || "user_" + Math.random().toString(36).substring(2, 9);
          const name = body.name || `Pendengar ${participantId.slice(-3)}`;
          const avatar = body.avatar || makeInitialAvatar(name);
          let existing = room.participants.find((p) => p.id === participantId);
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
          broadcastToRoom(room, "participant_joined", existing);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ room: { ...room, sseClients: void 0 }, participantId, isHost: room.hostId === participantId }));
        }
        if (url.pathname === "/api/rooms/events") {
          const code = (url.searchParams.get("code") || "").toUpperCase().trim();
          const participantId = url.searchParams.get("participantId") || "";
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end("Room not found");
          }
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
          });
          const client = { res, participantId };
          room.sseClients.push(client);
          res.write(`event: init
data: ${JSON.stringify({ ...room, sseClients: void 0 })}

`);
          req.on("close", () => {
            room.sseClients = room.sseClients.filter((c) => c !== client);
          });
          return;
        }
        if (url.pathname === "/api/rooms/request/create" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Room tidak ditemukan." }));
          }
          const requesterId = body.requesterId;
          const isParticipant = room.participants.some((p) => p.id === requesterId);
          if (!isParticipant) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Hanya peserta yang bergabung di room yang dapat mengajukan lagu." }));
          }
          const lastReq = room.requestCooldowns.get(requesterId) || 0;
          const elapsed = (Date.now() - lastReq) / 1e3;
          if (elapsed < 25) {
            res.statusCode = 429;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: `Mohon tunggu ${Math.ceil(25 - elapsed)} detik sebelum mengajukan lagu berikutnya.` }));
          }
          const pendingCount = room.requests.filter((r) => r.requesterId === requesterId && r.status === "pending").length;
          if (pendingCount >= (room.maxRequestsPerUser || 3)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: `Batas pengajuan tercapai (${room.maxRequestsPerUser || 3} lagu pending). Harap tunggu keputusan host.` }));
          }
          const songId = body.song?.id;
          const inQueue = room.queue.some((s) => s.id === songId) || room.playbackState.song?.id === songId;
          const inPending = room.requests.some((r) => r.song.id === songId && r.status === "pending");
          if (inQueue || inPending) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Lagu ini sudah ada dalam antrean atau sedang menunggu persetujuan host." }));
          }
          const requestItem = {
            id: "req_" + crypto.randomBytes(6).toString("hex"),
            roomCode: code,
            requesterId,
            requesterName: body.requesterName || "Kawan",
            requesterUsername: body.requesterUsername || "listener",
            requesterAvatar: body.requesterAvatar || makeInitialAvatar(body.requesterName || "Kawan"),
            song: body.song,
            status: "pending",
            createdAt: Date.now()
          };
          room.requests.unshift(requestItem);
          room.requestCooldowns.set(requesterId, Date.now());
          broadcastToRoom(room, "song_requested", requestItem);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true, request: requestItem }));
        }
        if (url.pathname === "/api/rooms/request/respond" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Room tidak ditemukan." }));
          }
          if (room.hostId !== body.participantId) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Akses ditolak: Hanya Host yang memiliki wewenang menerima atau menolak pengajuan lagu." }));
          }
          const reqItem = room.requests.find((r) => r.id === body.requestId);
          if (!reqItem) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Permintaan lagu tidak ditemukan." }));
          }
          const action = body.action;
          if (action === "accept") {
            reqItem.status = "accepted";
            reqItem.respondedAt = Date.now();
            const queuedSong = {
              ...reqItem.song,
              requestedBy: {
                id: reqItem.requesterId,
                name: reqItem.requesterName,
                username: reqItem.requesterUsername
              }
            };
            room.queue.push(queuedSong);
            broadcastToRoom(room, "request_accepted", {
              requestId: reqItem.id,
              request: reqItem,
              queue: room.queue,
              notification: `Lagu "${reqItem.song.title}" dari @${reqItem.requesterUsername} telah diterima ke antrean!`
            });
            broadcastToRoom(room, "sync", { queue: room.queue });
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(JSON.stringify({ success: true, action: "accept", queue: room.queue }));
          } else {
            reqItem.status = "rejected";
            reqItem.respondedAt = Date.now();
            broadcastToRoom(room, "request_rejected", {
              requestId: reqItem.id,
              request: reqItem,
              notification: `Pengajuan lagu "${reqItem.song.title}" dari @${reqItem.requesterUsername} telah ditolak oleh host.`
            });
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            return res.end(JSON.stringify({ success: true, action: "reject" }));
          }
        }
        if (url.pathname === "/api/rooms/request/cancel" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Room tidak ditemukan." }));
          }
          const reqIdx = room.requests.findIndex((r) => r.id === body.requestId && r.requesterId === body.participantId && r.status === "pending");
          if (reqIdx === -1) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: "Permintaan tidak dapat dibatalkan." }));
          }
          const removed = room.requests.splice(reqIdx, 1)[0];
          broadcastToRoom(room, "request_cancelled", { requestId: removed.id });
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true }));
        }
        if (url.pathname === "/api/rooms/sync" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Room not found" }));
          }
          if (room.hostId !== body.participantId) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Akses ditolak: Hanya host yang memiliki wewenang memutar, menjeda, atau mengubah lagu." }));
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
          if (typeof body.allowGuestControl === "boolean") {
            room.allowGuestControl = body.allowGuestControl;
          }
          room.lastActive = Date.now();
          broadcastToRoom(room, "sync", {
            playbackState: room.playbackState,
            queue: room.queue,
            allowGuestControl: room.allowGuestControl
          });
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true }));
        }
        if (url.pathname === "/api/rooms/reaction" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Room not found" }));
          }
          const reaction = {
            id: "react_" + Math.random().toString(36).substring(2, 9),
            participantName: body.participantName || "Kawan",
            emoji: body.emoji || "\u{1F525}",
            timestamp: Date.now()
          };
          room.reactions.unshift(reaction);
          room.reactions = room.reactions.slice(0, 30);
          broadcastToRoom(room, "reaction", reaction);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true, reaction }));
        }
        if (url.pathname === "/api/rooms/chat" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (!room) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: "Room not found" }));
          }
          const msg = {
            id: "msg_" + Math.random().toString(36).substring(2, 9),
            participantId: body.participantId,
            participantName: body.participantName || "Kawan",
            text: (body.text || "").trim().slice(0, 200),
            timestamp: Date.now()
          };
          room.messages.push(msg);
          room.messages = room.messages.slice(-50);
          broadcastToRoom(room, "chat", msg);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true, message: msg }));
        }
        if (url.pathname === "/api/rooms/leave" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (room) {
            room.participants = room.participants.filter((p) => p.id !== body.participantId);
            room.requests = room.requests.filter((r) => !(r.requesterId === body.participantId && r.status === "pending"));
            broadcastToRoom(room, "participant_left", { participantId: body.participantId });
          }
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true }));
        }
        if (url.pathname === "/api/rooms/end" && req.method === "POST") {
          const body = await parseJsonBody(req);
          const code = (body.code || "").toUpperCase().trim();
          const room = rooms.get(code);
          if (room && room.hostId === body.participantId) {
            broadcastToRoom(room, "room_ended", { message: "Host telah mengakhiri room musik." });
            rooms.delete(code);
          }
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          return res.end(JSON.stringify({ success: true }));
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), papabvtifyBackendPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxmYWJpYW5nYXJmaWVsZFxcXFwuZ2VtaW5pXFxcXGFudGlncmF2aXR5XFxcXHNjcmF0Y2hcXFxcYXVyYWxpcy1uZXh0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxmYWJpYW5nYXJmaWVsZFxcXFwuZ2VtaW5pXFxcXGFudGlncmF2aXR5XFxcXHNjcmF0Y2hcXFxcYXVyYWxpcy1uZXh0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9mYWJpYW5nYXJmaWVsZC8uZ2VtaW5pL2FudGlncmF2aXR5L3NjcmF0Y2gvYXVyYWxpcy1uZXh0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeXRzIGZyb20gJ3l0LXNlYXJjaCc7XG5pbXBvcnQgeyBZdGRsLCBjaG9vc2VGb3JtYXQgfSBmcm9tICdAZGlzdHViZS95dGRsLWNvcmUnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBEQVRBIFNUUlVDVFVSRVNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuaW50ZXJmYWNlIFN0b3JlZFVzZXIge1xuICBpZDogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBkaXNwbGF5TmFtZTogc3RyaW5nO1xuICBlbWFpbDogc3RyaW5nO1xuICBzYWx0OiBzdHJpbmc7XG4gIHBhc3N3b3JkSGFzaDogc3RyaW5nO1xuICBhdmF0YXI6IHN0cmluZztcbiAgYXZhdGFyVHlwZTogJ2luaXRpYWwnIHwgJ2dlb21ldHJpYycgfCAnY3VzdG9tJztcbiAgYmlvOiBzdHJpbmc7XG4gIGZhdm9yaXRlR2VucmVzOiBzdHJpbmdbXTtcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG4gIHJlc2V0VG9rZW4/OiBzdHJpbmc7XG4gIHJlc2V0RXhwaXJlcz86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFNlcnZlclNvbmdSZXF1ZXN0IHtcbiAgaWQ6IHN0cmluZztcbiAgcm9vbUNvZGU6IHN0cmluZztcbiAgcmVxdWVzdGVySWQ6IHN0cmluZztcbiAgcmVxdWVzdGVyTmFtZTogc3RyaW5nO1xuICByZXF1ZXN0ZXJVc2VybmFtZTogc3RyaW5nO1xuICByZXF1ZXN0ZXJBdmF0YXI6IHN0cmluZztcbiAgc29uZzogYW55O1xuICBzdGF0dXM6ICdwZW5kaW5nJyB8ICdhY2NlcHRlZCcgfCAncmVqZWN0ZWQnO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgcmVzcG9uZGVkQXQ/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBTZXJ2ZXJSb29tIHtcbiAgY29kZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZTogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IG51bWJlcjtcbiAgbGFzdEFjdGl2ZTogbnVtYmVyO1xuICBhbGxvd0d1ZXN0Q29udHJvbDogYm9vbGVhbjtcbiAgbWF4UmVxdWVzdHNQZXJVc2VyOiBudW1iZXI7XG4gIHJlcXVlc3RzOiBTZXJ2ZXJTb25nUmVxdWVzdFtdO1xuICByZXF1ZXN0Q29vbGRvd25zOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBwbGF5YmFja1N0YXRlOiB7XG4gICAgc29uZzogYW55IHwgbnVsbDtcbiAgICBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgcG9zaXRpb246IG51bWJlcjtcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgICBzcGVlZDogbnVtYmVyO1xuICB9O1xuICBxdWV1ZTogYW55W107XG4gIHBhcnRpY2lwYW50czogQXJyYXk8e1xuICAgIGlkOiBzdHJpbmc7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHVzZXJuYW1lPzogc3RyaW5nO1xuICAgIGF2YXRhcjogc3RyaW5nO1xuICAgIGlzSG9zdDogYm9vbGVhbjtcbiAgICBqb2luZWRBdDogbnVtYmVyO1xuICAgIGxhc3RBY3RpdmU6IG51bWJlcjtcbiAgfT47XG4gIHJlYWN0aW9uczogQXJyYXk8e1xuICAgIGlkOiBzdHJpbmc7XG4gICAgcGFydGljaXBhbnROYW1lOiBzdHJpbmc7XG4gICAgZW1vamk6IHN0cmluZztcbiAgICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgfT47XG4gIG1lc3NhZ2VzOiBBcnJheTx7XG4gICAgaWQ6IHN0cmluZztcbiAgICBwYXJ0aWNpcGFudElkOiBzdHJpbmc7XG4gICAgcGFydGljaXBhbnROYW1lOiBzdHJpbmc7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIHRpbWVzdGFtcDogbnVtYmVyO1xuICB9PjtcbiAgc3NlQ2xpZW50czogQXJyYXk8eyByZXM6IGFueTsgcGFydGljaXBhbnRJZDogc3RyaW5nIH0+O1xufVxuXG5mdW5jdGlvbiBwYXJzZUpzb25Cb2R5KHJlcTogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgYm9keSA9ICcnO1xuICAgIHJlcS5vbignZGF0YScsIChjaHVuazogYW55KSA9PiB7IGJvZHkgKz0gY2h1bms7IH0pO1xuICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmVzb2x2ZSh7fSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gIH0pO1xufVxuXG4vLyBHZW5lcmF0ZSBzaW1wbGUgU1ZHIGluaXRpYWwgbW9ub2dyYW0gKGRhdGEgVVJJKSBmb3Igc2VydmVyLXNpZGUgZmFsbGJhY2tzXG5mdW5jdGlvbiBtYWtlSW5pdGlhbEF2YXRhcihuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjbGVhbiA9IChuYW1lIHx8ICdQJykudHJpbSgpO1xuICBjb25zdCB3b3JkcyA9IGNsZWFuLnNwbGl0KC9cXHMrLykuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBpbml0aWFscyA9IHdvcmRzLmxlbmd0aCA+PSAyXG4gICAgPyAod29yZHNbMF1bMF0gKyB3b3Jkc1sxXVswXSkudG9VcHBlckNhc2UoKVxuICAgIDogY2xlYW4uc2xpY2UoMCwgMikudG9VcHBlckNhc2UoKTtcblxuICBjb25zdCBzdmcgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMjAgMTIwXCIgd2lkdGg9XCIxMjBcIiBoZWlnaHQ9XCIxMjBcIj48cmVjdCB3aWR0aD1cIjEyMFwiIGhlaWdodD1cIjEyMFwiIHJ4PVwiMzBcIiBmaWxsPVwiIzFjMWQyN1wiLz48Y2lyY2xlIGN4PVwiNjBcIiBjeT1cIjYwXCIgcj1cIjU0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJyZ2JhKDI1NSwyNTUsMjU1LDAuMTIpXCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz48dGV4dCB4PVwiNjBcIiB5PVwiNjlcIiBmb250LWZhbWlseT1cInN5c3RlbS11aSwgc2Fucy1zZXJpZlwiIGZvbnQtc2l6ZT1cIjQ0XCIgZm9udC13ZWlnaHQ9XCI5MDBcIiBmaWxsPVwiI2ZmNDQyYlwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgbGV0dGVyLXNwYWNpbmc9XCItMS41XCI+JHtpbml0aWFsc308L3RleHQ+PC9zdmc+YDtcbiAgcmV0dXJuIGBkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCwke2VuY29kZVVSSUNvbXBvbmVudChzdmcpfWA7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEJBQ0tFTkQgUExVR0lOXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHBhcGFidnRpZnlCYWNrZW5kUGx1Z2luKCk6IFBsdWdpbiB7XG4gIGNvbnN0IHl0ZGwgPSBuZXcgWXRkbCgpO1xuICBjb25zdCBmb3JtYXRDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG4gIGNvbnN0IHNlYXJjaENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgdGltZXN0YW1wOiBudW1iZXI7IHNvbmdzOiBhbnlbXSB9PigpO1xuICBjb25zdCByb29tcyA9IG5ldyBNYXA8c3RyaW5nLCBTZXJ2ZXJSb29tPigpO1xuXG4gIC8vIERhdGFiYXNlIGZpbGVzIGZvciByZWFsIHBlcnNpc3RlbnQgYXV0aGVudGljYXRpb25cbiAgY29uc3QgREFUQV9ESVIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGF0YScpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoREFUQV9ESVIpKSB7XG4gICAgdHJ5IHsgZnMubWtkaXJTeW5jKERBVEFfRElSLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTsgfSBjYXRjaCB7fVxuICB9XG4gIGNvbnN0IFVTRVJTX0ZJTEUgPSBwYXRoLmpvaW4oREFUQV9ESVIsICd1c2Vycy5qc29uJyk7XG4gIGNvbnN0IFNFU1NJT05TX0ZJTEUgPSBwYXRoLmpvaW4oREFUQV9ESVIsICdzZXNzaW9ucy5qc29uJyk7XG5cbiAgLy8gTG9hZCBhbmQgc2F2ZSB1c2Vyc1xuICBjb25zdCBsb2FkVXNlcnMgPSAoKTogTWFwPHN0cmluZywgU3RvcmVkVXNlcj4gPT4ge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBTdG9yZWRVc2VyPigpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhVU0VSU19GSUxFKSkge1xuICAgICAgICBjb25zdCBhcnIgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhVU0VSU19GSUxFLCAndXRmLTgnKSk7XG4gICAgICAgIGZvciAoY29uc3QgdSBvZiBhcnIpIHtcbiAgICAgICAgICBtYXAuc2V0KHUuaWQsIHUpO1xuICAgICAgICAgIG1hcC5zZXQodS51c2VybmFtZS50b0xvd2VyQ2FzZSgpLCB1KTtcbiAgICAgICAgICBtYXAuc2V0KHUuZW1haWwudG9Mb3dlckNhc2UoKSwgdSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gICAgcmV0dXJuIG1hcDtcbiAgfTtcblxuICBjb25zdCBzYXZlVXNlcnMgPSAobWFwOiBNYXA8c3RyaW5nLCBTdG9yZWRVc2VyPikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1bmlxdWUgPSBBcnJheS5mcm9tKG5ldyBTZXQobWFwLnZhbHVlcygpKSk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFVTRVJTX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHVuaXF1ZSwgbnVsbCwgMiksICd1dGYtOCcpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHVzZXJzIGRhdGFiYXNlOicsIGUpO1xuICAgIH1cbiAgfTtcblxuICAvLyBTZXNzaW9ucyBtYXA6IHRva2VuIC0+IHsgdXNlcklkLCBleHBpcmVzQXQgfVxuICBjb25zdCBsb2FkU2Vzc2lvbnMgPSAoKTogTWFwPHN0cmluZywgeyB1c2VySWQ6IHN0cmluZzsgZXhwaXJlc0F0OiBudW1iZXIgfT4gPT4ge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCB7IHVzZXJJZDogc3RyaW5nOyBleHBpcmVzQXQ6IG51bWJlciB9PigpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhTRVNTSU9OU19GSUxFKSkge1xuICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhTRVNTSU9OU19GSUxFLCAndXRmLTgnKSk7XG4gICAgICAgIGZvciAoY29uc3QgW3Rva2VuLCBzZXNzXSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7XG4gICAgICAgICAgaWYgKChzZXNzIGFzIGFueSkuZXhwaXJlc0F0ID4gRGF0ZS5ub3coKSkge1xuICAgICAgICAgICAgbWFwLnNldCh0b2tlbiwgc2VzcyBhcyBhbnkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgICByZXR1cm4gbWFwO1xuICB9O1xuXG4gIGNvbnN0IHNhdmVTZXNzaW9ucyA9IChtYXA6IE1hcDxzdHJpbmcsIHsgdXNlcklkOiBzdHJpbmc7IGV4cGlyZXNBdDogbnVtYmVyIH0+KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG9iajogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBbdG9rZW4sIHNlc3NdIG9mIG1hcC5lbnRyaWVzKCkpIHtcbiAgICAgICAgaWYgKHNlc3MuZXhwaXJlc0F0ID4gRGF0ZS5ub3coKSkge1xuICAgICAgICAgIG9ialt0b2tlbl0gPSBzZXNzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFNFU1NJT05TX0ZJTEUsIEpTT04uc3RyaW5naWZ5KG9iaiwgbnVsbCwgMiksICd1dGYtOCcpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcblxuICBjb25zdCB1c2Vyc01hcCA9IGxvYWRVc2VycygpO1xuICBjb25zdCBzZXNzaW9uc01hcCA9IGxvYWRTZXNzaW9ucygpO1xuXG4gIC8vIFByZS1zZWVkIEZhYmIgKG9mZmljaWFsIGNyZWF0b3IpIGlmIGRhdGFiYXNlIGlzIG5ld1xuICBpZiAoIXVzZXJzTWFwLmhhcygnZmFiYicpKSB7XG4gICAgY29uc3Qgc2FsdCA9IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoJ2hleCcpO1xuICAgIGNvbnN0IHBhc3N3b3JkSGFzaCA9IGNyeXB0by5zY3J5cHRTeW5jKCdwYXBhYnZ0aWZ5MjAyNicsIHNhbHQsIDY0KS50b1N0cmluZygnaGV4Jyk7XG4gICAgY29uc3QgZmFiYlVzZXI6IFN0b3JlZFVzZXIgPSB7XG4gICAgICBpZDogJ3Vzcl9mYWJiX29mZmljaWFsJyxcbiAgICAgIHVzZXJuYW1lOiAnZmFiYicsXG4gICAgICBkaXNwbGF5TmFtZTogJ0ZhYmIgKENyZWF0b3IpJyxcbiAgICAgIGVtYWlsOiAnZmFiYkBwYXBhYnZ0aWZ5LmFwcCcsXG4gICAgICBzYWx0LFxuICAgICAgcGFzc3dvcmRIYXNoLFxuICAgICAgYXZhdGFyOiBtYWtlSW5pdGlhbEF2YXRhcignRmFiYicpLFxuICAgICAgYXZhdGFyVHlwZTogJ2luaXRpYWwnLFxuICAgICAgYmlvOiAnUGVuY2lwdGEgUEFQQUJWVElGWS4gQXVkaW8gRFNQIEVudGh1c2lhc3QgJiBWaXN1YWwgRGVzaWduZXIuJyxcbiAgICAgIGZhdm9yaXRlR2VucmVzOiBbJ1N5bnRod2F2ZScsICdJbmRpZSBQb3AnLCAnRWxlY3Ryb25pYyddLFxuICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpIC0gMzAgKiA4NjQwMDAwMFxuICAgIH07XG4gICAgdXNlcnNNYXAuc2V0KGZhYmJVc2VyLmlkLCBmYWJiVXNlcik7XG4gICAgdXNlcnNNYXAuc2V0KCdmYWJiJywgZmFiYlVzZXIpO1xuICAgIHVzZXJzTWFwLnNldCgnZmFiYkBwYXBhYnZ0aWZ5LmFwcCcsIGZhYmJVc2VyKTtcbiAgICBzYXZlVXNlcnModXNlcnNNYXApO1xuICB9XG5cbiAgLy8gUGFzc3dvcmQgaGFzaGluZyBoZWxwZXJzXG4gIGNvbnN0IGhhc2hQYXNzd29yZCA9IChwYXNzd29yZDogc3RyaW5nLCBzYWx0OiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gY3J5cHRvLnNjcnlwdFN5bmMocGFzc3dvcmQsIHNhbHQsIDY0KS50b1N0cmluZygnaGV4Jyk7XG4gIH07XG5cbiAgY29uc3QgdmVyaWZ5UGFzc3dvcmQgPSAocGFzc3dvcmQ6IHN0cmluZywgc2FsdDogc3RyaW5nLCBleHBlY3RlZEhhc2g6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21wdXRlZCA9IGhhc2hQYXNzd29yZChwYXNzd29yZCwgc2FsdCk7XG4gICAgICByZXR1cm4gY3J5cHRvLnRpbWluZ1NhZmVFcXVhbChCdWZmZXIuZnJvbShjb21wdXRlZCwgJ2hleCcpLCBCdWZmZXIuZnJvbShleHBlY3RlZEhhc2gsICdoZXgnKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHNhbml0aXplVXNlciA9ICh1OiBTdG9yZWRVc2VyKSA9PiAoe1xuICAgIGlkOiB1LmlkLFxuICAgIHVzZXJuYW1lOiB1LnVzZXJuYW1lLFxuICAgIGRpc3BsYXlOYW1lOiB1LmRpc3BsYXlOYW1lLFxuICAgIGVtYWlsOiB1LmVtYWlsLFxuICAgIGF2YXRhcjogdS5hdmF0YXIsXG4gICAgYXZhdGFyVHlwZTogdS5hdmF0YXJUeXBlLFxuICAgIGJpbzogdS5iaW8sXG4gICAgZmF2b3JpdGVHZW5yZXM6IHUuZmF2b3JpdGVHZW5yZXMsXG4gICAgY3JlYXRlZEF0OiB1LmNyZWF0ZWRBdCxcbiAgICBqb2luZWREYXRlOiBuZXcgRGF0ZSh1LmNyZWF0ZWRBdCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdpZC1JRCcsIHsgbW9udGg6ICdsb25nJywgeWVhcjogJ251bWVyaWMnIH0pXG4gIH0pO1xuXG4gIGNvbnN0IGdldEF1dGhVc2VyRnJvbVJlcSA9IChyZXE6IGFueSk6IFN0b3JlZFVzZXIgfCBudWxsID0+IHtcbiAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXSB8fCByZXEuaGVhZGVyc1sneC1hdXRoLXRva2VuJ107XG4gICAgbGV0IHRva2VuID0gJyc7XG4gICAgaWYgKHR5cGVvZiBhdXRoSGVhZGVyID09PSAnc3RyaW5nJykge1xuICAgICAgdG9rZW4gPSBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSA/IGF1dGhIZWFkZXIuc2xpY2UoNykudHJpbSgpIDogYXV0aEhlYWRlci50cmltKCk7XG4gICAgfVxuICAgIGlmICghdG9rZW4pIHJldHVybiBudWxsO1xuXG4gICAgY29uc3Qgc2Vzc2lvbiA9IHNlc3Npb25zTWFwLmdldCh0b2tlbik7XG4gICAgaWYgKCFzZXNzaW9uIHx8IHNlc3Npb24uZXhwaXJlc0F0IDw9IERhdGUubm93KCkpIHtcbiAgICAgIGlmIChzZXNzaW9uKSBzZXNzaW9uc01hcC5kZWxldGUodG9rZW4pO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVzZXJzTWFwLmdldChzZXNzaW9uLnVzZXJJZCkgfHwgbnVsbDtcbiAgfTtcblxuICAvLyBIZWxwZXI6IEJyb2FkY2FzdCBTU0UgZXZlbnQgdG8gYWxsIGNvbm5lY3RlZCByb29tIHBhcnRpY2lwYW50c1xuICBjb25zdCBicm9hZGNhc3RUb1Jvb20gPSAocm9vbTogU2VydmVyUm9vbSwgZXZlbnRUeXBlOiBzdHJpbmcsIHBheWxvYWQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IGRhdGFTdHIgPSBgZXZlbnQ6ICR7ZXZlbnRUeXBlfVxcbmRhdGE6ICR7SlNPTi5zdHJpbmdpZnkocGF5bG9hZCl9XFxuXFxuYDtcbiAgICByb29tLnNzZUNsaWVudHMgPSByb29tLnNzZUNsaWVudHMuZmlsdGVyKGNsaWVudCA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjbGllbnQucmVzLndyaXRlKGRhdGFTdHIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gUHJlLXNlZWQgYSBjbGVhbiBjb21tdW5pdHkgcm9vbSBcIlBWODg4OFwiIChFbXB0eSBtZXNzYWdlcywgc3RyaWN0IEhvc3QgUkJBQylcbiAgcm9vbXMuc2V0KCdQVjg4ODgnLCB7XG4gICAgY29kZTogJ1BWODg4OCcsXG4gICAgbmFtZTogJ1J1YW5nIEtvbXVuaXRhcyBQQVBBQlZUSUZZJyxcbiAgICBob3N0SWQ6ICd1c3JfZmFiYl9vZmZpY2lhbCcsXG4gICAgaG9zdE5hbWU6ICdGYWJiIChPZmZpY2lhbCBIb3N0KScsXG4gICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgIGxhc3RBY3RpdmU6IERhdGUubm93KCksXG4gICAgYWxsb3dHdWVzdENvbnRyb2w6IGZhbHNlLFxuICAgIG1heFJlcXVlc3RzUGVyVXNlcjogMyxcbiAgICByZXF1ZXN0czogW10sXG4gICAgcmVxdWVzdENvb2xkb3duczogbmV3IE1hcCgpLFxuICAgIHBsYXliYWNrU3RhdGU6IHtcbiAgICAgIHNvbmc6IG51bGwsXG4gICAgICBpc1BsYXlpbmc6IGZhbHNlLFxuICAgICAgcG9zaXRpb246IDAsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICBzcGVlZDogMS4wXG4gICAgfSxcbiAgICBxdWV1ZTogW10sXG4gICAgcGFydGljaXBhbnRzOiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAndXNyX2ZhYmJfb2ZmaWNpYWwnLFxuICAgICAgICBuYW1lOiAnRmFiYiAoT2ZmaWNpYWwgSG9zdCknLFxuICAgICAgICB1c2VybmFtZTogJ2ZhYmInLFxuICAgICAgICBhdmF0YXI6IG1ha2VJbml0aWFsQXZhdGFyKCdGYWJiJyksXG4gICAgICAgIGlzSG9zdDogdHJ1ZSxcbiAgICAgICAgam9pbmVkQXQ6IERhdGUubm93KCkgLSAzNjAwMDAwLFxuICAgICAgICBsYXN0QWN0aXZlOiBEYXRlLm5vdygpXG4gICAgICB9XG4gICAgXSxcbiAgICByZWFjdGlvbnM6IFtdLFxuICAgIG1lc3NhZ2VzOiBbXSwgLy8gUmVhbHRpbWUgY29udmVyc2F0aW9ucyBvbmx5IC0gemVybyBkdW1teSBwcmUtc2VlZGVkIGNoYXRzXG4gICAgc3NlQ2xpZW50czogW11cbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncGFwYWJ2dGlmeS1iYWNrZW5kLXBsdWdpbicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKCFyZXEudXJsKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8vbG9jYWxob3N0OjUxNzMnKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyBSRUFMIEFVVEhFTlRJQ0FUSU9OIEVORFBPSU5UU1xuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgICAgIC8vIDEuIFJlZ2lzdGVyXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL2F1dGgvcmVnaXN0ZXInICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgY29uc3QgdXNlcm5hbWUgPSAoYm9keS51c2VybmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgZW1haWwgPSAoYm9keS5lbWFpbCB8fCAnJykudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSAoYm9keS5kaXNwbGF5TmFtZSB8fCBib2R5LnVzZXJuYW1lIHx8ICcnKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgcGFzc3dvcmQgPSBib2R5LnBhc3N3b3JkIHx8ICcnO1xuXG4gICAgICAgICAgaWYgKCF1c2VybmFtZSB8fCB1c2VybmFtZS5sZW5ndGggPCAzIHx8ICEvXlthLXowLTlfXSskLy50ZXN0KHVzZXJuYW1lKSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1VzZXJuYW1lIGhhcnVzIG1pbmltYWwgMyBrYXJha3RlciBodXJ1ZiwgYW5na2EsIGF0YXUgZ2FyaXMgYmF3YWguJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFlbWFpbCB8fCAhZW1haWwuaW5jbHVkZXMoJ0AnKSB8fCAhZW1haWwuaW5jbHVkZXMoJy4nKSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0Zvcm1hdCBlbWFpbCB0aWRhayB2YWxpZC4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXBhc3N3b3JkIHx8IHBhc3N3b3JkLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdQYXNzd29yZCBtaW5pbWFsIDYga2FyYWt0ZXIuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHVzZXJzTWFwLmhhcyh1c2VybmFtZSkpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA5O1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdVc2VybmFtZSBpbmkgc3VkYWggZGlndW5ha2FuLicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh1c2Vyc01hcC5oYXMoZW1haWwpKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwOTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQWxhbWF0IGVtYWlsIGluaSBzdWRhaCB0ZXJkYWZ0YXIuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgc2FsdCA9IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoJ2hleCcpO1xuICAgICAgICAgIGNvbnN0IHBhc3N3b3JkSGFzaCA9IGhhc2hQYXNzd29yZChwYXNzd29yZCwgc2FsdCk7XG4gICAgICAgICAgY29uc3QgdXNlcklkID0gJ3Vzcl8nICsgY3J5cHRvLnJhbmRvbUJ5dGVzKDgpLnRvU3RyaW5nKCdoZXgnKTtcblxuICAgICAgICAgIC8vIEF2YXRhciBwcmlvcml0eTogY3VzdG9tIHVwbG9hZGVkIHBob3RvID4gZ2VvbWV0cmljID4gaW5pdGlhbFxuICAgICAgICAgIGxldCBhdmF0YXIgPSBib2R5LmF2YXRhcjtcbiAgICAgICAgICBsZXQgYXZhdGFyVHlwZTogJ2luaXRpYWwnIHwgJ2dlb21ldHJpYycgfCAnY3VzdG9tJyA9IGJvZHkuYXZhdGFyVHlwZSB8fCAnaW5pdGlhbCc7XG4gICAgICAgICAgaWYgKCFhdmF0YXIgfHwgIWF2YXRhci5zdGFydHNXaXRoKCdkYXRhOmltYWdlLycpKSB7XG4gICAgICAgICAgICBhdmF0YXIgPSBtYWtlSW5pdGlhbEF2YXRhcihkaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICBhdmF0YXJUeXBlID0gJ2luaXRpYWwnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG5ld1VzZXI6IFN0b3JlZFVzZXIgPSB7XG4gICAgICAgICAgICBpZDogdXNlcklkLFxuICAgICAgICAgICAgdXNlcm5hbWUsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIGVtYWlsLFxuICAgICAgICAgICAgc2FsdCxcbiAgICAgICAgICAgIHBhc3N3b3JkSGFzaCxcbiAgICAgICAgICAgIGF2YXRhcixcbiAgICAgICAgICAgIGF2YXRhclR5cGUsXG4gICAgICAgICAgICBiaW86IGJvZHkuYmlvIHx8ICdBbmdnb3RhIHJlc21pIFBBUEFCVlRJRlkuJyxcbiAgICAgICAgICAgIGZhdm9yaXRlR2VucmVzOiBib2R5LmZhdm9yaXRlR2VucmVzIHx8IFtdLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHVzZXJzTWFwLnNldCh1c2VySWQsIG5ld1VzZXIpO1xuICAgICAgICAgIHVzZXJzTWFwLnNldCh1c2VybmFtZSwgbmV3VXNlcik7XG4gICAgICAgICAgdXNlcnNNYXAuc2V0KGVtYWlsLCBuZXdVc2VyKTtcbiAgICAgICAgICBzYXZlVXNlcnModXNlcnNNYXApO1xuXG4gICAgICAgICAgLy8gQ3JlYXRlIHNlc3Npb25cbiAgICAgICAgICBjb25zdCB0b2tlbiA9IGNyeXB0by5yYW5kb21CeXRlcygzMikudG9TdHJpbmcoJ2hleCcpO1xuICAgICAgICAgIHNlc3Npb25zTWFwLnNldCh0b2tlbiwgeyB1c2VySWQsIGV4cGlyZXNBdDogRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCB9KTtcbiAgICAgICAgICBzYXZlU2Vzc2lvbnMoc2Vzc2lvbnNNYXApO1xuXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHRva2VuLCB1c2VyOiBzYW5pdGl6ZVVzZXIobmV3VXNlcikgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gMi4gTG9naW5cbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC9sb2dpbicgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gKGJvZHkuaWRlbnRpZmllciB8fCAnJykudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgcGFzc3dvcmQgPSBib2R5LnBhc3N3b3JkIHx8ICcnO1xuXG4gICAgICAgICAgY29uc3QgdXNlciA9IHVzZXJzTWFwLmdldChpZGVudGlmaWVyKTtcbiAgICAgICAgICBpZiAoIXVzZXIgfHwgIXZlcmlmeVBhc3N3b3JkKHBhc3N3b3JkLCB1c2VyLnNhbHQsIHVzZXIucGFzc3dvcmRIYXNoKSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDE7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1VzZXJuYW1lL2VtYWlsIGF0YXUga2F0YSBzYW5kaSB0aWRhayBzZXN1YWkuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBjcnlwdG8ucmFuZG9tQnl0ZXMoMzIpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICAgICAgICBzZXNzaW9uc01hcC5zZXQodG9rZW4sIHsgdXNlcklkOiB1c2VyLmlkLCBleHBpcmVzQXQ6IERhdGUubm93KCkgKyA3ICogODY0MDAwMDAgfSk7XG4gICAgICAgICAgc2F2ZVNlc3Npb25zKHNlc3Npb25zTWFwKTtcblxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCB0b2tlbiwgdXNlcjogc2FuaXRpemVVc2VyKHVzZXIpIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdvb2dsZSBPQXV0aCBTdGF0dXMgRW5kcG9pbnRcbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC9nb29nbGUvc3RhdHVzJyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgIGNvbnN0IGdvb2dsZUNsaWVudElkID0gcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9JRCB8fCBwcm9jZXNzLmVudi5WSVRFX0dPT0dMRV9DTElFTlRfSUQgfHwgJyc7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGNvbmZpZ3VyZWQ6ICEhZ29vZ2xlQ2xpZW50SWQsIGNsaWVudElkOiBnb29nbGVDbGllbnRJZCB8fCBudWxsIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbnVpbmUgR29vZ2xlIE9BdXRoIFZlcmlmaWNhdGlvbiBFbmRwb2ludFxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9hdXRoL2dvb2dsZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCB7IGNyZWRlbnRpYWwgfSA9IGJvZHk7XG4gICAgICAgICAgY29uc3QgZ29vZ2xlQ2xpZW50SWQgPSBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEIHx8IHByb2Nlc3MuZW52LlZJVEVfR09PR0xFX0NMSUVOVF9JRCB8fCAnJztcblxuICAgICAgICAgIGlmICghY3JlZGVudGlhbCkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBlcnJvcjogZ29vZ2xlQ2xpZW50SWRcbiAgICAgICAgICAgICAgICA/ICdUb2tlbiBrcmVkZW5zaWFsIEdvb2dsZSBPQXV0aCBkaXBlcmx1a2FuLidcbiAgICAgICAgICAgICAgICA6ICdMYXlhbmFuIEdvb2dsZSBPQXV0aCBiZWx1bSBkaXNldGVsIChHT09HTEVfQ0xJRU5UX0lEIGJlbHVtIGRpa29uZmlndXJhc2kgZGkgYmFja2VuZCkuIFNpbGFrYW4gbWVuZGFmdGFyIG1lbmdndW5ha2FuIEVtYWlsICYgS2F0YSBTYW5kaS4nXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFJlYWwgR29vZ2xlIHRva2VuIHZlcmlmaWNhdGlvbiB2aWEgR29vZ2xlIE9BdXRoMiB0b2tlbmluZm8gQVBJXG4gICAgICAgICAgICBjb25zdCB2ZXJpZnlSZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW5pbmZvP2lkX3Rva2VuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGNyZWRlbnRpYWwpfWApO1xuICAgICAgICAgICAgaWYgKCF2ZXJpZnlSZXMub2spIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDE7XG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdUb2tlbiBhdXRlbnRpa2FzaSBHb29nbGUgdGlkYWsgdmFsaWQgYXRhdSB0ZWxhaCBrZWRhbHV3YXJzYS4nIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHZlcmlmeVJlcy5qc29uKCk7XG4gICAgICAgICAgICBpZiAoZ29vZ2xlQ2xpZW50SWQgJiYgcGF5bG9hZC5hdWQgIT09IGdvb2dsZUNsaWVudElkKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAxO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnR29vZ2xlIENsaWVudCBJRCB0aWRhayBjb2NvayBkZW5nYW4gYXVkaWVucyB0b2tlbi4nIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZW1haWwgPSAocGF5bG9hZC5lbWFpbCB8fCAnJykudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgICBpZiAoIWVtYWlsKSB7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRW1haWwgYWt1biBHb29nbGUgdGlkYWsgZGFwYXQgZGl2ZXJpZmlrYXNpLicgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5TmFtZSA9IHBheWxvYWQubmFtZSB8fCBwYXlsb2FkLmdpdmVuX25hbWUgfHwgZW1haWwuc3BsaXQoJ0AnKVswXTtcbiAgICAgICAgICAgIGNvbnN0IGF2YXRhciA9IHBheWxvYWQucGljdHVyZSB8fCBtYWtlSW5pdGlhbEF2YXRhcihkaXNwbGF5TmFtZSk7XG5cbiAgICAgICAgICAgIGxldCB1c2VyID0gdXNlcnNNYXAuZ2V0KGVtYWlsKTtcbiAgICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgICBjb25zdCBiYXNlVXNlcm5hbWUgPSBlbWFpbC5zcGxpdCgnQCcpWzBdLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8IGB1c2VyJHtNYXRoLmZsb29yKDEwMDAgKyBNYXRoLnJhbmRvbSgpICogOTAwMCl9YDtcbiAgICAgICAgICAgICAgbGV0IGZpbmFsVXNlcm5hbWUgPSBiYXNlVXNlcm5hbWU7XG4gICAgICAgICAgICAgIGxldCBjb3VudGVyID0gMTtcbiAgICAgICAgICAgICAgd2hpbGUgKHVzZXJzTWFwLmhhcyhmaW5hbFVzZXJuYW1lKSkge1xuICAgICAgICAgICAgICAgIGZpbmFsVXNlcm5hbWUgPSBgJHtiYXNlVXNlcm5hbWV9JHtjb3VudGVyKyt9YDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHNhbHQgPSBjcnlwdG8ucmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICAgICAgICAgICAgY29uc3QgcGFzc3dvcmRIYXNoID0gaGFzaFBhc3N3b3JkKGNyeXB0by5yYW5kb21CeXRlcygyNCkudG9TdHJpbmcoJ2hleCcpLCBzYWx0KTtcblxuICAgICAgICAgICAgICB1c2VyID0ge1xuICAgICAgICAgICAgICAgIGlkOiBgdXNyX2dfJHtjcnlwdG8ucmFuZG9tQnl0ZXMoOCkudG9TdHJpbmcoJ2hleCcpfWAsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IGZpbmFsVXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWUsXG4gICAgICAgICAgICAgICAgZW1haWwsXG4gICAgICAgICAgICAgICAgYXZhdGFyLFxuICAgICAgICAgICAgICAgIGF2YXRhclR5cGU6ICdjdXN0b20nLFxuICAgICAgICAgICAgICAgIHNhbHQsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmRIYXNoLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBqb2luZWREYXRlOiAnTm92ZW1iZXIgMjAyNicsXG4gICAgICAgICAgICAgICAgZmF2b3JpdGVHZW5yZXM6IFtdXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgdXNlcnNNYXAuc2V0KHVzZXIudXNlcm5hbWUsIHVzZXIpO1xuICAgICAgICAgICAgICB1c2Vyc01hcC5zZXQodXNlci5lbWFpbCwgdXNlcik7XG4gICAgICAgICAgICAgIHNhdmVVc2Vycyh1c2Vyc01hcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDMyKS50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgICAgICBzZXNzaW9uc01hcC5zZXQodG9rZW4sIHsgdXNlcklkOiB1c2VyLmlkLCBleHBpcmVzQXQ6IERhdGUubm93KCkgKyA3ICogODY0MDAwMDAgfSk7XG4gICAgICAgICAgICBzYXZlU2Vzc2lvbnMoc2Vzc2lvbnNNYXApO1xuXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCB0b2tlbiwgdXNlcjogc2FuaXRpemVVc2VyKHVzZXIpIH0pKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0dhZ2FsIG1lbXZlcmlmaWthc2kgdG9rZW4gR29vZ2xlIE9BdXRoOiAnICsgZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMuIExvZ291dFxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9hdXRoL2xvZ291dCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ107XG4gICAgICAgICAgaWYgKHR5cGVvZiBhdXRoSGVhZGVyID09PSAnc3RyaW5nJyAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnNsaWNlKDcpLnRyaW0oKTtcbiAgICAgICAgICAgIHNlc3Npb25zTWFwLmRlbGV0ZSh0b2tlbik7XG4gICAgICAgICAgICBzYXZlU2Vzc2lvbnMoc2Vzc2lvbnNNYXApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA0LiBNZSAoVmFsaWRhdGUgU2Vzc2lvbilcbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC9tZScgJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgICAgICBjb25zdCB1c2VyID0gZ2V0QXV0aFVzZXJGcm9tUmVxKHJlcSk7XG4gICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnU2VzaSBrZWRhbHV3YXJzYS4gU2lsYWthbiBtYXN1ayBrZW1iYWxpLicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCB1c2VyOiBzYW5pdGl6ZVVzZXIodXNlcikgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gNS4gRm9yZ290IFBhc3N3b3JkIChHZW5lcmF0ZSByZWNvdmVyeSBjb2RlKVxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9hdXRoL2ZvcmdvdC1wYXNzd29yZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBlbWFpbCA9IChib2R5LmVtYWlsIHx8ICcnKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCB1c2VyID0gdXNlcnNNYXAuZ2V0KGVtYWlsKTtcblxuICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0VtYWlsIHRpZGFrIGRpdGVtdWthbiBkaSBzaXN0ZW0uJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gR2VuZXJhdGUgNi1kaWdpdCByZWNvdmVyeSBjb2RlXG4gICAgICAgICAgY29uc3QgcmVzZXRDb2RlID0gTWF0aC5mbG9vcigxMDAwMDAgKyBNYXRoLnJhbmRvbSgpICogOTAwMDAwKS50b1N0cmluZygpO1xuICAgICAgICAgIHVzZXIucmVzZXRUb2tlbiA9IHJlc2V0Q29kZTtcbiAgICAgICAgICB1c2VyLnJlc2V0RXhwaXJlcyA9IERhdGUubm93KCkgKyAxNSAqIDYwICogMTAwMDsgLy8gMTUgbWluc1xuICAgICAgICAgIHNhdmVVc2Vycyh1c2Vyc01hcCk7XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnS29kZSBwZW11bGloYW4gYWt1biBiZXJoYXNpbCBkaWJ1YXQuJyxcbiAgICAgICAgICAgIHJlc2V0Q29kZSAvLyBQcm92aWRlZCBkaXJlY3RseSBmb3IgaW1tZWRpYXRlIG9mZmxpbmUgdmVyaWZpY2F0aW9uXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gNi4gUmVzZXQgUGFzc3dvcmRcbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC9yZXNldC1wYXNzd29yZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBlbWFpbCA9IChib2R5LmVtYWlsIHx8ICcnKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCByZXNldENvZGUgPSAoYm9keS5yZXNldENvZGUgfHwgJycpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCBuZXdQYXNzd29yZCA9IGJvZHkubmV3UGFzc3dvcmQgfHwgJyc7XG5cbiAgICAgICAgICBjb25zdCB1c2VyID0gdXNlcnNNYXAuZ2V0KGVtYWlsKTtcbiAgICAgICAgICBpZiAoIXVzZXIgfHwgdXNlci5yZXNldFRva2VuICE9PSByZXNldENvZGUgfHwgIXVzZXIucmVzZXRFeHBpcmVzIHx8IHVzZXIucmVzZXRFeHBpcmVzIDwgRGF0ZS5ub3coKSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0tvZGUgcGVtdWxpaGFuIHNhbGFoIGF0YXUgdGVsYWgga2VkYWx1d2Fyc2EuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFuZXdQYXNzd29yZCB8fCBuZXdQYXNzd29yZC5sZW5ndGggPCA2KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUGFzc3dvcmQgYmFydSBtaW5pbWFsIDYga2FyYWt0ZXIuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdXNlci5zYWx0ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgICAgdXNlci5wYXNzd29yZEhhc2ggPSBoYXNoUGFzc3dvcmQobmV3UGFzc3dvcmQsIHVzZXIuc2FsdCk7XG4gICAgICAgICAgZGVsZXRlIHVzZXIucmVzZXRUb2tlbjtcbiAgICAgICAgICBkZWxldGUgdXNlci5yZXNldEV4cGlyZXM7XG4gICAgICAgICAgc2F2ZVVzZXJzKHVzZXJzTWFwKTtcblxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnS2F0YSBzYW5kaSBiZXJoYXNpbCBkaXBlcmJhcnVpLicgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gNy4gVXBkYXRlIFByb2ZpbGVcbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC91cGRhdGUtcHJvZmlsZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgdXNlciA9IGdldEF1dGhVc2VyRnJvbVJlcShyZXEpO1xuICAgICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDE7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1RpZGFrIG1lbWlsaWtpIGl6aW4uJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBpZiAoYm9keS5kaXNwbGF5TmFtZSkgdXNlci5kaXNwbGF5TmFtZSA9IGJvZHkuZGlzcGxheU5hbWUudHJpbSgpO1xuICAgICAgICAgIGlmIChib2R5LmJpbyAhPT0gdW5kZWZpbmVkKSB1c2VyLmJpbyA9IGJvZHkuYmlvLnRyaW0oKTtcbiAgICAgICAgICBpZiAoYm9keS5hdmF0YXIpIHVzZXIuYXZhdGFyID0gYm9keS5hdmF0YXI7XG4gICAgICAgICAgaWYgKGJvZHkuYXZhdGFyVHlwZSkgdXNlci5hdmF0YXJUeXBlID0gYm9keS5hdmF0YXJUeXBlO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvZHkuZmF2b3JpdGVHZW5yZXMpKSB1c2VyLmZhdm9yaXRlR2VucmVzID0gYm9keS5mYXZvcml0ZUdlbnJlcztcblxuICAgICAgICAgIHNhdmVVc2Vycyh1c2Vyc01hcCk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHVzZXI6IHNhbml0aXplVXNlcih1c2VyKSB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGYXN0IFJlYWx0aW1lIFNlYXJjaCB3aXRoIENhY2hpbmcgKFRUTCAxNSBtaW4pXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3NlYXJjaCcpIHtcbiAgICAgICAgICBjb25zdCBxID0gKHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdxJykgfHwgJ3RyZW5kaW5nIHBvcCBpbmRvbmVzaWEnKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gc2VhcmNoQ2FjaGUuZ2V0KHEpO1xuICAgICAgICAgIGlmIChjYWNoZWQgJiYgRGF0ZS5ub3coKSAtIGNhY2hlZC50aW1lc3RhbXAgPCAxNSAqIDYwICogMTAwMCkge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeShjYWNoZWQuc29uZ3MpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHl0cyhxKTtcbiAgICAgICAgICAgIGNvbnN0IHNvbmdzID0gcmVzdWx0cy52aWRlb3Muc2xpY2UoMCwgMjApLm1hcCh2ID0+ICh7XG4gICAgICAgICAgICAgIGlkOiB2LnZpZGVvSWQsXG4gICAgICAgICAgICAgIHRpdGxlOiB2LnRpdGxlLFxuICAgICAgICAgICAgICBhcnRpc3Q6IHYuYXV0aG9yLm5hbWUsXG4gICAgICAgICAgICAgIGFsYnVtOiAncGFwYWJ2dGlmeSBNdXNpYycsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB2LnNlY29uZHMsXG4gICAgICAgICAgICAgIHRodW1ibmFpbDogdi50aHVtYm5haWwgfHwgYGh0dHBzOi8vaS55dGltZy5jb20vdmkvJHt2LnZpZGVvSWR9L2hxZGVmYXVsdC5qcGdgLFxuICAgICAgICAgICAgICBzdHJlYW1Vcmw6IGAvYXBpL3N0cmVhbT9pZD0ke3YudmlkZW9JZH1gXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHNlYXJjaENhY2hlLnNldChxLCB7IHRpbWVzdGFtcDogRGF0ZS5ub3coKSwgc29uZ3MgfSk7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoc29uZ3MpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignU2VhcmNoIGVycm9yOicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpcmVjdCBBdWRpbyBTdHJlYW0gd2l0aCBGdWxsIEhUVFAgUmFuZ2UgU3VwcG9ydCAoUmFuZ2UgMjA2KVxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9zdHJlYW0nKSB7XG4gICAgICAgICAgY29uc3QgaWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnaWQnKTtcbiAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCdNaXNzaW5nIHNvbmcgaWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGZvcm1hdCA9IGZvcm1hdENhY2hlLmdldChpZCk7XG4gICAgICAgICAgICBpZiAoIWZvcm1hdCB8fCAhZm9ybWF0LnVybCkge1xuICAgICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgeXRkbC5nZXRJbmZvKGlkKTtcbiAgICAgICAgICAgICAgZm9ybWF0ID0gY2hvb3NlRm9ybWF0KGluZm8uZm9ybWF0cywge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogKGY6IGFueSkgPT4gZi5oYXNBdWRpbyAmJiAhZi5oYXNWaWRlbyxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiAnaGlnaGVzdGF1ZGlvJ1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgZm9ybWF0Q2FjaGUuc2V0KGlkLCBmb3JtYXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByYW5nZUhlYWRlciA9IHJlcS5oZWFkZXJzLnJhbmdlO1xuICAgICAgICAgICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNC4wLjAuMCBTYWZhcmkvNTM3LjM2J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyYW5nZUhlYWRlcikge1xuICAgICAgICAgICAgICBoZWFkZXJzWydSYW5nZSddID0gcmFuZ2VIZWFkZXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3h5UmVzID0gYXdhaXQgZmV0Y2goZm9ybWF0LnVybCwgeyBoZWFkZXJzIH0pO1xuXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHByb3h5UmVzLnN0YXR1cztcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGZvcm1hdC5taW1lVHlwZSB8fCAnYXVkaW8vd2VibScpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXB0LVJhbmdlcycsICdieXRlcycpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcblxuICAgICAgICAgICAgY29uc3QgY29udGVudFJhbmdlID0gcHJveHlSZXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtcmFuZ2UnKTtcbiAgICAgICAgICAgIGlmIChjb250ZW50UmFuZ2UpIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnLCBjb250ZW50UmFuZ2UpO1xuXG4gICAgICAgICAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gcHJveHlSZXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtbGVuZ3RoJyk7XG4gICAgICAgICAgICBpZiAoY29udGVudExlbmd0aCkgcmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBjb250ZW50TGVuZ3RoKTtcblxuICAgICAgICAgICAgaWYgKCFwcm94eVJlcy5ib2R5KSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IHByb3h5UmVzLmJvZHkuZ2V0UmVhZGVyKCk7XG4gICAgICAgICAgICByZXEub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0cnkgeyByZWFkZXIuY2FuY2VsKCk7IH0gY2F0Y2ggKF8pIHt9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgICAgICAgICAgaWYgKGRvbmUpIGJyZWFrO1xuICAgICAgICAgICAgICByZXMud3JpdGUodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdTdHJlYW0gZXJyb3IgZm9yJywgaWQsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgcmVzLmVuZChlcnIubWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIFJFQUxUSU1FIExJU1RFTklORyBST09NIChERU5HQVIgQkVSU0FNQSkgRU5EUE9JTlRTXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAgICAgLy8gMS4gQ3JlYXRlIFJvb21cbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvcm9vbXMvY3JlYXRlJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VKc29uQm9keShyZXEpO1xuICAgICAgICAgIGNvbnN0IGNoYXJzID0gJ0FCQ0RFRkdISktMTU5QUVJTVFVWV1hZWjIzNDU2Nzg5JztcbiAgICAgICAgICBsZXQgY29kZSA9ICdQVic7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGNvZGUgKz0gY2hhcnMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGhvc3RJZCA9IGJvZHkucGFydGljaXBhbnRJZCB8fCAoJ3VzZXJfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA5KSk7XG4gICAgICAgICAgY29uc3QgaG9zdE5hbWUgPSBib2R5Lmhvc3ROYW1lIHx8ICdIb3N0IFBBUEFCVlRJRlknO1xuICAgICAgICAgIGNvbnN0IGhvc3RBdmF0YXIgPSBib2R5LmF2YXRhciB8fCBtYWtlSW5pdGlhbEF2YXRhcihob3N0TmFtZSk7XG5cbiAgICAgICAgICBjb25zdCBuZXdSb29tOiBTZXJ2ZXJSb29tID0ge1xuICAgICAgICAgICAgY29kZSxcbiAgICAgICAgICAgIG5hbWU6IGJvZHkubmFtZSB8fCBgUm9vbSBNdXNpayAke2NvZGV9YCxcbiAgICAgICAgICAgIGhvc3RJZCxcbiAgICAgICAgICAgIGhvc3ROYW1lLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgbGFzdEFjdGl2ZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGFsbG93R3Vlc3RDb250cm9sOiAhIWJvZHkuYWxsb3dHdWVzdENvbnRyb2wsXG4gICAgICAgICAgICBtYXhSZXF1ZXN0c1BlclVzZXI6IDMsXG4gICAgICAgICAgICByZXF1ZXN0czogW10sXG4gICAgICAgICAgICByZXF1ZXN0Q29vbGRvd25zOiBuZXcgTWFwKCksXG4gICAgICAgICAgICBwbGF5YmFja1N0YXRlOiB7XG4gICAgICAgICAgICAgIHNvbmc6IGJvZHkuaW5pdGlhbFNvbmcgfHwgbnVsbCxcbiAgICAgICAgICAgICAgaXNQbGF5aW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgcG9zaXRpb246IDAsXG4gICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgc3BlZWQ6IDEuMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHF1ZXVlOiBib2R5LnF1ZXVlIHx8IFtdLFxuICAgICAgICAgICAgcGFydGljaXBhbnRzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogaG9zdElkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGhvc3ROYW1lLFxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBib2R5LnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIGF2YXRhcjogaG9zdEF2YXRhcixcbiAgICAgICAgICAgICAgICBpc0hvc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgam9pbmVkQXQ6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgbGFzdEFjdGl2ZTogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXSxcbiAgICAgICAgICAgIHNzZUNsaWVudHM6IFtdXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJvb21zLnNldChjb2RlLCBuZXdSb29tKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyByb29tOiB7IC4uLm5ld1Jvb20sIHNzZUNsaWVudHM6IHVuZGVmaW5lZCB9LCBwYXJ0aWNpcGFudElkOiBob3N0SWQsIGlzSG9zdDogdHJ1ZSB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBHZXQgUm9vbSBieSBDb2RlXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL2dldCcpIHtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdjb2RlJykgfHwgJycpLnRvVXBwZXJDYXNlKCkudHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHJvb20gPSByb29tcy5nZXQoY29kZSk7XG4gICAgICAgICAgaWYgKCFyb29tKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Jvb20gdGlkYWsgZGl0ZW11a2FuIGF0YXUgc3VkYWggYmVyYWtoaXIuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgLi4ucm9vbSwgc3NlQ2xpZW50czogdW5kZWZpbmVkIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMuIEpvaW4gUm9vbVxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9yb29tcy9qb2luJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VKc29uQm9keShyZXEpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSAoYm9keS5jb2RlIHx8ICcnKS50b1VwcGVyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCByb29tID0gcm9vbXMuZ2V0KGNvZGUpO1xuICAgICAgICAgIGlmICghcm9vbSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdLb2RlIHJvb20gdGlkYWsgdmFsaWQuJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcGFydGljaXBhbnRJZCA9IGJvZHkucGFydGljaXBhbnRJZCB8fCAoJ3VzZXJfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA5KSk7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGJvZHkubmFtZSB8fCBgUGVuZGVuZ2FyICR7cGFydGljaXBhbnRJZC5zbGljZSgtMyl9YDtcbiAgICAgICAgICBjb25zdCBhdmF0YXIgPSBib2R5LmF2YXRhciB8fCBtYWtlSW5pdGlhbEF2YXRhcihuYW1lKTtcblxuICAgICAgICAgIC8vIENoZWNrIGlmIGFscmVhZHkgaW4gcGFydGljaXBhbnRzIGxpc3RcbiAgICAgICAgICBsZXQgZXhpc3RpbmcgPSByb29tLnBhcnRpY2lwYW50cy5maW5kKHAgPT4gcC5pZCA9PT0gcGFydGljaXBhbnRJZCk7XG4gICAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3RpbmcgPSB7XG4gICAgICAgICAgICAgIGlkOiBwYXJ0aWNpcGFudElkLFxuICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICB1c2VybmFtZTogYm9keS51c2VybmFtZSxcbiAgICAgICAgICAgICAgYXZhdGFyLFxuICAgICAgICAgICAgICBpc0hvc3Q6IHJvb20uaG9zdElkID09PSBwYXJ0aWNpcGFudElkLFxuICAgICAgICAgICAgICBqb2luZWRBdDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgbGFzdEFjdGl2ZTogRGF0ZS5ub3coKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJvb20ucGFydGljaXBhbnRzLnB1c2goZXhpc3RpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleGlzdGluZy5sYXN0QWN0aXZlID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByb29tLmxhc3RBY3RpdmUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIGJyb2FkY2FzdFRvUm9vbShyb29tLCAncGFydGljaXBhbnRfam9pbmVkJywgZXhpc3RpbmcpO1xuXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgcm9vbTogeyAuLi5yb29tLCBzc2VDbGllbnRzOiB1bmRlZmluZWQgfSwgcGFydGljaXBhbnRJZCwgaXNIb3N0OiByb29tLmhvc3RJZCA9PT0gcGFydGljaXBhbnRJZCB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA0LiBTZXJ2ZXItU2VudCBFdmVudHMgKFNTRSkgU3RyZWFtXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL2V2ZW50cycpIHtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdjb2RlJykgfHwgJycpLnRvVXBwZXJDYXNlKCkudHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHBhcnRpY2lwYW50SWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgncGFydGljaXBhbnRJZCcpIHx8ICcnO1xuICAgICAgICAgIGNvbnN0IHJvb20gPSByb29tcy5nZXQoY29kZSk7XG5cbiAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoJ1Jvb20gbm90IGZvdW5kJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9ldmVudC1zdHJlYW0nLFxuICAgICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICAgJ0Nvbm5lY3Rpb24nOiAna2VlcC1hbGl2ZScsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBSZWdpc3RlciBjbGllbnRcbiAgICAgICAgICBjb25zdCBjbGllbnQgPSB7IHJlcywgcGFydGljaXBhbnRJZCB9O1xuICAgICAgICAgIHJvb20uc3NlQ2xpZW50cy5wdXNoKGNsaWVudCk7XG5cbiAgICAgICAgICAvLyBTZW5kIGluaXRpYWwgc3RhdGVcbiAgICAgICAgICByZXMud3JpdGUoYGV2ZW50OiBpbml0XFxuZGF0YTogJHtKU09OLnN0cmluZ2lmeSh7IC4uLnJvb20sIHNzZUNsaWVudHM6IHVuZGVmaW5lZCB9KX1cXG5cXG5gKTtcblxuICAgICAgICAgIHJlcS5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgICAgICByb29tLnNzZUNsaWVudHMgPSByb29tLnNzZUNsaWVudHMuZmlsdGVyKGMgPT4gYyAhPT0gY2xpZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyBTT05HIFJFUVVFU1QgU1lTVEVNIChMSVNURU5JTkcgUk9PTSlcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICAgICAvLyA1LiBTdWJtaXQgU29uZyBSZXF1ZXN0IChMaXN0ZW5lciAtPiBIb3N0KVxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9yb29tcy9yZXF1ZXN0L2NyZWF0ZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKGJvZHkuY29kZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zLmdldChjb2RlKTtcbiAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdSb29tIHRpZGFrIGRpdGVtdWthbi4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCByZXF1ZXN0ZXJJZCA9IGJvZHkucmVxdWVzdGVySWQ7XG4gICAgICAgICAgY29uc3QgaXNQYXJ0aWNpcGFudCA9IHJvb20ucGFydGljaXBhbnRzLnNvbWUocCA9PiBwLmlkID09PSByZXF1ZXN0ZXJJZCk7XG4gICAgICAgICAgaWYgKCFpc1BhcnRpY2lwYW50KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMztcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSGFueWEgcGVzZXJ0YSB5YW5nIGJlcmdhYnVuZyBkaSByb29tIHlhbmcgZGFwYXQgbWVuZ2FqdWthbiBsYWd1LicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvb2xkb3duIGNoZWNrICgyNSBzZWNvbmRzKVxuICAgICAgICAgIGNvbnN0IGxhc3RSZXEgPSByb29tLnJlcXVlc3RDb29sZG93bnMuZ2V0KHJlcXVlc3RlcklkKSB8fCAwO1xuICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSAoRGF0ZS5ub3coKSAtIGxhc3RSZXEpIC8gMTAwMDtcbiAgICAgICAgICBpZiAoZWxhcHNlZCA8IDI1KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQyOTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBgTW9ob24gdHVuZ2d1ICR7TWF0aC5jZWlsKDI1IC0gZWxhcHNlZCl9IGRldGlrIHNlYmVsdW0gbWVuZ2FqdWthbiBsYWd1IGJlcmlrdXRueWEuYCB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ2hlY2sgbWF4IHBlbmRpbmcgcmVxdWVzdHNcbiAgICAgICAgICBjb25zdCBwZW5kaW5nQ291bnQgPSByb29tLnJlcXVlc3RzLmZpbHRlcihyID0+IHIucmVxdWVzdGVySWQgPT09IHJlcXVlc3RlcklkICYmIHIuc3RhdHVzID09PSAncGVuZGluZycpLmxlbmd0aDtcbiAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID49IChyb29tLm1heFJlcXVlc3RzUGVyVXNlciB8fCAzKSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogYEJhdGFzIHBlbmdhanVhbiB0ZXJjYXBhaSAoJHtyb29tLm1heFJlcXVlc3RzUGVyVXNlciB8fCAzfSBsYWd1IHBlbmRpbmcpLiBIYXJhcCB0dW5nZ3Uga2VwdXR1c2FuIGhvc3QuYCB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRHVwbGljYXRlIGNoZWNrOiBub3QgaW4gcXVldWUgb3IgcGVuZGluZyByZXF1ZXN0c1xuICAgICAgICAgIGNvbnN0IHNvbmdJZCA9IGJvZHkuc29uZz8uaWQ7XG4gICAgICAgICAgY29uc3QgaW5RdWV1ZSA9IHJvb20ucXVldWUuc29tZShzID0+IHMuaWQgPT09IHNvbmdJZCkgfHwgKHJvb20ucGxheWJhY2tTdGF0ZS5zb25nPy5pZCA9PT0gc29uZ0lkKTtcbiAgICAgICAgICBjb25zdCBpblBlbmRpbmcgPSByb29tLnJlcXVlc3RzLnNvbWUociA9PiByLnNvbmcuaWQgPT09IHNvbmdJZCAmJiByLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKTtcbiAgICAgICAgICBpZiAoaW5RdWV1ZSB8fCBpblBlbmRpbmcpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdMYWd1IGluaSBzdWRhaCBhZGEgZGFsYW0gYW50cmVhbiBhdGF1IHNlZGFuZyBtZW51bmdndSBwZXJzZXR1anVhbiBob3N0LicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHJlcXVlc3RJdGVtOiBTZXJ2ZXJTb25nUmVxdWVzdCA9IHtcbiAgICAgICAgICAgIGlkOiAncmVxXycgKyBjcnlwdG8ucmFuZG9tQnl0ZXMoNikudG9TdHJpbmcoJ2hleCcpLFxuICAgICAgICAgICAgcm9vbUNvZGU6IGNvZGUsXG4gICAgICAgICAgICByZXF1ZXN0ZXJJZCxcbiAgICAgICAgICAgIHJlcXVlc3Rlck5hbWU6IGJvZHkucmVxdWVzdGVyTmFtZSB8fCAnS2F3YW4nLFxuICAgICAgICAgICAgcmVxdWVzdGVyVXNlcm5hbWU6IGJvZHkucmVxdWVzdGVyVXNlcm5hbWUgfHwgJ2xpc3RlbmVyJyxcbiAgICAgICAgICAgIHJlcXVlc3RlckF2YXRhcjogYm9keS5yZXF1ZXN0ZXJBdmF0YXIgfHwgbWFrZUluaXRpYWxBdmF0YXIoYm9keS5yZXF1ZXN0ZXJOYW1lIHx8ICdLYXdhbicpLFxuICAgICAgICAgICAgc29uZzogYm9keS5zb25nLFxuICAgICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IERhdGUubm93KClcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcm9vbS5yZXF1ZXN0cy51bnNoaWZ0KHJlcXVlc3RJdGVtKTtcbiAgICAgICAgICByb29tLnJlcXVlc3RDb29sZG93bnMuc2V0KHJlcXVlc3RlcklkLCBEYXRlLm5vdygpKTtcblxuICAgICAgICAgIC8vIEJyb2FkY2FzdCB0byBldmVyeW9uZSBpbiByb29tIChIb3N0IHdpbGwgcmVjZWl2ZSByZWFsLXRpbWUgbm90aWZpY2F0aW9uICYgcGVuZGluZyBjYXJkKVxuICAgICAgICAgIGJyb2FkY2FzdFRvUm9vbShyb29tLCAnc29uZ19yZXF1ZXN0ZWQnLCByZXF1ZXN0SXRlbSk7XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZXF1ZXN0OiByZXF1ZXN0SXRlbSB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA2LiBIb3N0IFJlc3BvbmRzIHRvIFJlcXVlc3QgKEFDQ0VQVCAvIFJFSkVDVCkgLSBTVFJJQ1QgSE9TVCBQRVJNSVNTSU9OIENIRUNLXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL3JlcXVlc3QvcmVzcG9uZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKGJvZHkuY29kZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zLmdldChjb2RlKTtcbiAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdSb29tIHRpZGFrIGRpdGVtdWthbi4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBCQUNLRU5EIFBFUk1JU1NJT04gQ0hFQ0s6IE9ubHkgaG9zdCBjYW4gcmVzcG9uZFxuICAgICAgICAgIGlmIChyb29tLmhvc3RJZCAhPT0gYm9keS5wYXJ0aWNpcGFudElkKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMztcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnQWtzZXMgZGl0b2xhazogSGFueWEgSG9zdCB5YW5nIG1lbWlsaWtpIHdld2VuYW5nIG1lbmVyaW1hIGF0YXUgbWVub2xhayBwZW5nYWp1YW4gbGFndS4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCByZXFJdGVtID0gcm9vbS5yZXF1ZXN0cy5maW5kKHIgPT4gci5pZCA9PT0gYm9keS5yZXF1ZXN0SWQpO1xuICAgICAgICAgIGlmICghcmVxSXRlbSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Blcm1pbnRhYW4gbGFndSB0aWRhayBkaXRlbXVrYW4uJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gYm9keS5hY3Rpb247IC8vICdhY2NlcHQnIG9yICdyZWplY3QnXG4gICAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ2FjY2VwdCcpIHtcbiAgICAgICAgICAgIHJlcUl0ZW0uc3RhdHVzID0gJ2FjY2VwdGVkJztcbiAgICAgICAgICAgIHJlcUl0ZW0ucmVzcG9uZGVkQXQgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgICAgICAvLyBBcHBlbmQgc29uZyB0byBzaGFyZWQgcXVldWUgd2l0aCByZXF1ZXN0ZXIgYXR0cmlidXRpb25cbiAgICAgICAgICAgIGNvbnN0IHF1ZXVlZFNvbmcgPSB7XG4gICAgICAgICAgICAgIC4uLnJlcUl0ZW0uc29uZyxcbiAgICAgICAgICAgICAgcmVxdWVzdGVkQnk6IHtcbiAgICAgICAgICAgICAgICBpZDogcmVxSXRlbS5yZXF1ZXN0ZXJJZCxcbiAgICAgICAgICAgICAgICBuYW1lOiByZXFJdGVtLnJlcXVlc3Rlck5hbWUsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHJlcUl0ZW0ucmVxdWVzdGVyVXNlcm5hbWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJvb20ucXVldWUucHVzaChxdWV1ZWRTb25nKTtcblxuICAgICAgICAgICAgLy8gQnJvYWRjYXN0IGV2ZW50c1xuICAgICAgICAgICAgYnJvYWRjYXN0VG9Sb29tKHJvb20sICdyZXF1ZXN0X2FjY2VwdGVkJywge1xuICAgICAgICAgICAgICByZXF1ZXN0SWQ6IHJlcUl0ZW0uaWQsXG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHJlcUl0ZW0sXG4gICAgICAgICAgICAgIHF1ZXVlOiByb29tLnF1ZXVlLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb246IGBMYWd1IFwiJHtyZXFJdGVtLnNvbmcudGl0bGV9XCIgZGFyaSBAJHtyZXFJdGVtLnJlcXVlc3RlclVzZXJuYW1lfSB0ZWxhaCBkaXRlcmltYSBrZSBhbnRyZWFuIWBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJvYWRjYXN0VG9Sb29tKHJvb20sICdzeW5jJywgeyBxdWV1ZTogcm9vbS5xdWV1ZSB9KTtcblxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGFjdGlvbjogJ2FjY2VwdCcsIHF1ZXVlOiByb29tLnF1ZXVlIH0pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxSXRlbS5zdGF0dXMgPSAncmVqZWN0ZWQnO1xuICAgICAgICAgICAgcmVxSXRlbS5yZXNwb25kZWRBdCA9IERhdGUubm93KCk7XG5cbiAgICAgICAgICAgIGJyb2FkY2FzdFRvUm9vbShyb29tLCAncmVxdWVzdF9yZWplY3RlZCcsIHtcbiAgICAgICAgICAgICAgcmVxdWVzdElkOiByZXFJdGVtLmlkLFxuICAgICAgICAgICAgICByZXF1ZXN0OiByZXFJdGVtLFxuICAgICAgICAgICAgICBub3RpZmljYXRpb246IGBQZW5nYWp1YW4gbGFndSBcIiR7cmVxSXRlbS5zb25nLnRpdGxlfVwiIGRhcmkgQCR7cmVxSXRlbS5yZXF1ZXN0ZXJVc2VybmFtZX0gdGVsYWggZGl0b2xhayBvbGVoIGhvc3QuYFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBhY3Rpb246ICdyZWplY3QnIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA3LiBDYW5jZWwgUGVuZGluZyBSZXF1ZXN0IChCeSBSZXF1ZXN0ZXIpXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL3JlcXVlc3QvY2FuY2VsJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VKc29uQm9keShyZXEpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSAoYm9keS5jb2RlIHx8ICcnKS50b1VwcGVyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCByb29tID0gcm9vbXMuZ2V0KGNvZGUpO1xuICAgICAgICAgIGlmICghcm9vbSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUm9vbSB0aWRhayBkaXRlbXVrYW4uJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcmVxSWR4ID0gcm9vbS5yZXF1ZXN0cy5maW5kSW5kZXgociA9PiByLmlkID09PSBib2R5LnJlcXVlc3RJZCAmJiByLnJlcXVlc3RlcklkID09PSBib2R5LnBhcnRpY2lwYW50SWQgJiYgci5zdGF0dXMgPT09ICdwZW5kaW5nJyk7XG4gICAgICAgICAgaWYgKHJlcUlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Blcm1pbnRhYW4gdGlkYWsgZGFwYXQgZGliYXRhbGthbi4nIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCByZW1vdmVkID0gcm9vbS5yZXF1ZXN0cy5zcGxpY2UocmVxSWR4LCAxKVswXTtcbiAgICAgICAgICBicm9hZGNhc3RUb1Jvb20ocm9vbSwgJ3JlcXVlc3RfY2FuY2VsbGVkJywgeyByZXF1ZXN0SWQ6IHJlbW92ZWQuaWQgfSk7XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDguIFN5bmMgUGxheWJhY2sgU3RhdGUgKEhvc3QgYnJvYWRjYXN0cyB0byBsaXN0ZW5lcnMpXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL3N5bmMnICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBwYXJzZUpzb25Cb2R5KHJlcSk7XG4gICAgICAgICAgY29uc3QgY29kZSA9IChib2R5LmNvZGUgfHwgJycpLnRvVXBwZXJDYXNlKCkudHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHJvb20gPSByb29tcy5nZXQoY29kZSk7XG5cbiAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Jvb20gbm90IGZvdW5kJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQkFDS0VORCBQRVJNSVNTSU9OIENIRUNLOiBTdHJpY3QgSG9zdCBSQkFDIC0gb25seSBob3N0IGNhbiBzeW5jIHBsYXliYWNrXG4gICAgICAgICAgaWYgKHJvb20uaG9zdElkICE9PSBib2R5LnBhcnRpY2lwYW50SWQpIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAzO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdBa3NlcyBkaXRvbGFrOiBIYW55YSBob3N0IHlhbmcgbWVtaWxpa2kgd2V3ZW5hbmcgbWVtdXRhciwgbWVuamVkYSwgYXRhdSBtZW5ndWJhaCBsYWd1LicgfSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChib2R5LnBsYXliYWNrU3RhdGUpIHtcbiAgICAgICAgICAgIHJvb20ucGxheWJhY2tTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgLi4uYm9keS5wbGF5YmFja1N0YXRlLFxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChib2R5LnF1ZXVlKSB7XG4gICAgICAgICAgICByb29tLnF1ZXVlID0gYm9keS5xdWV1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBib2R5LmFsbG93R3Vlc3RDb250cm9sID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHJvb20uYWxsb3dHdWVzdENvbnRyb2wgPSBib2R5LmFsbG93R3Vlc3RDb250cm9sO1xuICAgICAgICAgIH1cbiAgICAgICAgICByb29tLmxhc3RBY3RpdmUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgICAgYnJvYWRjYXN0VG9Sb29tKHJvb20sICdzeW5jJywge1xuICAgICAgICAgICAgcGxheWJhY2tTdGF0ZTogcm9vbS5wbGF5YmFja1N0YXRlLFxuICAgICAgICAgICAgcXVldWU6IHJvb20ucXVldWUsXG4gICAgICAgICAgICBhbGxvd0d1ZXN0Q29udHJvbDogcm9vbS5hbGxvd0d1ZXN0Q29udHJvbFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyA5LiBTZW5kIEVtb2ppIFJlYWN0aW9uXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL3JlYWN0aW9uJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcGFyc2VKc29uQm9keShyZXEpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSAoYm9keS5jb2RlIHx8ICcnKS50b1VwcGVyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCByb29tID0gcm9vbXMuZ2V0KGNvZGUpO1xuICAgICAgICAgIGlmICghcm9vbSkge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUm9vbSBub3QgZm91bmQnIH0pKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCByZWFjdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiAncmVhY3RfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA5KSxcbiAgICAgICAgICAgIHBhcnRpY2lwYW50TmFtZTogYm9keS5wYXJ0aWNpcGFudE5hbWUgfHwgJ0thd2FuJyxcbiAgICAgICAgICAgIGVtb2ppOiBib2R5LmVtb2ppIHx8ICdcdUQ4M0RcdUREMjUnLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJvb20ucmVhY3Rpb25zLnVuc2hpZnQocmVhY3Rpb24pO1xuICAgICAgICAgIHJvb20ucmVhY3Rpb25zID0gcm9vbS5yZWFjdGlvbnMuc2xpY2UoMCwgMzApO1xuICAgICAgICAgIGJyb2FkY2FzdFRvUm9vbShyb29tLCAncmVhY3Rpb24nLCByZWFjdGlvbik7XG5cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZWFjdGlvbiB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxMC4gU2VuZCBDaGF0IE1lc3NhZ2VcbiAgICAgICAgaWYgKHVybC5wYXRobmFtZSA9PT0gJy9hcGkvcm9vbXMvY2hhdCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKGJvZHkuY29kZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zLmdldChjb2RlKTtcbiAgICAgICAgICBpZiAoIXJvb20pIHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Jvb20gbm90IGZvdW5kJyB9KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbXNnID0ge1xuICAgICAgICAgICAgaWQ6ICdtc2dfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA5KSxcbiAgICAgICAgICAgIHBhcnRpY2lwYW50SWQ6IGJvZHkucGFydGljaXBhbnRJZCxcbiAgICAgICAgICAgIHBhcnRpY2lwYW50TmFtZTogYm9keS5wYXJ0aWNpcGFudE5hbWUgfHwgJ0thd2FuJyxcbiAgICAgICAgICAgIHRleHQ6IChib2R5LnRleHQgfHwgJycpLnRyaW0oKS5zbGljZSgwLCAyMDApLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJvb20ubWVzc2FnZXMucHVzaChtc2cpO1xuICAgICAgICAgIHJvb20ubWVzc2FnZXMgPSByb29tLm1lc3NhZ2VzLnNsaWNlKC01MCk7XG4gICAgICAgICAgYnJvYWRjYXN0VG9Sb29tKHJvb20sICdjaGF0JywgbXNnKTtcblxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IG1zZyB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxMS4gTGVhdmUgUm9vbVxuICAgICAgICBpZiAodXJsLnBhdGhuYW1lID09PSAnL2FwaS9yb29tcy9sZWF2ZScgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKGJvZHkuY29kZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zLmdldChjb2RlKTtcbiAgICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgcm9vbS5wYXJ0aWNpcGFudHMgPSByb29tLnBhcnRpY2lwYW50cy5maWx0ZXIocCA9PiBwLmlkICE9PSBib2R5LnBhcnRpY2lwYW50SWQpO1xuICAgICAgICAgICAgLy8gQ2FuY2VsIGFueSBwZW5kaW5nIHJlcXVlc3RzIGZyb20gdGhlIGRlcGFydGluZyBsaXN0ZW5lclxuICAgICAgICAgICAgcm9vbS5yZXF1ZXN0cyA9IHJvb20ucmVxdWVzdHMuZmlsdGVyKHIgPT4gIShyLnJlcXVlc3RlcklkID09PSBib2R5LnBhcnRpY2lwYW50SWQgJiYgci5zdGF0dXMgPT09ICdwZW5kaW5nJykpO1xuICAgICAgICAgICAgYnJvYWRjYXN0VG9Sb29tKHJvb20sICdwYXJ0aWNpcGFudF9sZWZ0JywgeyBwYXJ0aWNpcGFudElkOiBib2R5LnBhcnRpY2lwYW50SWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gMTIuIEVuZCBSb29tXG4gICAgICAgIGlmICh1cmwucGF0aG5hbWUgPT09ICcvYXBpL3Jvb21zL2VuZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHBhcnNlSnNvbkJvZHkocmVxKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gKGJvZHkuY29kZSB8fCAnJykudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3Qgcm9vbSA9IHJvb21zLmdldChjb2RlKTtcbiAgICAgICAgICBpZiAocm9vbSAmJiByb29tLmhvc3RJZCA9PT0gYm9keS5wYXJ0aWNpcGFudElkKSB7XG4gICAgICAgICAgICBicm9hZGNhc3RUb1Jvb20ocm9vbSwgJ3Jvb21fZW5kZWQnLCB7IG1lc3NhZ2U6ICdIb3N0IHRlbGFoIG1lbmdha2hpcmkgcm9vbSBtdXNpay4nIH0pO1xuICAgICAgICAgICAgcm9vbXMuZGVsZXRlKGNvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHBhcGFidnRpZnlCYWNrZW5kUGx1Z2luKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWVcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdZLFNBQVMsb0JBQTRC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
