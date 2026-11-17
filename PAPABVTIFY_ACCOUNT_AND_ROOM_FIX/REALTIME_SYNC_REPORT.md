# LAPORAN LENGKAP: REALTIME SYNCHRONIZATION & DRIFT COMPENSATION
**PAPABVTIFY Audio Engine & Ecosystem — Version 3.3.0 Production Audit**
*Tanggal Audit: 17 November 2026 | Tim: Audio DSP & Real-Time Synchronization*

---

## 1. Arsitektur Komunikasi Dua Lapis (Dual-Channel Realtime Architecture)

Untuk menjamin latensi terendah pada berbagai lingkungan penggunaan, PAPABVTIFY mengombinasikan dua kanal komunikasi real-time:
1. **Server-Sent Events (SSE) via HTTP Streaming**:
   - Berfungsi untuk sinkronisasi antar perangkat yang berbeda jaringan (host-to-listener).
   - Mendukung streaming event satu arah yang sangat hemat daya CPU dan memory jika dibandingkan dengan WebSockets yang berat.
2. **Local BroadcastChannel API**:
   - Berfungsi untuk sinkronisasi instan *zero-latency* (0ms overhead) antar tab browser atau jendela yang berjalan pada mesin lokal yang sama.

---

## 2. Algoritma Kompensasi Latensi & Pergeseran Audio (Clock Drift Compensation)

Ketika Host memutar lagu dan menyiarkan posisi playback, pendengar berada pada waktu kedatangan paket yang berbeda karena latensi transmisi jaringan.

### Formula Perhitungan Posisi Target:
$$\text{Target Position} = \text{Host Position} + \left( \frac{\text{Current Time} - \text{Host Timestamp}}{1000} \right) \times \text{Playback Speed}$$

Implementasi pada `RoomService.calculateTargetPosition`:
```typescript
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
```

### Toleransi Pergeseran (Drift Threshold):
- Jika selisih antara posisi audio lokal pendengar dan target posisi Host $\le 1.5$ detik: Sistem membiarkan audio mengalir tanpa melakukan *seek* tiba-tiba (mencegah *audio stutter* atau loncatan suara).
- Jika selisih $> 1.5$ detik: Audio engine melakukan sinkronisasi ulang posisi secara halus (*soft seek*).

---

## 3. Matriks Hak Akses & Kontrol Ruangan

| Tindakan | Hak Akses Host | Hak Akses Pendengar | Kontrol Guest Diizinkan |
| :--- | :---: | :---: | :---: |
| Play / Pause Utama | **Ya** | Tidak | **Ya** (jika `allowGuestControl`) |
| Ganti Lagu (Next / Prev) | **Ya** | Tidak | **Ya** (jika `allowGuestControl`) |
| Atur Kecepatan Playback | **Ya** | Tidak | **Ya** (jika `allowGuestControl`) |
| Mengajukan Lagu (*Song Request*) | **Ya** | **Ya** (Maks 3 pending) | **Ya** |
| Menyetujui/Menolak Lagu | **Ya** | **DITOLAK (403)** | **DITOLAK (403)** |
| Kirim Chat & Reaksi Emoji | **Ya** | **Ya** | **Ya** |
| Mengakhiri Room (*End Room*) | **Ya** | **DITOLAK (403)** | **DITOLAK (403)** |

---

## 4. Hasil Uji Sinkronisasi Real-Time

- **Latensi SSE Lokal**: $< 8$ ms.
- **Latensi BroadcastChannel**: $< 1$ ms.
- **Kestabilan Buffer**: Audio memutar tanpa stutter saat perpindahan status Play/Pause antar perangkat.
- **Verifikasi Penolakan Ilegal**: Percobaan pendengar mengirimkan persetujuan lagu (`POST /api/rooms/request/respond`) diverifikasi sukses menghasilkan **HTTP 403 Forbidden**.
