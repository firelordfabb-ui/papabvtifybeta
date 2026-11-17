# PAPABVTIFY — SMART SHUFFLE SPECIFICATION REPORT

## 1. Concept & Difference from Naive Shuffle
Standard random shuffles in music applications often fail user expectations by introducing jarring tonal transitions, such as jumping abruptly from an acoustic ballad to aggressive electronic dance music, or repeatedly cycling the same 3-4 songs.

**Smart Shuffle** in PAPABVTIFY is an intelligent contextual recommendation mode. It draws tracks from the user's library and related catalog based on musical continuity while introducing controlled novelty according to an exploration curve.

---

## 2. Multi-Dimensional Affinity Model
The engine computes candidate scores using the following mathematical model:

$$\text{FinalScore} = S_{\text{genre}} + S_{\text{mood}} + S_{\text{tempo}} + S_{\text{energy}} + S_{\text{user}} - P_{\text{recency}} - P_{\text{skip}}$$

### Component Breakdown
1. **Genre Affinity ($S_{\text{genre}}$, max 30 pts)**:
   Matching primary or secondary genres yields up to 30 points.
2. **Mood Cohesion ($S_{\text{mood}}$, max 25 pts)**:
   Cosine distance between normalized emotional vectors (valence vs. arousal).
3. **Tempo & Energy Match ($S_{\text{tempo}} + S_{\text{energy}}$, max 25 pts)**:
   Penalizes drastic BPM shifts ($\Delta\text{BPM} > 30$) to maintain rhythm continuity.
4. **User Preference ($S_{\text{user}}$, max 20 pts)**:
   - Liked track bonus: $+15$ pts.
   - Favorited artist bonus: $+10$ pts.
5. **Anti-Repetition Penalties**:
   - Played in last 5 tracks: $-60$ pts (effectively disqualifies candidate).
   - Played in last 15 tracks: $-30$ pts.
   - High skip rate (> 60% skipped within 15s): $-40$ pts.

---

## 3. Exploration Parameter
Users can configure the exploration degree:
- **Similar Vibes (Default)**: 70% cohesion, 30% novelty.
- **Eclectic**: 50% cohesion, 50% novelty.
- **Deep Discovery**: 30% cohesion, 70% novelty.

---

## 4. Transparent Recommendation Reasons
Every song queued via Smart Shuffle is assigned an explicit, human-readable reason tag displayed directly in the player:
- Example: `"Vibe & tempo mirip dengan Gala Bunga Matahari"`
- Example: `"Genre pop akustik favoritmu"`
- Example: `"Lagu dari artis favorit yang sering kamu putar"`
