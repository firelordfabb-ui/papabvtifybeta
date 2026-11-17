# PAPABVTIFY — SMART NEXT SONG & RECOMMENDATION ALGORITHM REPORT
**Module:** `src/services/recommendationEngine.ts`  
**Core Purpose:** Eliminate random, repetitive, or irrelevant autoplay recommendations.

---

## 1. Problem Definition: The "Die With A Smile / Sal Priadi" Loop
Previously, when a song finished, the autoplay fallback picked songs using uncalibrated queries (e.g. searching only `"lagu populer"`), resulting in repetitive loops of the same 2-3 tracks (Sal Priadi, Bruno Mars) or mismatched metadata.

---

## 2. Multi-Dimensional Similarity Scoring Engine

Every candidate song evaluated for autoplay is scored according to:

$$\text{Total Score} = S_{\text{artist}} + S_{\text{genre}} + S_{\text{mood}} + S_{\text{energy}} + S_{\text{tempo}} + S_{\text{affinity}} - P_{\text{repetition}} + M_{\text{mode}}$$

### Factor Weights:
1. **Genre / Subgenre Coherence ($S_{\text{genre}}$):**
   - Exact match: **+20 points**
   - Partial / Subgenre match: **+14 points**
2. **Mood / Emotional Vibe ($S_{\text{mood}}$):**
   - Coherent valence match: **+15 points**
3. **Energy Level ($S_{\text{energy}}$):**
   - $12 \times (1.0 - |\text{energy}_{\text{cand}} - \text{energy}_{\text{curr}}|)$: up to **+12 points**
4. **Tempo / BPM ($S_{\text{tempo}}$):**
   - $10 \times (1.0 - \min(|\Delta \text{BPM}| / 40, 1.0))$: up to **+10 points**
5. **User Affinity ($S_{\text{affinity}}$):**
   - Song in user Favorites / Liked: **+14 points**
   - Artist in user's Top 10 Listen History: **+10 points**
6. **Anti-Repetition Penalties ($P_{\text{repetition}}$):**
   - Song in immediate last 15 tracks played: **-9999 points (Hard Reject)**
   - Artist played $\ge 2$ times in last 4 tracks: **-45 points (Anti-Loop Filter)**

---

## 3. The 3 User-Selectable Autoplay Modes

Users can select their preferred recommendation mode directly from the Queue modal:

### A. Familiar Mode (`familiar`)
- Boosts songs by the user's top listened artists and liked library (**+25 points**).
- Ideal for passive background listening where the listener wants known favorites.

### B. Similar Vibes (`similar_vibes`) [Default]
- Strict adherence to musical genre, tempo continuity, and acoustic properties.
- Indonesian indie pop transitions to contemporary indie ballads; R&B transitions to neo-soul.

### C. Discovery Mode (`discovery`)
- Actively boosts fresh artists not found in the user's recent history (**+22 points**).
- Features an **Exploration Level Slider (0% – 100%)** that introduces controlled stochastic variance into the ranking queue.

---

## 4. Soft Temperature Selection
Instead of strictly picking item #1 (which leads to deterministic loops), the engine pools the top 3 scored candidates and selects among them with a soft probability distribution, guaranteeing diversity while preserving vibe integrity.
All auto-selected tracks are tagged with `isRecommended: true` and display a `✨ Rekomendasi` badge in the UI.
