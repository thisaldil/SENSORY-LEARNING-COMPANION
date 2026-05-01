# Member 3: Sensory Overlay Component

**Role:** Add **audio** (narration) and **haptics** to a visual AnimationScript produced by Member 2. All timing is in **milliseconds** from animation start. Cognitive state (OVERLOAD / OPTIMAL / LOW_LOAD) drives narration pacing and haptic intensity.

---

## How It Works (Summary)

1. **Input:** A visual script (JSON) with `scenes[]`, each having `id`, `startTime`, `duration`, `text`, `actors`, and optional `meta.cognitiveState`.
2. **Audio:** For each scene, narration is generated (LLM or fallback from scene text). Ambient mode and speech rate are chosen from cognitive state (e.g. OVERLOAD → silence + slow speech).
3. **Haptics:** A flat timeline of haptic events is built from scene boundaries: scene onset, optional mid-scene, optional near-end, with pattern and intensity based on cognitive state.
4. **Output (two shapes):**
   - **Overlay:** Flat lists `haptics[]` and `narration[]` plus `ambient_mode`, `speech_rate`, `research_metrics`. Optionally persisted to `sensory_sessions` (unless `skip_log: true`).
   - **Enriched script:** Same script with a top-level `sensory` object and each scene gaining `audio` and `haptics`; no DB write.

---

## File Structure

```
server/
├── app/
│   ├── api/
│   │   ├── sensory.py              # Member 3 HTTP API (overlay + enrich-script)
│   │   └── tts.py                 # TTS synthesize (used by frontend for narration)
│   ├── schemas/
│   │   └── sensory_schemas.py     # Request/response models (SensoryOverlay, EnrichScriptRequest, etc.)
│   ├── models/
│   │   └── sensory_models.py      # SensorySession (MongoDB document for research logging)
│   └── services/
│       ├── sensory/
│       │   ├── multimodal_sync.py  # Orchestrator: overlay + enrich, merges audio/haptics into script
│       │   ├── audio_engine.py    # Narration timeline + ambient_mode + speech_rate from script + state
│       │   └── haptic_generator.py # Flat haptic timeline from script scenes + cognitive state
│       └── tts/
│           └── google_tts.py      # Google Cloud TTS (speech_rate from overlay)
```

**Member 3–specific files:**

| Path | Purpose |
|------|--------|
| `app/api/sensory.py` | POST `/api/sensory/overlay`, POST `/api/sensory/enrich-script` |
| `app/schemas/sensory_schemas.py` | `SensoryOverlayRequest`, `SensoryOverlay`, `EnrichScriptRequest`, `HapticCue`, `AudioOverlay` |
| `app/models/sensory_models.py` | `SensorySession` (collection: `sensory_sessions`) |
| `app/services/sensory/multimodal_sync.py` | `generate_and_log_sensory_overlay()`, `enrich_script_with_sensory_overlay()` |
| `app/services/sensory/audio_engine.py` | `generate_audio_overlay()` — narration + ambient + speech_rate |
| `app/services/sensory/haptic_generator.py` | `build_haptic_timeline()` — flat list of haptic cues |
| `app/api/tts.py` | POST `/api/tts/synthesize` — turn overlay narration text into MP3 (frontend calls this) |
| `app/services/tts/google_tts.py` | `synthesize(text, speech_rate)` — used by TTS API |

---

## Flow

### Flow 1: Overlay (flat lists, optional DB)

```
Client
  │
  │  POST /api/sensory/overlay
  │  Body: { script, cognitive_state, [concept, lesson_id, student_id, session_id], [skip_log] }
  ▼
app/api/sensory.py  create_sensory_overlay()
  │
  │  generate_and_log_sensory_overlay(script, cognitive_state, ..., skip_log)
  ▼
app/services/sensory/multimodal_sync.py
  │
  ├─► build_haptic_timeline(script, state)   ──► app/services/sensory/haptic_generator.py
  │       └─ Returns: [{ at, pattern, scene_id, channel, intensity }, ...]
  │
  ├─► generate_audio_overlay(script, state)  ──► app/services/sensory/audio_engine.py
  │       └─ Uses: app/services/visual/ai_generator._generate_text() for LLM narration
  │       └─ Returns: { ambient_mode, speech_rate, narration: [{ at, duration, text }] }
  │
  ├─► _compute_research_metrics(script, haptics, audio)
  │
  └─► if not skip_log: SensorySession.insert()   ──► app/models/sensory_models.py
  │
  ▼
Response: SensoryOverlay (cognitive_state, ambient_mode, speech_rate, haptics, narration, research_metrics)
```

### Flow 2: Enrich script (per-scene audio + haptics, no DB)

```
Client
  │
  │  POST /api/sensory/enrich-script
  │  Body: { script, [cognitive_state] }   // cognitive_state from script meta if omitted
  ▼
app/api/sensory.py  enrich_script()
  │
  │  _resolve_cognitive_state(script, request.cognitive_state)
  │  enrich_script_with_sensory_overlay(script, cognitive_state)
  ▼
app/services/sensory/multimodal_sync.py
  │
  ├─► build_haptic_timeline(script, state)   ──► haptic_generator
  ├─► generate_audio_overlay(script, state) ──► audio_engine
  │
  └─► Deep copy script; for each scene:
        - Filter haptics by scene_id / time range → scene.haptics[]
        - Filter narration by time range → scene.audio.narration[]
        - Add script.sensory = { cognitive_state, ambient_mode, speech_rate }
  │
  ▼
Response: Same script with sensory + scene.audio + scene.haptics (no DB write)
```

### Flow 3: Frontend plays narration (TTS)

```
Frontend (enriched script or overlay)
  │
  │  For each narration item (at, duration, text):
  │  POST /api/tts/synthesize  Body: { text, speech_rate }   // speech_rate from script.sensory or overlay
  ▼
app/api/tts.py  tts_synthesize()
  │
  ▼
app/services/tts/google_tts.py  synthesize(text, speech_rate)
  │
  ▼
Response: audio/mpeg (MP3 bytes)
```

---

## Cognitive State → Sensory Mapping

| State    | Ambient    | Speech rate | Haptic pattern | Haptic intensity | Cues per scene      |
|----------|------------|-------------|----------------|-------------------|---------------------|
| OVERLOAD | silence    | slow        | tap_soft       | 0.35              | 1 (onset only)       |
| OPTIMAL  | 40hz_gamma | normal      | tap_medium     | 0.6               | 2 (onset + mid)     |
| LOW_LOAD | spatial_music | fast     | buzz_pulse     | 0.85              | 3 (onset, mid, end−1s) |

---

## Data Shapes (reference)

**Overlay response (POST /api/sensory/overlay):**

- `cognitive_state`, `ambient_mode`, `speech_rate`
- `haptics`: `[{ at, pattern, scene_id?, channel?, intensity? }]`
- `narration`: `[{ at, duration, text }]`
- `research_metrics`: counts and ratios

**Enriched script (POST /api/sensory/enrich-script):**

- Original script fields (`title`, `duration`, `scenes`, …)
- `sensory`: `{ cognitive_state, ambient_mode, speech_rate }`
- Each `scene`: added `audio: { narration: [...], effects: [] }`, `haptics: [{ id, pattern, intensity, channel, timeline }]`

---

## Dependencies

- **audio_engine** uses `app.services.visual.ai_generator._generate_text` and `clean_json_output` (Gemini) for narration; fallback uses scene text only.
- **TTS** requires Google Cloud credentials (`GOOGLE_APPLICATION_CREDENTIALS`); used by frontend for playback, not by overlay/enrich themselves.
