import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function fetchAnimation(concept) {
  const response = await axios.post(`${API_BASE}/animation/get-animation`, { concept });
  return response.data; // { scene, sceneId, ... }
}