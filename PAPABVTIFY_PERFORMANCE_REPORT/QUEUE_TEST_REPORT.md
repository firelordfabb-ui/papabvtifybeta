# PAPABVTIFY — MUSIC QUEUE TEST REPORT

## 1. Ikhtisar Arsitektur Antrean Musik
Sistem antrean musik PAPABVTIFY kini menggunakan single source of truth yang disinkronkan antara React state (`queue`), reference pointer (`queueRef`), penyimpanan lokal (`StorageService`), dan Audio Engine (`AudioEngine`).

### Komponen Utama:
* **State & Ref Synchronization:** Memastikan ketiadaan stale closure saat event `ended` terjadi di audio HTML5.
* **Autoplay Queue Consumer:** Ketika sebuah lagu selesai, pemutar musik memeriksa antrean terlebih dahulu sebelum memanggil algoritma rekomendasi.
* **Penyusunan Antrean (Reordering):** Mendukung drag-and-drop HTML5 serta tombol manual Naik/Turun.
* **Persistensi Antrean:** Tersimpan secara aman di `localStorage` melalui key `papabvtify_queue_v1`, sehingga antrean tidak hilang saat berpindah halaman atau saat aplikasi ditutup dan dibuka kembali.

---

## 2. Pengujian Skenario & Hasil Verifikasi

### Skenario 1: Menambahkan 5 Lagu ke Antrean (`Add to Queue`)
* **Prosedur:** Memilih 5 lagu berbeda dari pustaka/rekomendasi dan menambahkan ke antrean via `handleAddToQueue`.
* **Ekspektasi:** Seluruh 5 lagu tercatat secara berurutan di dalam antrean tanpa menyusupkan lagu acak.
* **Hasil:** **LULUS (PASSED)**. State `queue` mencatat tepat 5 lagu dengan metadata lengkap (judul, artis, durasi, thumbnail).

### Skenario 2: Mengubah Urutan Antrean (`Reorder via Drag & Drop / Buttons`)
* **Prosedur:** Menggeser lagu urutan ke-4 ke urutan ke-1 menggunakan drag-and-drop, serta memindahkan lagu menggunakan tombol panah atas/bawah.
* **Ekspektasi:** Posisi lagu berpindah secara instan tanpa duplikasi dan perubahan urutan langsung tersimpan di storage.
* **Hasil:** **LULUS (PASSED)**. Mutasi index array dilakukan secara akurat melalui `handleReorderQueue(fromIndex, toIndex)` dan tersinkronkan ke `StorageService.saveQueue`.

### Skenario 3: Menghapus Lagu Tertentu (`Remove from Queue`)
* **Prosedur:** Menghapus lagu di urutan tengah menggunakan tombol tempat sampah (`Trash2`).
* **Ekspektasi:** Hanya lagu tersebut yang terhapus; indeks lagu lain tergeser dengan rapi.
* **Hasil:** **LULUS (PASSED)**. `handleRemoveFromQueue(index)` menghapus elemen spesifik tanpa error index out-of-bounds.

### Skenario 4: Fitur Putar Berikutnya (`Play Next`)
* **Prosedur:** Memanggil `handlePlayNext(song)` untuk menyisipkan lagu di depan antrean.
* **Ekspektasi:** Lagu disisipkan pada indeks 0 (paling depan) sehingga menjadi lagu berikutnya yang diputar.
* **Hasil:** **LULUS (PASSED)**. Lagu prioritas disisipkan di posisi terdepan antrean dan notifikasi toast muncul mengonfirmasi.

### Skenario 5: Autoplay saat Lagu Selesai (`Automatic Queue Playback`)
* **Prosedur:** Membiarkan lagu saat ini mencapai akhir durasi (atau memicu event `ended`).
* **Ekspektasi:** Sistem secara otomatis mengambil lagu pertama dari antrean, memutarnya, dan menghapus lagu tersebut dari sisa antrean.
* **Hasil:** **LULUS (PASSED)**. `handleNextRef.current()` membaca `queueRef.current[0]`, mengonsumsi lagu tersebut, dan sisa antrean tersimpan dengan benar.

### Skenario 6: Mengosongkan Seluruh Antrean (`Clear Queue`)
* **Prosedur:** Menekan tombol "Kosongkan" di header `QueueModal`.
* **Ekspektasi:** Seluruh antrean dibersihkan dan modal menampilkan status kosong ("Belum ada lagu di antrean").
* **Hasil:** **LULUS (PASSED)**. Antrean dikosongkan secara bersih dan storage di-update menjadi `[]`.

### Skenario 7: Perpindahan Halaman & Siklus Restart Aplikasi
* **Prosedur:** Menambahkan lagu ke antrean di Beranda, berpindah ke Cari, Pustaka, Podcast, lalu menutup dan membuka kembali aplikasi.
* **Ekspektasi:** Antrean tetap utuh di setiap halaman dan setelah aplikasi dibuka kembali.
* **Hasil:** **LULUS (PASSED)**. Antrean dimuat secara konsisten dari `StorageService.getQueue()`.
