# PAPABVTIFY — PREVIOUS & NEXT SONG VERIFICATION REPORT

## 1. Overview & Problem Definition
In earlier builds, pressing `Next` during playlist playback unexpectedly invoked `RecommendationEngine.getNextAutoplaySong()`, causing the player to abandon the active playlist and play unrelated songs. Additionally, clicking `Previous` performed a naive modulo decrement across a hardcoded reference catalog, frequently selecting arbitrary songs or playing random tracks.

This report documents the fix and test verification for the **True Playback History Stack** and **Strict Previous/Next Handling**.

---

## 2. Technical Implementation

### 2.1 Next Song Logic (`PlaybackManager.getNextTrack`)
1. **Queue Priority (Tier 1)**:
   If `manualQueue.length > 0`, pop the first element and play it immediately.
2. **Context Order (Tier 2)**:
   - When in `follow_playlist`:
     `nextIndex = currentIndex + 1`.
     If `nextIndex < tracks.length`, play `tracks[nextIndex]`.
     If `nextIndex >= tracks.length`:
       - If `repeatMode === 'all'`, return `tracks[0]`.
       - If `repeatMode === 'off'`, cleanly finish playback without any recommendation injection.
   - When in `normal_shuffle`:
     Traverses pre-shuffled Fisher-Yates array without repeats.
   - When in `smart_shuffle`:
     Queries `RecommendationEngine` using similarity scoring and anti-repetition filters.

### 2.2 Previous Song Logic (`PlaybackManager.getPreviousTrack`)
The industry standard playback standard was implemented:
1. **Seek Restart Rule (> 3.0 seconds)**:
   If current track has been playing for more than 3.0 seconds (`currentTime > 3.0`), pressing Previous restarts the current track from `00:00`.
2. **True Stack Traversal (<= 3.0 seconds)**:
   If `currentTime <= 3.0`:
   - If `historyIndex > 0`: decrements pointer in `historyStack` and plays the exact historical track previously listened to.
   - If at the beginning of the history stack, it checks `activeContext`:
     - If `currentIdx > 0`, plays `tracks[currentIdx - 1]`.
     - If `currentIdx === 0`, restarts from `00:00`.
   - **Crucial Guarantee**: Never invokes recommendation or plays a random song on Previous!

---

## 3. Test Cases & Verification Results

### Test Case 1: Sequential Next Song in Playlist
- **Input**: Playlist `[Song A, Song B, Song C]`. Currently playing `Song A`.
- **Action**: User clicks `Next`.
- **Expected**: `Song B` plays. Active context title remains visible.
- **Result**: **PASS** (`Song B` loaded, context preserved).

### Test Case 2: Consecutive Next Clicks
- **Input**: Currently playing `Song B`.
- **Action**: User clicks `Next` again.
- **Expected**: `Song C` plays.
- **Result**: **PASS** (`Song C` loaded).

### Test Case 3: End of Playlist with Repeat Off
- **Input**: Currently playing `Song C` (last track), `repeatMode = 'off'`.
- **Action**: User clicks `Next` or song finishes naturally.
- **Expected**: Audio pauses cleanly. Toast displays "🏁 Selesai memutar playlist". No external recommendation is played.
- **Result**: **PASS**.

### Test Case 4: Previous Track (> 3 seconds)
- **Input**: Currently playing `Song B` at `0:15`.
- **Action**: User clicks `Previous`.
- **Expected**: Song B restarts from `00:00`. Does not skip to `Song A`.
- **Result**: **PASS**.

### Test Case 5: Previous Track (<= 3 seconds)
- **Input**: Currently playing `Song B` at `0:01`.
- **Action**: User clicks `Previous`.
- **Expected**: Song A plays (the exact prior track from history).
- **Result**: **PASS**.
