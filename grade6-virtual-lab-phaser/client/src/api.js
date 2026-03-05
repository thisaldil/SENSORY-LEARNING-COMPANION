const EXPLICIT_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:${
    import.meta.env.VITE_API_PORT || 4000
  }`;

const FALLBACK_PORTS = [4000, 4001, 4002, 4003, 4004, 4005, 5000];

/**
 * Tries EXPLICIT_BASE first, then walks through FALLBACK_PORTS until
 * a 2xx response is found. Returns the first successful Response object.
 */
async function smartFetch(path, options = {}) {
  const timeoutMs = 2500;
  const hostname  = `${window.location.protocol}//${window.location.hostname}`;

  // 1. Try configured base URL first
  try {
    const res = await fetch(EXPLICIT_BASE + path, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok || res.status === 404) return res;   // 404 is a valid "found server" reply
  } catch {
    // fall through to port scan
  }

  // 2. Port scan fallback
  for (const port of FALLBACK_PORTS) {
    const url = `${hostname}:${port}${path}`;
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok || res.status === 404) return res;
    } catch {
      // try next
    }
  }

  // 3. All failed
  return new Response(
    JSON.stringify({ error: "Server unavailable. Start backend with: npm run dev" }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

function handleError(res, fallbackMsg) {
  if (res.status === 503) throw new Error("Server unavailable — is the backend running?");
  throw new Error(fallbackMsg);
}

export async function fetchLabs() {
  const r = await smartFetch("/api/labs?grade=6");
  if (!r.ok) handleError(r, "Failed to load labs");
  return r.json();
}

export async function fetchLab(id) {
  if (!id) throw new Error("Lab ID is required");
  const r = await smartFetch(`/api/labs/${id}`);
  if (!r.ok) handleError(r, "Failed to load lab");
  return r.json();
}

export async function fetchResult(studentId, labId) {
  if (!studentId || !labId) throw new Error("studentId and labId required");
  const r = await smartFetch(
    `/api/results?studentId=${encodeURIComponent(studentId)}&labId=${encodeURIComponent(labId)}`
  );
  if (r.status === 404) return null;
  if (!r.ok) handleError(r, "Failed to load result");
  return r.json();
}

export async function upsertResult({ studentId, labId, data, score, isComplete }) {
  const r = await smartFetch("/api/results/upsert", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ studentId, labId, data, score, isComplete }),
  });
  if (!r.ok) handleError(r, "Failed to save result");
  return r.json();
}