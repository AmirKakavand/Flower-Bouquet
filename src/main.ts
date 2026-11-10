import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { createVaseAssembly } from './vase';
import { createFlower } from './flowers';
import { playWaterSound } from './audio';
import { setupUI, showToast, hideInstruction } from './ui';

// --- Scene Setup ---
const container = document.getElementById('canvas-container') as HTMLDivElement;
const scene = new THREE.Scene();

const DAY_BG = 0xF7EFE5;
const NIGHT_BG = 0x1E1B2E;

scene.background = new THREE.Color(DAY_BG);
scene.fog = new THREE.FogExp2(DAY_BG, 0.03);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3.0, 11.8);
camera.lookAt(0, 0.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// --- High-DPI Canvas Text Engine (Immune to Browser Dark-Mode Inversion) ---
const titleCanvas = document.getElementById('title-canvas') as HTMLCanvasElement;
let isNight = false;

function renderTitleCanvas(): void {
  if (!titleCanvas) return;
  const ctx = titleCanvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio, 2);
  const rect = titleCanvas.getBoundingClientRect();
  const width = Math.max(rect.width || 240, 220);
  const height = rect.height || 68;

  titleCanvas.width = width * dpr;
  titleCanvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  // Scaled title to fit narrow phones comfortably
  const titleSize = width < 280 ? 20 : 23;
  ctx.font = `700 ${titleSize}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = isNight ? '#F3E8FF' : '#2D2D2D';
  ctx.fillText('Some flowers for you', 0, 28);

  ctx.font = '500 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isNight ? '#D8B4FE' : '#5A5A5A';
  ctx.fillText('Drag to spin • Tap the vase to blossom', 0, 52);
}

// Render once Google Fonts are loaded
document.fonts.ready.then(() => {
  renderTitleCanvas();
});

// --- Lighting Rig ---
const ambientLight = new THREE.AmbientLight(0xfff3e6, 0.75);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
sunLight.position.set(5, 12, 6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const softFillLight = new THREE.DirectionalLight(0xd9b3ff, 0.45);
softFillLight.position.set(-5, 4, -4);
scene.add(softFillLight);

const bouquetGlow = new THREE.PointLight(0xffd1a4, 0.8, 8);
bouquetGlow.position.set(0, 1.8, 0);
scene.add(bouquetGlow);

// --- Positioned Rig ---
const { gardenRig, vaseGroup, tagGroup, vaseMesh, soilMesh } = createVaseAssembly();
const BASE_RIG_Y = -0.95;
gardenRig.position.y = BASE_RIG_Y;
scene.add(gardenRig);

const flowersGroup = new THREE.Group();
gardenRig.add(flowersGroup);
const flowerInstances: THREE.Group[] = [];

function spawnOneFlower(): void {
  const flower = createFlower();
  flowersGroup.add(flower);
  flowerInstances.push(flower);

  if (flowerInstances.length > 36) {
    const oldest = flowerInstances.shift();
    if (oldest) {
      new TWEEN.Tween(oldest.scale)
        .to({ x: 0.001, y: 0.001, z: 0.001 }, 400)
        .onComplete(() => flowersGroup.remove(oldest))
        .start();
    }
  }
}

// --- Floating Particles ---
const particleCount = 70;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities: { x: number; y: number; z: number }[] = [];

for (let i = 0; i < particleCount * 3; i += 3) {
  particlePositions[i] = (Math.random() - 0.5) * 6;
  particlePositions[i + 1] = 0.5 + Math.random() * 4.5;
  particlePositions[i + 2] = (Math.random() - 0.5) * 6;
  particleVelocities.push({
    x: (Math.random() - 0.5) * 0.004,
    y: 0.002 + Math.random() * 0.005,
    z: (Math.random() - 0.5) * 0.004
  });
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

function createCircleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,240,210,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const particleMat = new THREE.PointsMaterial({
  size: 0.12,
  map: createCircleTexture(),
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// --- Watering Feature ---
function triggerWatering(): void {
  playWaterSound();

  new TWEEN.Tween(gardenRig.scale)
    .to({ x: 1.07, y: 0.94, z: 1.07 }, 180)
    .easing(TWEEN.Easing.Quadratic.Out)
    .chain(
      new TWEEN.Tween(gardenRig.scale)
        .to({ x: 0.96, y: 1.06, z: 0.96 }, 220)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .chain(
          new TWEEN.Tween(gardenRig.scale)
            .to({ x: 1, y: 1, z: 1 }, 300)
            .easing(TWEEN.Easing.Back.Out)
        )
    )
    .start();

  for (let i = 0; i < 24; i++) {
    setTimeout(() => {
      const dropGeo = new THREE.SphereGeometry(0.045, 8, 8);
      dropGeo.scale(0.8, 1.4, 0.8);
      const dropMat = new THREE.MeshStandardMaterial({
        color: 0x8BE3FF,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85
      });
      const drop = new THREE.Mesh(dropGeo, dropMat);
      const rad = 0.7 * Math.random();
      const ang = Math.random() * Math.PI * 2;
      drop.position.set(Math.cos(ang) * rad, 3.8 + Math.random() * 0.4, Math.sin(ang) * rad);
      scene.add(drop);

      new TWEEN.Tween(drop.position)
        .to({ y: 0.2 + Math.random() * 0.3 }, 650)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => scene.remove(drop))
        .start();
    }, i * 30);
  }

  showToast("💧 Refreshed & hydrated!", "🌱");
}

// --- Atmosphere Theme ---
function toggleAtmosphere(): void {
  isNight = !isNight;
  const themeBtn = document.getElementById('theme-btn');
  const badgePill = document.getElementById('badge-pill');
  const actionDock = document.getElementById('action-dock');

  renderTitleCanvas(); // Re-render canvas text colors immediately

  const targetBg = new THREE.Color(isNight ? NIGHT_BG : DAY_BG);
  const targetSunColor = new THREE.Color(isNight ? 0xB5C5FF : 0xfffaed);
  const targetAmbient = new THREE.Color(isNight ? 0x483D69 : 0xfff3e6);

  new TWEEN.Tween(scene.background).to(targetBg, 900).start();
  // @ts-ignore
  new TWEEN.Tween(scene.fog.color).to(targetBg, 900).start();
  new TWEEN.Tween(sunLight.color).to(targetSunColor, 900).start();
  new TWEEN.Tween(ambientLight.color).to(targetAmbient, 900).start();

  if (isNight) {
    sunLight.intensity = 0.85;
    ambientLight.intensity = 0.65;
    bouquetGlow.intensity = 2.6;
    bouquetGlow.color.setHex(0xFFD8A8);
    document.body.style.backgroundColor = '#1E1B2E';
    if (themeBtn) themeBtn.innerHTML = '🌙';

    actionDock?.classList.replace('glass-card', 'glass-card-night');
    badgePill?.classList.replace('glass-card', 'glass-card-night');
    badgePill?.classList.replace('text-amber-950', 'text-purple-200');
    showToast("Dreamy twilight mode", "✨");
  } else {
    sunLight.intensity = 1.35;
    ambientLight.intensity = 0.75;
    bouquetGlow.intensity = 0.8;
    bouquetGlow.color.setHex(0xffd1a4);
    document.body.style.backgroundColor = '#FAF5EE';
    if (themeBtn) themeBtn.innerHTML = '☀️';

    actionDock?.classList.replace('glass-card-night', 'glass-card');
    badgePill?.classList.replace('glass-card-night', 'glass-card');
    badgePill?.classList.replace('text-purple-200', 'text-amber-950');
    showToast("Warm afternoon sunshine", "☀️");
  }
}

// --- Wire UI Events ---
setupUI(
  () => {
    spawnOneFlower();
    hideInstruction();
  },
  triggerWatering,
  toggleAtmosphere
);

// --- User Interaction & Raycasting ---
let isDragging = false;
let prevMousePos = { x: 0, y: 0 };
let targetRotationY = 0.0;
let targetRotationX = 0.05;
let currentRotationY = 0.0;
let currentRotationX = 0.05;
const raycaster = new THREE.Raycaster();
const mouseCoord = new THREE.Vector2();

function onPointerDown(e: MouseEvent | TouchEvent): void {
  isDragging = true;
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  prevMousePos = { x: clientX, y: clientY };
}

function onPointerMove(e: MouseEvent | TouchEvent): void {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

  if (isDragging) {
    const deltaX = clientX - prevMousePos.x;
    const deltaY = clientY - prevMousePos.y;
    targetRotationY += deltaX * 0.007;
    targetRotationX += deltaY * 0.004;
    targetRotationX = Math.max(-0.25, Math.min(0.45, targetRotationX));
    prevMousePos = { x: clientX, y: clientY };
  }
}

function onPointerUp(): void {
  isDragging = false;
}

function onClickOrTap(e: MouseEvent | TouchEvent): void {
  const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
  const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

  mouseCoord.x = (clientX / window.innerWidth) * 2 - 1;
  mouseCoord.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouseCoord, camera);
  const intersects = raycaster.intersectObjects(gardenRig.children, true);

  if (intersects.length > 0) {
    const hitObj = intersects[0].object;
    let isTagHit = false;
    let isPotHit = false;

    hitObj.traverseAncestors((ancestor) => {
      if (ancestor.userData?.isTag) isTagHit = true;
      if (ancestor.userData?.isPot) isPotHit = true;
    });
    if (hitObj.userData?.isTag) isTagHit = true;
    if (hitObj.userData?.isPot) isPotHit = true;

    if (isTagHit) {
      document.getElementById('letter-btn')?.click();
      return;
    }

    if (isPotHit || hitObj === vaseMesh || hitObj === soilMesh) {
      spawnOneFlower();
      hideInstruction();
      new TWEEN.Tween(vaseGroup.scale)
        .to({ x: 1.05, y: 0.95, z: 1.05 }, 120)
        .yoyo(true)
        .repeat(1)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
  }
}

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
window.addEventListener('click', onClickOrTap);

window.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onClickOrTap, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderTitleCanvas();
});

// --- Render Loop ---
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  TWEEN.update();

  currentRotationY += (targetRotationY - currentRotationY) * 0.08;
  currentRotationX += (targetRotationX - currentRotationX) * 0.08;

  gardenRig.rotation.y = currentRotationY;
  gardenRig.rotation.x = currentRotationX;
  gardenRig.position.y = BASE_RIG_Y + Math.sin(elapsedTime * 1.5) * 0.04;

  for (let i = 0; i < flowerInstances.length; i++) {
    const fl = flowerInstances[i];
    fl.rotation.z = Math.sin(elapsedTime * 1.8 + i) * 0.035;
    fl.rotation.x = Math.cos(elapsedTime * 1.4 + i) * 0.035;
  }

  tagGroup.rotation.z = -0.06 + Math.sin(elapsedTime * 2.2) * 0.04;

  const pos = particleGeo.attributes.position.array as Float32Array;
  for (let i = 0; i < particleCount * 3; i += 3) {
    pos[i + 1] += particleVelocities[i / 3].y;
    pos[i] += particleVelocities[i / 3].x;
    pos[i + 2] += particleVelocities[i / 3].z;

    if (pos[i + 1] > 5) {
      pos[i + 1] = 0.5;
      pos[i] = (Math.random() - 0.5) * 6;
      pos[i + 2] = (Math.random() - 0.5) * 6;
    }
  }
  particleGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

for (let i = 0; i < 9; i++) {
  setTimeout(() => spawnOneFlower(), i * 100);
}

animate();