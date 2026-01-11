import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function dynamicAnimation(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue
  scene.fog = new THREE.Fog(0x87ceeb, 10, 30);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 5, 15);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 30;

  // ===== LIGHTS =====
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(10, 15, 5);
  scene.add(directionalLight);

  // ===== OCEAN =====
  const oceanGeo = new THREE.PlaneGeometry(20, 10, 32, 32);
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1e88e5, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -2;
  scene.add(ocean);

  // ===== TERRAIN =====
  const terrainGeo = new THREE.PlaneGeometry(20, 8, 32, 32);
  const verts = terrainGeo.attributes.position.array;
  for (let i = 0; i < verts.length; i += 3) {
    verts[i + 2] = Math.sin(verts[i] * 0.5) * 0.3 + Math.cos(verts[i + 1] * 0.7) * 0.2;
  }
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -1.9;
  scene.add(terrain);

  // ===== TREES =====
  const treeField = new THREE.Group();
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 15;
    const z = (Math.random() - 0.5) * 15;
    const tree = new THREE.Group();
    tree.scale.set(0.8, 0.8, 0.8);
    tree.position.set(x, -1.5, z);

    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = -0.5;
    tree.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(0.5, 1, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 0.5;
    tree.add(leaves);

    treeField.add(tree);
  }
  scene.add(treeField);

  // ===== CLOUDS =====
  const clouds = [];
  const cloudPositions = [
    [-5, 3, -2],
    [3, 4, 1],
    [8, 3.5, -3]
  ];
  cloudPositions.forEach(pos => {
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(pos[0], pos[1], pos[2]);
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.SphereGeometry(0.6 + Math.random() * 0.2, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
      cloudGroup.add(sphere);
    }
    scene.add(cloudGroup);
    clouds.push(cloudGroup);
  });

  // ===== WATER PARTICLES =====
  const waterParticles = [];
  for (let i = 0; i < 200; i++) {
    const geo = new THREE.SphereGeometry(0.05, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.set((Math.random() - 0.5) * 12, -1.95, (Math.random() - 0.5) * 8);
    scene.add(particle);
    waterParticles.push(particle);
  }

  // ===== RAINDROPS =====
  const raindrops = [];
  for (let i = 0; i < 100; i++) {
    const geo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x90caf9 });
    const drop = new THREE.Mesh(geo, mat);
    drop.position.set((Math.random() - 0.5) * 8, 6 + Math.random() * 2, (Math.random() - 0.5) * 6);
    scene.add(drop);
    raindrops.push(drop);
  }

  // ===== STAGE =====
  const stages = ["Evaporation", "Condensation", "Precipitation", "Collection"];
  let stageIndex = 0;
  const stageDiv = document.createElement("div");
  stageDiv.style.position = "absolute";
  stageDiv.style.top = "10px";
  stageDiv.style.width = "100%";
  stageDiv.style.textAlign = "center";
  stageDiv.style.color = "white";
  stageDiv.style.fontWeight = "bold";
  stageDiv.style.fontSize = "18px";
  stageDiv.style.pointerEvents = "none";
  stageDiv.innerText = `🌍 ${stages[stageIndex]}`;
  container.appendChild(stageDiv);

  setInterval(() => {
    stageIndex = (stageIndex + 1) % stages.length;
    stageDiv.innerText = `🌍 ${stages[stageIndex]}`;
  }, 8000);

  // ===== ANIMATION LOOP =====
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Ocean wave
    ocean.position.y = Math.sin(t * 0.5) * 0.1 - 2;

    // Clouds move
    clouds.forEach(c => {
      c.position.x += 0.01;
      if (c.position.x > 15) c.position.x = -15;
    });

    // Water particles rise
    waterParticles.forEach(p => {
      p.position.y += 0.02;
      if (p.position.y > 3) p.position.y = -1.95;
    });

    // Raindrops fall
    raindrops.forEach(d => {
      d.position.y -= 0.2;
      if (d.position.y < -1.9) d.position.y = 6 + Math.random() * 2;
    });

    renderer.render(scene, camera);
  }

  animate();
}
