# Visual Learning Platform API — Update Summary

This document summarizes how the **server** was updated to match the *Backend Documentation — Visual Learning Platform API*.

---

## 1. What Was Added

### Config (`app/config.py`)
- **GROQ_API_KEY** – API key for Groq LLM (empty by default; set in `.env`).
- **MODEL_ID** – Model for script generation (default: `llama-3.1-8b-instant`).

### Health
- **GET /health** now returns `{"status": "ok"}` (was `"healthy"`) to match the doc.

### New Files

| Path | Role |
|------|------|
| `app/models/animation.py` | **AnimationModel** (Beanie): `concept`, `script`, `source`, `createdAt`. Collection: `animations`. |
| `app/schemas/animation.py` | **AnimationRequest** (`concept`), **AnimationResponse** (`script`, `source`, `concept`), plus validation types. |
| `app/services/cache_service.py` | `get_cached_script(concept)`, `save_script(concept, script, source)`, `is_script_complete`, `is_script_valid`. |
| `app/services/ai_generator.py` | Groq: `analyze_concept`, `plan_scenes_hybrid`, `generate_animation_script` (legacy), `get_client`, `clean_json_output`, `validate_json_script`. |
| `app/services/actor_mapper.py` | Conceptual name → `{ type, category, moleculeType? }`; **VALID_ACTOR_TYPES**. |
| `app/services/animation_mapper.py` | Conceptual action → animation name; **VALID_ANIMATIONS**. |
| `app/services/layout_engine.py` | **POSITION_ZONES**, **DEFAULT_SIZES**, **DEFAULT_COLORS**; `place_actor`, `get_actor_properties`. |
| `app/services/script_builder.py` | `calculate_scene_duration`, `build_script`, `validate_script_structure`. |
| `app/services/visual_enricher.py` | `enrich_scene` (photosynthesis, rock cycle, water cycle, physics, general aids). |
| `app/services/hybrid_generator.py` | Pipeline: analyze → plan scenes → map actors/animations → layout → enrich → build script. |
| `app/api/animation.py` | Routes: **GET /api/debug/test-generation**, **POST /api/animation/generate**. |

### Modified Files
- **app/main.py** – Included animation router; health response set to `{"status": "ok"}`.
- **app/models/__init__.py** – Exported **AnimationModel**.
- **app/database.py** – Registered **AnimationModel** with Beanie (same DB, collection `animations`).
- **requirements.txt** – Added **groq** (e.g. `groq>=0.4.0`).

---

## 2. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/health` | Returns `{"status": "ok"}`. |
| **GET** | `/api/debug/test-generation` | Debug Groq client, model, API key. |
| **POST** | `/api/animation/generate` | Generate or retrieve animation script. Query: `mode=hybrid` (default) or `legacy`. Body: `{ "concept": "photosynthesis" }`. |

Response for **POST /api/animation/generate**:
```json
{
  "script": { "title": "...", "duration": 45000, "scenes": [...] },
  "source": "cached" | "generated_hybrid" | "generated_legacy",
  "concept": "photosynthesis"
}
```

---

## 3. Environment

- **PORT** – Server port (default 8000).
- **CORS** – `localhost:3000` and `127.0.0.1:3000` are already allowed in development.
- **GROQ_API_KEY** – Required for generation; without it, hybrid/legacy use fallback scripts.
- **MODEL_ID** – Optional; default `llama-3.1-8b-instant`.
- **MongoDB** – Same connection and DB as existing app (`MONGODB_URL`, `MONGODB_DB_NAME`). Cached scripts are stored in the **animations** collection.

---

## 4. Flow (as in Doc)

1. **POST /api/animation/generate** with `{ "concept": "..." }` and optional `mode=hybrid|legacy`.
2. Cache key = `{concept_lower}_{mode}`. If a valid cached script exists, return it with `source: "cached"`.
3. Else:
   - **hybrid** → `generate_hybrid_script(concept)` (AI analysis + scene planning + rule-based mapping, layout, enrichment).
   - **legacy** → `generate_animation_script(concept)` (single Groq call for full JSON script).
4. Validate with `is_script_valid(script)`.
5. Save to MongoDB with `save_script(cache_key, script, source)`.
6. Return **AnimationResponse** (`script`, `source`, `concept`).

---

## 5. Optional: Separate DB for Animations

The doc mentions a default DB name `visualScience`. This implementation uses the **same** MongoDB database as the rest of the app (`MONGODB_DB_NAME`, e.g. `edusense`) and only adds the **animations** collection. To use a separate database (e.g. `visualScience`), you would add a setting like `MONGODB_VISUAL_DB_NAME` and initialize a second Beanie database or use a separate Motor client for `AnimationModel`; that was not implemented to keep a single connection.

---

## 6. Running and Testing

1. Set **GROQ_API_KEY** in `.env` (optional; fallbacks work without it).
2. Install deps: `pip install -r requirements.txt` (includes `groq`).
3. Start server: `uvicorn app.main:app --reload` (or your usual command).
4. **GET /health** → `{"status":"ok"}`.
5. **GET /api/debug/test-generation** → check Groq status.
6. **POST /api/animation/generate** with body `{"concept":"photosynthesis"}` and optional `?mode=hybrid` or `?mode=legacy`.

Frontend can call **POST /api/animation/generate** with `{ concept }` and optional `mode`, and use the returned **script** for the animation engine.
