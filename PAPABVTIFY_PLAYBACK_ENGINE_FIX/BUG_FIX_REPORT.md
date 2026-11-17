# PAPABVTIFY — BUG FIX & REGRESSION AUDIT REPORT

## 1. Executive Summary
This report catalogs the comprehensive audit and bug remediation performed on PAPABVTIFY, specifically targeting the core issues identified by the user:
1. Playlist "Play All" dropping out of the playlist after song 1.
2. "Next Song" playing unrelated random songs instead of following playlist tracks.
3. "Previous" button playing random tracks.
4. Repetitive recommendation loops ("Die With A Smile" / "Sal Priadi").
5. Loss of playlist context on navigation or backgrounding.
6. Absence of explicit playback mode controls.

---

## 2. Root Cause Analysis & Resolutions

### Bug 1: Playlist Next Song Jumping to Random External Songs
- **Root Cause**: `PustakaView` previously called `onSelectSong(tracks[0])` without binding an active playlist context on `App.tsx`. In `App.tsx`, `handleNext()` called `RecommendationEngine.getNextAutoplaySong()` directly on every track completion or click.
- **Resolution**: Implemented `PlaybackManager` singleton. `PustakaView` now triggers `onPlayPlaylist(playlist, startIndex, mode)`. `handleNext` evaluates `Playback.getNextTrack()` which strictly respects `follow_playlist` before any recommendation logic can run.

### Bug 2: Previous Track Playing Random Songs
- **Root Cause**: `handlePrev()` decremented an index on `REFERENCE_PLAYLIST`. When playing imported playlists or search results, `songs.findIndex()` returned `-1`, yielding arbitrary modulo arithmetic results.
- **Resolution**: Integrated true `historyStack` in `PlaybackManager`. Pressing Previous at `> 3.0s` restarts current song at `00:00`. Pressing Previous at `<= 3.0s` pops the exact previous historical song from the history stack. If at the head of a playlist, it restarts `tracks[0]` without random jumps.

### Bug 3: Repetitive Recommendation Loops
- **Root Cause**: Fixed static seed IDs were passed repeatedly without dynamic penalties for recently played songs.
- **Resolution**: Implemented anti-repetition penalty model in `RecommendationEngine`. Tracks played in the last 5 songs receive $-60$ pts; tracks played in the last 15 songs receive $-30$ pts. Transparent recommendation reasons are surfaced in the UI.

### Bug 4: Playlist Context Loss
- **Root Cause**: React component unmounting during tab changes discarded in-memory state.
- **Resolution**: `PlaybackContext` is stored in `StorageService` and managed outside the component lifecycle in `PlaybackManager`.

### Bug 5: Missing Playback Mode Controls
- **Resolution**: Added interactive selector pills (`Follow Playlist`, `Normal Shuffle`, `Smart Shuffle`) to:
  1. `PustakaView` Playlist Detail header.
  2. `BottomPlayer` Desktop dock.
  3. `PlayerModal` full-screen view.

---

## 3. Regression Audit
All previously existing features were audited to ensure zero regressions:
- [x] **Authentication & Persistence**: User sessions remain securely cached across restarts.
- [x] **Live Radio**: World radio stations stream smoothly.
- [x] **Realtime Synced Lyrics**: Synchronized lrc fetching and offset adjustment work flawlessly.
- [x] **Offline Audio Downloads**: IndexedDB local storage and playback from offline blobs are fully intact.
- [x] **Audio Lab & 10-Band EQ**: Custom gain and pitch controls operational.
- [x] **Underwater Sound Effect (Mendem)**: Muffled biquad lowpass filter (480 Hz) toggleable and combinable with Slowed + Reverb.
- [x] **Dark / Light Theme**: High-contrast theme styling remains sharp and clean.
