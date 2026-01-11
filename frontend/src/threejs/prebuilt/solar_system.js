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
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 30;

  const controls = new OrbitControls(camera, renderer.domElement);

  // ===== LIGHTS =====
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(0, 0, 0); // sun as light source
  scene.add(pointLight);

  // ===== OBJECTS =====
  // Sun
  const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Earth
  const earthOrbit = new THREE.Object3D();
  scene.add(earthOrbit);

  const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
  const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.x = 10;
  earthOrbit.add(earth);

  // Moon
  const moonOrbit = new THREE.Object3D();
  moonOrbit.position.x = 10; // center around earth
  earthOrbit.add(moonOrbit);

  const moonGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const moonMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.x = 2;
  moonOrbit.add(moon);

  // ===== ANIMATION LOOP =====
  function animate() {
    requestAnimationFrame(animate);

    // Earth orbiting Sun
    earthOrbit.rotation.y += 0.01;

    // Moon orbiting Earth
    moonOrbit.rotation.y += 0.03;

    // Earth rotation
    earth.rotation.y += 0.02;

    // Moon rotation
    moon.rotation.y += 0.02;

    renderer.render(scene, camera);
  }

  animate();
}
