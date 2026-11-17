# PAPABVTIFY — FOLLOW PLAYLIST MODE SPECIFICATION REPORT

## 1. Overview
The **Follow Playlist** mode is the bedrock mode of PAPABVTIFY. When a user creates or imports a playlist and taps "Play All" or clicks any track within that playlist, the application enforces strict sequential playback adhering exclusively to the playlist track sequence.

---

## 2. Core Guarantees of Follow Playlist Mode
1. **Default Mode on Play All**:
   Whenever a user initiates playback from a playlist, the engine defaults to `follow_playlist`.
2. **Deterministic Sequence**:
   Given tracks $[T_1, T_2, T_3, \dots, T_n]$:
   - Next track after $T_k$ is strictly $T_{k+1}$ ($k < n$).
   - Previous track before $T_k$ is strictly $T_{k-1}$ ($k > 1$).
3. **Zero Recommendation Hijacking**:
   The `RecommendationEngine` is completely suppressed during `follow_playlist` playback. External songs are never injected.
4. **Context Badge Visibility**:
   The player UI (both Bottom Player and Expanded Player Modal) explicitly indicates the active playlist title with a distinct badge:
   `📜 Follow Playlist: <Playlist Name>`.
5. **Persistence**:
   The active context ID, track list, and index are stored in persistent local storage. Refreshing the app, switching tabs, or minimizing the window does not cause the context to revert to a random song.

---

## 3. End-of-Playlist Policy
- **When `repeatMode === 'all'`**:
  At track $T_n$, pressing Next or track completion returns cleanly to $T_1$, with a friendly indication ("Ulang Playlist dari Awal").
- **When `repeatMode === 'one'`**:
  The audio element repeats the current track $T_k$ indefinitely from `00:00`.
- **When `repeatMode === 'off'`**:
  Playback stops gracefully upon the completion of $T_n$. The player does not jump to the algorithmic radio or autoplay random songs from the internet.

---

## 4. UI Indicators
- **Playlist View Header**:
  Includes explicit mode pills: `[📜 Follow Playlist (Default)]`, `[✨ Smart Shuffle]`, `[🔀 Normal Shuffle]`.
- **Desktop Player Dock**:
  Left pane displays active playlist badge with truncate protection. Center controls provide quick mode switching pills.
- **Player Modal**:
  Displays source banner at top: `📜 Memutar dari Playlist: <Title>`.
