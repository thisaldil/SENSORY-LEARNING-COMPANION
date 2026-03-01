import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { makeArrow, makeLabelSprite } from "./primitives";

function hexOrRgbaToColor(val) {
  // THREE.Color supports hex strings but not rgba().
  // If rgba is used, we’ll approximate: use white and set opacity in material where applicable.
  return val;
}

export function createScenePlayer(container, sceneJson) {
  container.innerHTML = "";

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sceneJson.background || "#cfefff");

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );

  const camPos = sceneJson.camera?.pos || [0, 8, 24];
  const lookAt = sceneJson.camera?.lookAt || [0, 2, 0];
  camera.position.set(...camPos);
  camera.lookAt(...lookAt);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, sceneJson.lights?.ambient ?? 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, sceneJson.lights?.dir?.intensity ?? 0.8);
  const dirPos = sceneJson.lights?.dir?.pos || [10, 18, 10];
  dir.position.set(...dirPos);
  scene.add(dir);

  // store by id
  const objectsById = {};

  // helpers
  const disposers = [];
  const animated = [];

  function addObject(objSpec) {
    const t = objSpec.type;

    if (t === "sphere") {
      const geo = new THREE.SphereGeometry(objSpec.radius ?? 1.5, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(objSpec.color || "#ffaa00"),
        emissive: objSpec.emissive ? new THREE.Color(objSpec.emissive) : new THREE.Color("#000000"),
        emissiveIntensity: objSpec.emissive ? 0.7 : 0.0,
        roughness: 0.55,
        metalness: 0.05
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...(objSpec.pos || [0, 0, 0]));
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id] = mesh;
      return;
    }

    if (t === "box") {
      const s = objSpec.size || [2, 2, 2];
      const geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(objSpec.color || "#ffaa00"),
        roughness: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...(objSpec.pos || [0, 0, 0]));
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id] = mesh;
      return;
    }

    if (t === "label") {
      const sprite = makeLabelSprite(objSpec.text || "", objSpec.size ?? 0.8);
      sprite.position.set(...(objSpec.pos || [0, 0, 0]));
      scene.add(sprite);

      disposers.push(() => sprite.userData._dispose?.());
      // labels don’t need id usually, but allow:
      if (objSpec.id) objectsById[objSpec.id] = sprite;
      return;
    }

    if (t === "arrow") {
      const arrow = makeArrow(objSpec.from, objSpec.to, objSpec.color);
      scene.add(arrow);
      objectsById[objSpec.id] = arrow;
      disposers.push(() => arrow.userData._dispose?.());
      animated.push({ id: objSpec.id, kind: "arrow" });
      return;
    }

    if (t === "ground") {
      const geo = new THREE.PlaneGeometry(200, 200);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(objSpec.color || "#7ccf7a"),
        roughness: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = objSpec.y ?? 0;
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id || "ground"] = mesh;
      return;
    }

    if (t === "water") {
      const size = objSpec.size || [8, 0.6, 6];
      const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(objSpec.color || "#38bdf8"),
        transparent: true,
        opacity: 0.85,
        roughness: 0.25
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...(objSpec.pos || [0, 0.3, 0]));
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id] = mesh;
      return;
    }

    if (t === "cloud") {
      // simple cloud = 3 spheres grouped
      const group = new THREE.Group();
      const parts = [
        { r: 1.4, x: -1.2 }, { r: 1.7, x: 0 }, { r: 1.3, x: 1.3 }
      ];
      const mats = new THREE.MeshStandardMaterial({ color: new THREE.Color("#ffffff"), roughness: 0.95 });
      parts.forEach(p => {
        const geo = new THREE.SphereGeometry(p.r, 24, 24);
        const m = new THREE.Mesh(geo, mats);
        m.position.set(p.x, 0, 0);
        group.add(m);
        disposers.push(() => geo.dispose());
      });
      group.position.set(...(objSpec.pos || [0, 10, 0]));
      scene.add(group);

      disposers.push(() => mats.dispose());
      objectsById[objSpec.id] = group;
      return;
    }

    if (t === "orbitRing") {
      const radius = objSpec.radius ?? 8;
      const geo = new THREE.RingGeometry(radius - 0.03, radius + 0.03, 128);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id] = mesh;
      return;
    }

    if (t === "stemPlant") {
      // stem + leaf
      const group = new THREE.Group();

      const stemGeo = new THREE.CylinderGeometry(0.22, 0.28, 6, 18);
      const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#16a34a"), roughness: 0.7 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 3, 0);
      group.add(stem);

      const leafGeo = new THREE.SphereGeometry(1.3, 24, 24);
      const leafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#22c55e"), roughness: 0.75 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.set(1.7, 1.0, 0.9);
      leaf.position.set(0, 6, 0);
      group.add(leaf);

      group.position.set(...(objSpec.pos || [0, 0, 0]));
      scene.add(group);

      objectsById[objSpec.id] = group;
      disposers.push(() => { stemGeo.dispose(); leafGeo.dispose(); stemMat.dispose(); leafMat.dispose(); });

      return;
    }

    if (t === "rain") {
      // group of falling droplets
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(objSpec.color || "#2563eb") });
      for (let i = 0; i < 18; i++) {
        const geo = new THREE.SphereGeometry(0.12, 12, 12);
        const drop = new THREE.Mesh(geo, mat);
        drop.position.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 2);
        drop.userData.baseY = drop.position.y;
        group.add(drop);
        disposers.push(() => geo.dispose());
      }
      group.position.set(...(sceneJson.objects.find(o => o.id === objSpec.id)?.from || [6, 8.5, -1]));
      group.userData.toY = objSpec.toY ?? 0.8;

      scene.add(group);
      objectsById[objSpec.id] = group;
      disposers.push(() => mat.dispose());
      return;
    }

    if (t === "particleBox") {
      // transparent cube with particles
      const group = new THREE.Group();
      const boxGeo = new THREE.BoxGeometry(6, 6, 6);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#94a3b8"),
        transparent: true,
        opacity: 0.18,
        roughness: 1.0
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(0, 0, 0);
      group.add(box);

      const particleMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#334155") });

      const mode = objSpec.mode || "solid";
      const count = 24;

      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.22, 16, 16);
        const p = new THREE.Mesh(geo, particleMat);

        if (mode === "solid") {
          // packed grid
          const gx = (i % 4) - 1.5;
          const gy = (Math.floor(i / 4) % 3) - 1;
          const gz = Math.floor(i / 12) - 0.5;
          p.position.set(gx * 0.9, gy * 0.9, gz * 0.9);
        } else if (mode === "liquid") {
          p.position.set((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 2.2 - 1.0, (Math.random() - 0.5) * 3.5);
          p.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
        } else {
          // gas
          p.position.set((Math.random() - 0.5) * 5.0, (Math.random() - 0.5) * 5.0, (Math.random() - 0.5) * 5.0);
          p.userData.v = new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2);
        }

        group.add(p);
        disposers.push(() => geo.dispose());
      }

      group.position.set(...(objSpec.pos || [0, 3.5, 0]));
      scene.add(group);

      objectsById[objSpec.id] = group;
      disposers.push(() => { boxGeo.dispose(); boxMat.dispose(); particleMat.dispose(); });
      return;
    }

    if (t === "band") {
      // a dark transparent “night” band attached to sphere
      const target = objectsById[objSpec.target];
      if (!target) return;

      const geo = new THREE.SphereGeometry(target.geometry.parameters.radius * 1.01, 32, 32, 0, Math.PI);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#000000"),
        transparent: true,
        opacity: 0.35,
        roughness: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(target.position);
      scene.add(mesh);

      disposers.push(() => { geo.dispose(); mat.dispose(); });
      objectsById[objSpec.id] = mesh;
      return;
    }
  }

  // build objects
  (sceneJson.objects || []).forEach(addObject);

  // animation state
  let raf = null;
  let playing = true;
  let speed = 1.0;
  let t0 = performance.now();
  const tracks = sceneJson.animation?.tracks || [];

  function setSpeed(v) { speed = Math.max(0.1, Math.min(4, v)); }
  function play() { playing = true; }
  function pause() { playing = false; }
  function reset() {
    // quick reset: rebuild scene by caller (simpler)
  }

  function applyTrack(dt, track) {
    const obj = objectsById[track.target];
    if (!obj) return;

    const s = (track.speed ?? 1) * speed;
    const a = track.amount ?? 1;

    switch (track.action) {
      case "rotateY":
        obj.rotation.y += dt * s;
        break;

      case "pulse": {
        const base = 1;
        const k = Math.sin((performance.now() / 1000) * s) * a;
        obj.scale.setScalar(base + k);
        break;
      }

      case "orbit": {
        obj.userData._orbitT = (obj.userData._orbitT ?? 0) + dt * s;
        const ang = obj.userData._orbitT;
        const r = track.radius ?? 8;
        const c = track.center ?? [0, 0, 0];
        const x = c[0] + Math.cos(ang) * r;
        const z = c[2] + Math.sin(ang) * r;
        obj.position.set(x, c[1] ?? 0, z);
        break;
      }

      case "moveX": {
        obj.userData._moveT = (obj.userData._moveT ?? 0) + dt * s;
        const phase = (Math.sin(obj.userData._moveT) + 1) / 2; // 0..1
        const startX = -6;
        obj.position.x = startX + phase * a;
        break;
      }

      case "sway": {
        obj.userData._swayT = (obj.userData._swayT ?? 0) + dt * s;
        obj.rotation.z = Math.sin(obj.userData._swayT) * a;
        break;
      }

      case "driftX": {
        obj.userData._driftT = (obj.userData._driftT ?? 0) + dt * s;
        const phase = Math.sin(obj.userData._driftT) * a;
        const baseX = (obj.userData._baseX ?? obj.position.x);
        obj.userData._baseX = baseX;
        obj.position.x = baseX + phase;
        break;
      }

      case "flow": {
        // “flow” effect for arrows: pulse opacity by scaling slightly
        obj.userData._flowT = (obj.userData._flowT ?? 0) + dt * s;
        const k = 1 + Math.sin(obj.userData._flowT * 4) * 0.06;
        obj.scale.setScalar(k);
        break;
      }

      case "rain": {
        // obj is group of droplets
        obj.children.forEach((drop) => {
          drop.position.y -= dt * s * 3.5;
          if (drop.position.y < (obj.userData.toY ?? 0.8)) {
            drop.position.y = 2 + Math.random() * 2;
          }
        });
        break;
      }

      case "particles": {
        // particleBox group: children[0] is box, rest are particles
        const mode = (sceneJson.objects || []).find(o => o.id === track.target)?.mode || "liquid";
        for (let i = 1; i < obj.children.length; i++) {
          const p = obj.children[i];
          const v = p.userData.v;
          if (!v) continue;

          p.position.addScaledVector(v, dt * s);

          const limit = mode === "gas" ? 2.7 : 2.1;
          if (Math.abs(p.position.x) > limit) v.x *= -1;
          if (Math.abs(p.position.z) > limit) v.z *= -1;

          if (mode === "gas") {
            if (Math.abs(p.position.y) > limit) v.y *= -1;
          } else {
            // liquids mostly stay lower
            p.position.y = THREE.MathUtils.clamp(p.position.y, -2.3, 0.8);
          }
        }
        break;
      }

      case "followRotateY": {
        const targetRef = objectsById[track.targetRef];
        if (!targetRef) return;
        obj.rotation.y = targetRef.rotation.y;
        obj.position.copy(targetRef.position);
        break;
      }

      default:
        break;
    }
  }

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  function tick() {
    raf = requestAnimationFrame(tick);

    const now = performance.now();
    const dt = Math.min(0.033, (now - t0) / 1000);
    t0 = now;

    if (playing) {
      for (const tr of tracks) applyTrack(dt, tr);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  tick();

  function destroy() {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();

    // dispose objects
    disposers.forEach(fn => fn());
    renderer.dispose();

    // clear
    container.innerHTML = "";
  }

  return { play, pause, setSpeed, reset, destroy };
}