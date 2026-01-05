import api from "../api";

function coerceScript(scriptLike) {
  if (!scriptLike) return "";
  if (typeof scriptLike === "string") return scriptLike;
  if (Array.isArray(scriptLike)) return scriptLike.join(" ");
  return String(scriptLike);
}

function normalizeResult(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected API response.");
  }

  // Common shapes
  const directNodes = payload.nodes;
  const directLinks = payload.links;
  const directScript = payload.script;

  const sceneGraph = payload.scene_graph || payload.sceneGraph || payload.graph;
  const nestedNodes = sceneGraph?.nodes;
  const nestedLinks = sceneGraph?.links || sceneGraph?.edges;

  const narration =
    payload.narration_script || payload.narrationScript || payload.narration;

  const nodes = directNodes || nestedNodes;
  const links = directLinks || nestedLinks;
  const script = coerceScript(directScript || narration);

  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    throw new Error(
      "API response missing scene graph data (nodes/links). Please check the backend response format."
    );
  }

  return { nodes, links, script };
}

function extractAxiosErrorMessage(error) {
  const maybeMessage =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return typeof maybeMessage === "string" && maybeMessage
    ? maybeMessage
    : "Request failed.";
}

export async function processText(text) {
  try {
    const res = await api.post("/api/ocr-nlp/process-text", { text });
    return normalizeResult(res.data);
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error));
  }
}

export async function processImage(file) {
  try {
    const form = new FormData();
    // Most backends accept one of these keys; extras are usually ignored.
    form.append("file", file);
    form.append("image", file);

    const res = await api.post("/process-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeResult(res.data);
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error));
  }
}

export async function processVoice(file) {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("audio", file);

    const res = await api.post("/process-voice", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeResult(res.data);
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error));
  }
}
