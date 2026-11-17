# PAPABVTIFY — HIGH-FIDELITY WEB AUDIO ENGINE REPORT
**Module:** `src/services/audioEngine.ts`  
**Audio Architecture:** Singleton Web Audio API Context with Realtime DSP Subgraph

---

## 1. Zero Overlap & Singleton Lifecycle Guarantee

In earlier iterations, switching pages or rapidly clicking songs caused multiple audio nodes or elements to play simultaneously.
The new `AudioEngine` is implemented as an enforceable **Singleton**:
- Exactly **one** `HTMLAudioElement` instance.
- Exactly **one** `AudioContext` instance.
- Exactly **one** `MediaElementAudioSourceNode`.
- Switching routes/pages in React does not recreate or tear down the audio pipeline, eliminating clicks, pops, and pauses on page transitions.

---

## 2. Signal Routing Graph

```
Audio Element Source
       │
       ▼
 Preamp Gain Node (-6dB to +6dB)
       │
       ▼
 DSP Filter (Lo-Fi / Sped Up)
       │
       ├───► Underwater DSP Subgraph
       │         │
       │         ├──► [Dry Gain] ──────────┐
       │         │                         ▼
       │         └──► Resonant LPF ──► Peaking 280Hz ──► HighDamp ──► [Wet Gain] ──► Underwater Mix Gain
       │                                                                                   │
       ▼◄──────────────────────────────────────────────────────────────────────────────────┘
10-Band EQ Chain (31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz)
       │
       ▼
Bass Booster (Low-Shelf 70Hz, up to +14dB)
       │
       ▼
Spatial Audio Virtualizer (22ms Haas delay + Stereo Crossfeed)
       │
       ▼
Stereo Panner (8D Audio dynamic LFO sweep)
       │
       ├───► [Dry Gain] ───────────┐
       │                           ▼
       └───► Reverb Convolver ──► [Wet Gain] ──► Reverb Mix Gain
                                                     │
       ┌─────────────────────────────────────────────┘
       ▼
DynamicsCompressorNode (Soft-Clipping Limiter, -0.5dB threshold, 20:1 ratio, 3ms attack)
       │
       ▼
Master Gain Node
       │
       ├───► Realtime AnalyserNode (FFT size 256 for Visualizer)
       │
       ▼
Audio Destination (Hardware Speakers / Headphones)
```

---

## 3. Realtime Parameter Modulation without Glitches
All parameter changes (EQ bands, Preamp gain, Bass boost, Cutoff frequency, Wet/Dry crossfades) use Web Audio API's `setTargetAtTime(value, currentTime, timeConstant)`. This ensures that instant slider changes glide continuously without introducing digital clicks or distortion.

---

## 4. Playback Speed & Pitch Lock
- `playbackSpeed`: 0.5x to 2.0x.
- `preservePitch: true` preserves natural vocal pitch (using Chromium's internal WSOLA time-stretch algorithm).
- `preservePitch: false` allows authentic vinyl slowdown and nightcore pitch-shifting.
