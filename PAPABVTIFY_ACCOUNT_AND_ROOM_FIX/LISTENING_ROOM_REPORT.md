# LAPORAN LENGKAP: FITUR DENGAR BERSAMA (LISTENING ROOM ARCHITECTURE)
**PAPABVTIFY Audio Engine & Ecosystem — Version 3.3.0 Production Audit**
*Tanggal Audit: 17 November 2026 | Tim: Real-Time Audio Synchronization & Distributed Systems*

---

## 1. Ringkasan Eksekutif & Akar Masalah Error JSON

Pengguna melaporkan error fatal saat menggunakan fitur Dengar Bersama:
$$\text{"Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"}$$

### Investigasi Akar Masalah
1. Frontend memanggil `POST /api/rooms/create` saat pengguna menekan tombol "Buat Room Baru".
2. Pada `server.cjs` versi sebelumnya, endpoint `POST /api/rooms/create`, `POST /api/rooms/request/create`, `POST /api/rooms/request/cancel`, `POST /api/rooms/reaction`, `POST /api/rooms/chat`, `POST /api/rooms/leave`, dan `POST /api/rooms/end` **TIDAK TERSEDIA**.
3. Di akhir blok routing API, tidak ada penanganan 404 eksplisit. Permintaan yang tidak cocok jatuh (*fall through*) ke handler file statis (SPA Fallback) di baris 841:
   ```javascript
   if (!ext || ext === '.html') {
     filePath = path.join(DIST_DIR, 'index.html');
   }
   ```
4. Karena `/api/rooms/create` tidak memiliki ekstensi file, server merespons dengan isi file `dist/index.html` berkode status **HTTP 200 OK** dan Content-Type `text/html`.
5. Frontend membaca status 200 sebagai sukses (`res.ok === true`), lalu mengeksekusi `await res.json()`.
6. Parser JSON bawaan JavaScript mendapati karakter pertama adalah `<` dari `<!DOCTYPE html>`, sehingga melempar error `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.

---

## 2. Solusi & Implementasi Lengkap Endpoint Room

Seluruh suite endpoint Dengar Bersama kini telah diimplementasikan secara komprehensif di `server.cjs`:

| Endpoint | Method | Fungsi & Otorisasi |
| :--- | :---: | :--- |
| `/api/rooms/create` | `POST` | Membuat room baru dengan kode 6 karakter acak (`PVxxxx`). Host terdaftar otomatis. |
| `/api/rooms/get` | `GET` | Mengambil detail metadata ruangan dan status antrean aktif. |
| `/api/rooms/join` | `POST` | Pendengar bergabung ke dalam ruangan. Menyiarkan event `participant_joined`. |
| `/api/rooms/events` | `GET` | Membuka koneksi streaming Server-Sent Events (SSE) untuk sinkronisasi real-time. |
| `/api/rooms/sync` | `POST` | Menyiarkan posisi lagu, status play/pause, dan antrean. Hanya Host (atau Guest jika diizinkan). |
| `/api/rooms/request/create` | `POST` | Pendengar mengajukan lagu ke Host dengan pembatasan maksimal 3 antrean pending. |
| `/api/rooms/request/respond` | `POST` | **Host Only**: Menerima (*accept*) atau menolak (*reject*) pengajuan lagu. |
| `/api/rooms/request/cancel` | `POST` | Pendengar membatalkan pengajuan lagunya sendiri yang masih berstatus pending. |
| `/api/rooms/reaction` | `POST` | Menyiarkan reaksi emoji instan (maksimal buffer 20 reaksi). |
| `/api/rooms/chat` | `POST` | Menyiarkan pesan obrolan teks real-time (maksimal buffer 50 pesan). |
| `/api/rooms/leave` | `POST` | Pendengar keluar dari ruangan. Menyiarkan `participant_left`. |
| `/api/rooms/end` | `POST` | **Host Only**: Menutup ruangan secara permanen dan memutus koneksi seluruh SSE client. |

---

## 3. Struktur Objek Room di Server Memory

```javascript
{
  code: 'PVSF6A',
  name: 'Studio Santai Sore',
  hostId: 'host_8a2d1f',
  hostName: 'Fabb (Creator)',
  createdAt: 1731802900000,
  lastActive: 1731802950000,
  allowGuestControl: false,
  maxRequestsPerUser: 3,
  requests: [
    {
      id: 'req_b38c01',
      song: { id: 'track_123', title: 'Song Title', artist: 'Artist' },
      requesterId: 'user_listener_01',
      requesterName: 'Budi',
      status: 'pending',
      createdAt: 1731802920000
    }
  ],
  playbackState: {
    song: { id: 'track_lead', title: 'Lead Song' },
    isPlaying: true,
    position: 45.2,
    timestamp: 1731802930000,
    speed: 1.0
  },
  queue: [...],
  participants: [
    { id: 'host_8a2d1f', name: 'Fabb (Creator)', isHost: true, joinedAt: 1731802900000 }
  ],
  reactions: [],
  messages: [],
  sseClients: [] // Array of { res, participantId }
}
```

---

## 4. Penanganan Safe JSON di Sisi Frontend (`RoomService`)

Untuk menjamin agar error format HTML tidak akan pernah menabrak antarmuka pengguna lagi:
```typescript
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
```
Metode ini memastikan bahwa jika server memberikan status error atau respon non-JSON, pesan kesalahan akan ditangkap secara bersih dan ditampilkan dalam Bahasa Indonesia yang informatif pada UI banner, bukan *unhandled syntax error crash*.
