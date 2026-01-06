import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

/**
 * Get animation script for a concept
 * @param {string} concept - The educational concept to animate
 * @param {string} mode - Generation mode: "hybrid" (default) or "legacy"
 * @returns {Promise<Object>} Animation script response
 */
export async function getAnimation(concept, mode = "hybrid") {
  const res = await axios.post(
    `${API_BASE_URL}/api/animation/generate?mode=${mode}`,
    {
      concept,
    }
  );
  return res.data;
}
