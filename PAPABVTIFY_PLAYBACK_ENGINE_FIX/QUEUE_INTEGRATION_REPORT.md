# PAPABVTIFY — MANUAL QUEUE & PLAYBACK INTEGRATION REPORT

## 1. Overview
The **Manual Queue** in PAPABVTIFY represents explicit user intent. When a user chooses "Putar Berikutnya" (Play Next) or "Tambahkan ke Antrean" (Add to Queue), those tracks must take absolute precedence over any playlist progression or smart shuffle suggestions.

---

## 2. Priority Hierarchy

```mermaid
graph TD
    Trigger[Next Song Triggered] --> CheckQueue{Manual Queue Empty?}
    CheckQueue -- No --> PlayQueueItem[Pop & Play from Manual Queue]
    PlayQueueItem --> KeepContext[Context & Index Preserved in Background]
    CheckQueue -- Yes --> CheckMode{Active Playback Mode}
    CheckMode -- Follow Playlist --> NextPlaylistItem[Play tracks[currentIndex + 1]]
    CheckMode -- Normal Shuffle --> NextShuffledItem[Play shuffledTracks[currentIndex + 1]]
    CheckMode -- Smart Shuffle --> NextSmartItem[Play Scored Candidate]
```

### Key Principles:
1. **Tier-1 Execution**:
   `PlaybackManager.getNextTrack()` inspects `this.manualQueue`. If items exist, `this.manualQueue.shift()` provides the next track.
2. **Context Suspension without Loss**:
   While manual queue tracks are playing, the active playlist context (`activePlaybackContext`) remains intact. Once the manual queue is exhausted, playback seamlessly resumes from the exact playlist position where it was paused.
3. **Queue Mutability**:
   Users can:
   - Reorder items via drag-and-drop or index shifting (`reorderQueue`).
   - Remove individual items (`removeFromQueue`).
   - Clear the entire queue (`clearQueue`).
   - All mutations sync immediately to persistent storage.

---

## 3. Verification Test Matrix
| Scenario | Action | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Add to Queue** | User adds Track X while playing Playlist Track 2 | Track X plays after Track 2 finishes | **PASS** |
| **Queue Draining** | Track X finishes | Playlist resumes with Track 3 | **PASS** |
| **Play Next** | User clicks Play Next on Track Y | Track Y inserts at head of queue | **PASS** |
| **Clear Queue** | User clicks Kosongkan Antrean | Queue empties, toast feedback appears | **PASS** |
| **Reorder Queue** | Drag position 2 to position 0 | Order updates instantly in state | **PASS** |
