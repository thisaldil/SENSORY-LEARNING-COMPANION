# CORS Fix for FastAPI Backend

## Problem

The frontend (http://localhost:5173) is being blocked by CORS policy when making requests to the FastAPI backend.

## Solution

### Option 1: Fix Backend CORS Configuration (RECOMMENDED)

Edit `server/app/config.py` and update line 51:

**Current:**

```python
CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081,exp://localhost:8081,http://localhost:5173/"
```

**Change to:**

```python
CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081,exp://localhost:8081,http://localhost:5173,http://127.0.0.1:5173"
```

**Changes:**

1. Remove trailing slash from `http://localhost:5173/` → `http://localhost:5173`
2. Add `http://127.0.0.1:5173` as well (some browsers treat localhost and 127.0.0.1 as different origins)

### Option 2: Use Environment Variable

You can also set it via environment variable in your `.env` file in the server directory:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081,http://localhost:5173,http://127.0.0.1:5173
```

### After Making Changes

1. Restart your FastAPI server (uvicorn)
2. Clear browser cache if needed
3. Try the request again

The CORS middleware is already configured in `server/app/main.py`, so you just need to update the allowed origins list.
