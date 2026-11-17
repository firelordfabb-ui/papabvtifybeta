# PAPABVTIFY — Listening Room & Real-Time Sync Report

**Auditor:** Senior Real-Time Networking & Distributed Systems Engineer  
**Scope:** Server-Sent Events (SSE), State Machine, Host/Guest Permissions, Real-Time Cross-Device Playback  

---

## 1. Problem Statement & Failure Analysis

Pada APK Android awal, saat pengguna membuka menu Listening Room (`ListeningRoomView.tsx`):
1. Terjadi crash seketika dengan pesan:  
   `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
2. Koneksi Server-Sent Events (SSE) gagal terbentuk atau menghasilkan error network terus-menerus.
3. Sinkronisasi pemutaran lagu antara perangkat host (misal Windows Desktop) dan guest (ponsel Android) tidak berfungsi.

**Penyebab Inti:**
1. Di `src/services/roomService.ts`, pemanggilan API room menggunakan fetch relatif:
   - `fetch('/api/rooms')`
   - `fetch('/api/rooms/create', { method: 'POST', ... })`
   - `new EventSource('/api/rooms/' + roomId + '/events')`
2. Di lingkungan Capacitor Android, host adalah `https://localhost`. WebView mengarahkan panggilan ini ke file server internal yang menyajikan `dist/index.html`.
3. Saat `res.json()` dipanggil pada dokumen HTML, runtime melempar error `Unexpected token '<'`.
4. SSE `EventSource` mencoba membuka koneksi streaming ke `https://localhost/api/rooms/.../events`, yang mengembalikan HTML statis alih-alih event stream `text/event-stream`.

---

## 2. Engineering Architecture & Solutions

### A. Dynamic EventSource & Safe Fetch Implementation (`src/services/roomService.ts`)
Kami mengintegrasikan `ApiConfig` ke dalam seluruh lifecycle room:
1. **REST Operations (List Rooms, Create Room, Join Room, Send Chat, Request Song):**
   ```typescript
   export async function getRooms(): Promise<RoomInfo[]> {
     return ApiConfig.safeJsonFetch<RoomInfo[]>('/api/rooms');
   }
   
   export async function createRoom(payload: CreateRoomPayload): Promise<RoomInfo> {
     return ApiConfig.safeJsonFetch<RoomInfo>('/api/rooms/create', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     });
   }
   ```
2. **Server-Sent Events (SSE) Stream URL Resolution:**
   ```typescript
   export function connectRoomEvents(roomId: string, onEvent: (ev: RoomEvent) => void): () => void {
     const sseUrl = ApiConfig.resolveApiUrl(`/api/rooms/${encodeURIComponent(roomId)}/events`);
     const eventSource = new EventSource(sseUrl);
     ...
   }
   ```
   Pada Android APK, URL ini otomatis terselesaikan ke `http://192.168.1.10:5188/api/rooms/.../events` (atau server cloud yang dikonfigurasi).

### B. Real-Time Playback Synchronization Engine
- Ketika Host memutar, menjeda, atau melakukan seek pada lagu, event `playback_state` dipancarkan via SSE ke seluruh klien (termasuk Android guest).
- Perangkat Android menerima timestamp posisi audio dan mencocokkan drift waktu jika perbedaan melebihi 1.5 detik (clock synchronization).
- Request lagu dari Android guest langsung muncul di daftar request Host untuk di-approve.

---

## 3. Hasil Validasi Listening Room

| Skenario Pengujian | Aksi | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| Masuk ke Listening Room View | Buka via tab *Menu / Lainnya* di Android | Tampilan daftar room terbuka tanpa error HTML | ✅ Lulus |
| Buat Room Baru dari Android | Tekan "Buat Room Baru" | Room sukses terdaftar di backend Node.js | ✅ Lulus |
| Sambungan SSE Real-Time | Gabung ke Room aktif | Status koneksi hijau, event stream aktif | ✅ Lulus |
| Host Playback Sync | Host di Windows memutar lagu | HP Android otomatis memutar lagu yang sama | ✅ Lulus |
| Real-time Chat | Kirim pesan dari Android ke Room | Pesan muncul seketika di PC Windows dan HP | ✅ Lulus |
| Song Request Approval | Android me-request lagu | Notifikasi request masuk ke Host Windows | ✅ Lulus |
