# Postman – Visual Learning Platform API

Base URL: **http://localhost:8000**

---

## Prerequisites: Install `google-genai` and set Gemini API key

1. **Install the Gemini SDK** (same environment as the server):

```bash
pip install google-genai
# or: pip install -r requirements.txt
```

2. **Set your Gemini API key** in `.env` (get a free key at [aistudio.google.com](https://aistudio.google.com)):

```env
GEMINI_API_KEY=your_key_here
```
Or use the exact name you added: `Gemini_API_Key=your_key_here`

Optional: `GEMINI_MODEL=gemini-2.0-flash` (default; free tier).

After installing and setting the key, restart the server and try the debug endpoint again.

---

## 1. Health check

| Field   | Value                    |
|--------|--------------------------|
| **Method** | `GET`                 |
| **URL**    | `http://localhost:8000/health` |

**Expected response (200):**
```json
{ "status": "ok" }
```

---

## 2. Debug generation (Groq / model check)

| Field   | Value                    |
|--------|--------------------------|
| **Method** | `GET`                 |
| **URL**    | `http://localhost:8000/api/debug/test-generation` |

**Expected response (200):**
- If **GEMINI_API_KEY** or **Gemini_API_Key** is set in `.env`: `"client_initialized": true`, `"provider": "gemini"`, `"model": "gemini-2.0-flash"`, `"status": "ok"`
- If key missing/invalid: `"status": "error"`, `"error": "..."`

---

## 3. Generate animation script (hybrid – default)

| Field   | Value                    |
|--------|--------------------------|
| **Method** | `POST`                |
| **URL**    | `http://localhost:8000/api/animation/generate` |
| **Query**  | (optional) `mode=hybrid` |

**Headers:**
- `Content-Type`: `application/json`

**Body (raw JSON):**
```json
{
  "concept": "photosynthesis"
}
```

**Other concepts to try:** `"rock cycle"`, `"water cycle"`, `"gravity"`

**Expected response (200):**
```json
{
  "script": {
    "title": "...",
    "duration": 45000,
    "scenes": [
      {
        "id": "scene_1",
        "startTime": 0,
        "duration": 6000,
        "text": "...",
        "actors": [ { "type": "...", "x": 400, "y": 300, "animation": "..." } ]
      }
    ]
  },
  "source": "generated_hybrid",
  "concept": "photosynthesis"
}
```

- First request: `source` is `"generated_hybrid"` (or `"generated_legacy"` if you set `mode=legacy`).
- Same concept + mode again: `source` is `"cached"`.

---

## 4. Generate animation script (legacy mode)

| Field   | Value                    |
|--------|--------------------------|
| **Method** | `POST`                |
| **URL**    | `http://localhost:8000/api/animation/generate?mode=legacy` |

**Headers:** `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "concept": "photosynthesis"
}
```

**Expected response (200):** Same shape as above, with `"source": "generated_legacy"` (or `"cached"` on repeat).

---

## Quick checklist in Postman

1. Create a new request → **GET** → `http://localhost:8000/health` → Send → expect `{"status":"ok"}`.
2. **GET** → `http://localhost:8000/api/debug/test-generation` → Send → check Gemini status.
3. **POST** → `http://localhost:8000/api/animation/generate`  
   - Body: raw, JSON: `{"concept":"photosynthesis"}`  
   - Send → expect 200 and `script`, `source`, `concept`.
4. Send the same POST again → expect `"source": "cached"`.

**Note:** Set **GEMINI_API_KEY** or **Gemini_API_Key** in `.env` (free key at [aistudio.google.com](https://aistudio.google.com)). Optional: **GEMINI_MODEL** (default `gemini-2.0-flash`).
