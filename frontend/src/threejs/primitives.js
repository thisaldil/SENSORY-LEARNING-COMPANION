import * as THREE from "three";

export function makeLabelSprite(text, size = 0.8) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const fontSize = 48;
  ctx.font = `bold ${fontSize}px Arial`;
  const padding = 18;
  const w = ctx.measureText(text).width + padding * 2;
  const h = fontSize + padding * 2;

  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);

  // redraw after size set
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 6;

  ctx.beginPath();
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(20,20,20,0.95)";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);

  // scale sprite
  const scale = size;
  sprite.scale.set((canvas.width / 100) * scale, (canvas.height / 100) * scale, 1);

  sprite.userData._dispose = () => {
    texture.dispose();
    mat.dispose();
  };

  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeArrow(from, to, color = "#ef4444") {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);

  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  dir.normalize();

  const group = new THREE.Group();

  const shaftLen = Math.max(0.01, len * 0.78);
  const headLen = Math.max(0.2, len * 0.22);

  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, shaftLen, 12);
  const headGeo = new THREE.ConeGeometry(0.22, headLen, 16);

  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color) });

  const shaft = new THREE.Mesh(shaftGeo, mat);
  const head = new THREE.Mesh(headGeo, mat);

  // place along +Y then rotate to direction
  shaft.position.y = shaftLen / 2;
  head.position.y = shaftLen + headLen / 2;

  group.add(shaft);
  group.add(head);

  group.position.copy(start);

  // rotate group to dir
  const axis = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir);
  group.quaternion.copy(quat);

  group.userData._dispose = () => {
    shaftGeo.dispose();
    headGeo.dispose();
    mat.dispose();
  };

  // for flow animation
  group.userData._flowT = 0;

  return group;
}