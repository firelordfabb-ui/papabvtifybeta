# PAPABVTIFY — UNDERWATER SOUND EFFECT (MUFFLED / MENDEM DSP) REPORT
**Reference Aesthetic:** *"Somebody's Pleasure — Aziz Hedra (Slowed + Reverb + Underwater)"*  
**Core Directive:** DSP Audio Filter Processing (NOT ambient background audio).

---

## 1. Acoustic Science & Signal Processing Design

In physical acoustics, sound traveling through water experiences rapid dissipation of high frequencies due to viscous fluid damping, while low-mid resonance is accentuated. To faithfully recreate the viral aesthetic popularized in TikTok/YouTube slowed + reverb + underwater remixes, we engineered an active 4-stage DSP subgraph:

1. **Resonant Lowpass Filter (`underwaterLpfNode`):**
   - Configurable cutoff: 150 Hz to 1500 Hz (default 440 – 480 Hz).
   - Q Factor (Resonance): 2.2 to 2.8. Emphasizes the boundary cutoff frequency to create the distinct submerged pressure acoustic.
2. **Parametric Low-Mid Body Boost (`underwaterLowMidNode`):**
   - Peaking filter centered at 280 Hz, Q = 1.2, Gain +4 dB to +8 dB.
   - Prevents the vocal from disappearing into mud, retaining vocal warmth and intimacy.
3. **High-Damp Shelf (`underwaterHighDampNode`):**
   - High-shelf filter at 2200 Hz with -12 dB to -20 dB attenuation.
   - Removes harsh sibilance ('s' and 't' transients) as observed when submerged.
4. **Subtle Current LFO (`underwaterLfoNode` + `underwaterLfoGain`):**
   - 0.22 Hz sine oscillator (~4.5 second period) dynamically modulating the cutoff frequency by $\pm 15$ to $\pm 35$ Hz.
   - Creates a gentle, organic underwater current wave motion.

---

## 2. All 8 Combinable Effect Modes

PAPABVTIFY natively supports all 8 combinations seamlessly via `audioEngine.applyEffectCombination(combo)`:

| Combination Mode | Playback Speed | Pitch Mode | Reverb Amount | Underwater DSP Filter | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Original** | 1.00x | Natural | 0% | Off | Reference fidelity playback |
| **2. Slowed** | 0.85x | Pitched Down | 0% | Off | Classic chopped & screwed vibe |
| **3. Reverb** | 1.00x | Natural | 45% | Off | Cathedral room immersion |
| **4. Slowed + Reverb** | 0.85x | Pitched Down | 48% | Off | Viral aesthetic standard |
| **5. Underwater** | 1.00x | Natural | 40% | **Active (520 Hz)** | Submerged listening at normal tempo |
| **6. Slowed + Underwater** | 0.85x | Pitched Down | 50% | **Active (460 Hz)** | Meditative deep submerge |
| **7. Reverb + Underwater** | 1.00x | Natural | 70% | **Active (480 Hz)** | Ethereal ocean cavern |
| **8. Slowed + Reverb + Underwater** | **0.82x** | **Pitched Down** | **75%** | **Active (440 Hz)** | **Full Aziz Hedra Signature Sound** |

---

## 3. The 6 Underwater Acoustic Presets

1. **Soft Underwater:** Cutoff 680 Hz, Q 1.8, Bass +3 dB, Treble -8 dB, Reverb 35%, Wet 75%.
2. **Deep Underwater:** Cutoff 340 Hz, Q 2.8, Bass +6 dB, Treble -16 dB, Reverb 50%, Wet 95%.
3. **Dreamy Underwater:** Cutoff 500 Hz, Q 2.2, Bass +4 dB, Treble -12 dB, Reverb 70%, Wet 85%.
4. **Dark Underwater:** Cutoff 260 Hz, Q 3.2, Bass +8 dB, Treble -20 dB, Reverb 40%, Wet 100%.
5. **Slowed Underwater:** Speed 0.82x, Cutoff 420 Hz, Q 2.4, Bass +5 dB, Reverb 55%, Wet 90%.
6. **Full Underwater Experience:** Speed 0.82x, Cutoff 440 Hz, Q 2.6, Bass +5 dB, Reverb 75%, Wet 95%.

---

## 4. Real-time A/B Comparison Bypass Switch
Users can toggle the **A/B Compare** button in the Audio Lab or Player at any moment. The engine instantly crossfades between the processed underwater sound (B) and the untouched dry track (A) without re-buffering or restarting playback.
