# PAPABVTIFY — OFFLINE DOWNLOAD ENGINE & INDEXEDDB REPORT
**Module:** `src/services/downloadService.ts`  
**Database:** `papabvtify_offline_db` (IndexedDB Version 1, Object Store: `offline_tracks`)

---

## 1. Problem Diagnosis: Why Downloads Previously Failed
In previous revisions, the download action was largely visual or attempted to save remote HTTP URLs directly into localStorage, which was blocked by storage quota limits (5 MB maximum) or failed to stream binary audio buffers.

---

## 2. Full Streaming Architecture & Progressive Storage

`DownloadService` was re-engineered as a resilient streaming manager:
1. **ReadableStream Chunking:**
   - Connects to the streaming endpoint (`/api/stream?id=...`).
   - Uses `response.body.getReader()` to pull raw `Uint8Array` chunks progressively.
   - Computes exact `loadedBytes / totalBytes` and dispatches live progress updates (`status: 'downloading', percent: 0–100%`).
2. **Binary Blob Construction:**
   - Assembles the downloaded chunks into a standard MIME-typed `Blob` (`audio/mpeg`).
3. **IndexedDB Persistent Storage:**
   - Saves the record into IndexedDB with schema:
     ```typescript
     interface OfflineTrackRecord {
       id: string;
       song: Song;
       blob: Blob;
       sizeBytes: number;
       mimeType: string;
       downloadedAt: number;
     }
     ```
4. **Fast Synchronous State Cache:**
   - An in-memory `Set<string>` caches IDs of downloaded songs during boot, eliminating asynchronous IndexedDB latency for UI badge checks (`isDownloadedSync`).
5. **Offline Object URL Playback:**
   - `getOfflineAudioUrl(songId)` generates a local `URL.createObjectURL(record.blob)` and feeds it directly into the singleton `AudioEngine`. The track plays offline with **zero internet connection required**.

---

## 3. Test Cases & Verification Results

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DL-01** | User clicks Download on a 4-minute track | Live progress increments (5% -> 50% -> 100%) | Smooth progress updates received |  PASS |
| **DL-02** | Download completes | Green checkmark badge (`CheckCircle2`) displayed | Badge updated in player dock |  PASS |
| **DL-03** | Network disabled; user plays downloaded song | Plays smoothly via `blob:` object URL | Audio plays without network |  PASS |
| **DL-04** | User clicks Delete from Unduhan view | Blob revoked, IndexedDB record deleted | Removed from cache & DB |  PASS |
| **DL-05** | User cancels ongoing download | `AbortController.abort()` cleanly ends stream | Clean cancellation |  PASS |
