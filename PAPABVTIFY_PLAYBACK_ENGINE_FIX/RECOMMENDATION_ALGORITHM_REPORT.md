# PAPABVTIFY — SMART RECOMMENDATION ALGORITHM SPECIFICATION

## 1. Overview
The previous implementation of next-song recommendation relied on static template lists, which caused users to repeatedly encounter the same few tracks (such as "Die With A Smile" or "Sal Priadi") regardless of current listening context or user preference.

The revised **PAPABVTIFY Recommendation Engine** (`src/services/recommendationEngine.ts`) implements a dynamic, multi-factor recommendation pipeline that pairs acoustic vector modeling with anti-repetition guards and user feedback weighting.

---

## 2. Multi-Factor Scoring Architecture

```
+-------------------------------------------------------------+
|                     Candidate Tracks Pool                   |
+-------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------+
|                     Heuristic Scoring                       |
|  - Genre Affinity (+30 pts)                                 |
|  - Mood Cosine Similarity (+25 pts)                         |
|  - Tempo & Energy Envelope (+25 pts)                        |
|  - User Likes / Favorite Artists (+25 pts)                  |
+-------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------+
|                     Anti-Repetition Penalties               |
|  - Played in last 5 tracks (-60 pts penalty)                |
|  - Played in last 15 tracks (-30 pts penalty)               |
|  - High skip history (-40 pts penalty)                      |
+-------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------+
|                     Top Scored Candidate                    |
|             (With Transparent Reason Assigned)              |
+-------------------------------------------------------------+
```

---

## 3. Heuristic Factor Specifications

### 3.1 Genre & Mood Matching
- **Genre Distance**: Candidates sharing exact subgenres receive $+30$. Candidates in complementary genres (e.g. Indie Pop and Bedroom Pop) receive $+15$.
- **Mood Vectorization**: Songs are indexed along Valence $[0, 1]$ and Energy $[0, 1]$. Cosine proximity delivers smooth emotional transitions.

### 3.2 Anti-Looping & Recency Filtering
- Any track present in the last 5 items of `historyStack` or `StorageService.getRecentlyPlayed()` receives an immediate $-60$ penalty, making consecutive loops impossible.
- Tracks played between 6 and 15 songs ago receive a $-30$ penalty.

### 3.3 Dynamic Reason Generation
Rather than black-box recommendations, the engine generates transparent attribution stored on `Song.recommendationReason`:
- "Kemiripan genre pop akustik dengan {song.title}"
- "Vibe chill & santai mirip dengan trek sebelumnya"
- "Artis favorit yang sering kamu dengar"

This reason is rendered cleanly in the expanded `PlayerModal`.
