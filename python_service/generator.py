import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("MODEL_ID", "llama-3.3-70b-versatile")

SYLLABUS_MAP = {
    "solar system": "space",
    "sun": "space",
    "earth": "space",
    "moon": "space",
    "day and night": "space",
    "plant": "plants",
    "photosynthesis": "plants",
    "leaf": "plants",
    "root": "plants",
    "human": "humans",
    "animal": "humans",
    "body": "humans",
    "breathing": "humans",
    "matter": "matter",
    "solid": "matter",
    "liquid": "matter",
    "gas": "matter",
    "light": "energy",
    "heat": "energy",
    "sound": "energy",
    "gravity": "energy",
    "water cycle": "environment",
    "rain": "environment",
    "cloud": "environment",
    "magnet": "physics",
    "force": "physics",
    "motion": "physics",
}

PROMPTS = {
    "space": "sun and planets moving slowly",
    "plants": "plant receiving sunlight",
    "humans": "simple human body parts",
    "matter": "solid liquid gas comparison",
    "energy": "light or heat rays",
    "environment": "water cycle process",
    "physics": "objects showing motion or force",
    "fallback": "simple rotating object",
}


def extract_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r"\[.*\]", text, re.S)
        if match:
            return json.loads(match.group())
        return []


def json_to_three(objects):
    code = []

    for o in objects:
        geo = o.get("geometry", "box")
        size = o.get("size", [1, 1, 1])
        pos = o.get("position", [0, 0, 0])
        color = o.get("color", "#ffaa00")
        anim = o.get("animation", {"rotate": 0.01})

        if geo == "sphere":
            geometry = f"new THREE.SphereGeometry({size[0]}, 32, 32)"
        else:
            geometry = f"new THREE.BoxGeometry({size[0]}, {size[1]}, {size[2]})"

        code.append(
            f"""
const mesh = new THREE.Mesh(
  {geometry},
  new THREE.MeshStandardMaterial({{ color: '{color}' }})
);
mesh.position.set({pos[0]}, {pos[1]}, {pos[2]});
mesh.userData = {json.dumps(anim)};
scene.add(mesh);
animatedObjects.push(mesh);
"""
        )

    return "\n".join(code)


def generate_js_for_concept(user_text):
    text = user_text.lower()
    category = "fallback"

    for key in SYLLABUS_MAP:
        if key in text:
            category = SYLLABUS_MAP[key]
            break

    prompt = f"""
Return ONLY a JSON array.

Each object:
{{
  "geometry": "sphere or box",
  "size": [x, y, z],
  "position": [x, y, z],
  "color": "#hex",
  "animation": {{ "rotate": 0.01 }}
}}

Create: {PROMPTS[category]}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=600,
    )

    objects = extract_json(response.choices[0].message.content)
    generated = json_to_three(objects)

    return f"""
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/examples/jsm/controls/OrbitControls.js';

export function dynamicAnimation(containerId) {{
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const renderer = new THREE.WebGLRenderer({{ antialias: true }});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const controls = new OrbitControls(camera, renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  const animatedObjects = [];

  {generated}

  function animate() {{
    requestAnimationFrame(animate);
    animatedObjects.forEach(o => {{
      if (o.userData.rotate) o.rotation.y += o.userData.rotate;
    }});
    renderer.render(scene, camera);
  }}

  animate();
}}
"""
