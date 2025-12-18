import os
import hashlib
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("MODEL_ID", "llama-3.1-8b-instant")

# =======================
# SIMPLE CACHE (IN-MEMORY)
# =======================
CACHE = {}

# =======================
# SAFE JS TEMPLATE (30s LOOP)
# =======================
JS_TEMPLATE = """

export function dynamicAnimation(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 15, 35);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const clock = new THREE.Clock();

  // ===== GENERATED OBJECTS START =====
  {generated}
  // ===== GENERATED OBJECTS END =====

  function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime() % 30;

    scene.traverse(obj => {
      if (obj.isMesh) {
        obj.rotation.y += 0.002;
        obj.position.y += Math.sin(t + obj.position.x) * 0.002;
      }
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
"""


# =======================
# CLEAN OUTPUT
# =======================
def clean_output(text: str) -> str:
    if not text:
        return ""
    for bad in ["```", "JavaScript", "Here is"]:
        text = text.replace(bad, "")
    return text.strip()


# =======================
# BASIC JS SYNTAX CHECK
# =======================
def is_valid_js(code: str) -> bool:
    return "new THREE." in code and ";" in code and code.count("(") >= code.count(")")


# =======================
# GRADE 6 PROMPT
# =======================
def build_prompt(concept):
    return f"""
Create simple Three.js scenery objects for a Grade 6 science lesson.

Concept: "{concept}"

Rules:
- ONLY object creation code
- Use Sphere, Box, Cylinder, Plane
- Bright colors
- Visual metaphor suitable for age 11–12
- No imports, no comments, no explanation
"""


# =======================
# MAIN GENERATOR (AUTO RETRY + CACHE)
# =======================
def generate_js_for_concept(concept, retries=3):
    key = hashlib.md5(concept.encode()).hexdigest()

    if key in CACHE:
        return CACHE[key]

    for _ in range(retries):
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": build_prompt(concept)}],
            temperature=0.3,
            max_tokens=600,
        )

        raw = completion.choices[0].message.content
        cleaned = clean_output(raw)

        if not is_valid_js(cleaned):
            continue

        final_script = JS_TEMPLATE.replace("{generated}", cleaned)
        CACHE[key] = final_script
        return final_script

    return None
