import * as THREE from "three";

// Bumped from 256 -> 512 across all three textures below: at BR map scale
// (a 256px tile repeated 60-80 times across a ~380-unit-wide floor) the
// texture was visibly soft/blurry up close. A higher base resolution plus
// anisotropic filtering (see applyGroundTextureSettings) is what actually
// fixes softness at grazing viewing angles — a first-person camera looking
// across open ground is exactly that worst case for texture filtering.
const TEX_SIZE = 512;

function applyGroundTextureSettings(texture: THREE.CanvasTexture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Runtime-generated (canvas-drawn, not a loaded image file) tileable floor
 * texture — a subtle tech-panel grid. Keeps the "no external assets"
 * convention (nothing on disk) while giving the arena floor real detail
 * instead of a single flat color, which read as too plain/"ugly" at a
 * glance. Client-only (uses document.createElement) — safe because Arena.tsx
 * only renders inside the dynamically-imported (`ssr:false`) game Canvas.
 */
export function createFloorGridTexture(): THREE.CanvasTexture {
  const size = TEX_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#12161f";
  ctx.fillRect(0, 0, size, size);

  // Large panel border
  ctx.strokeStyle = "rgba(51,230,255,0.16)";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, size - 5, size - 5);

  // Fine inner grid
  ctx.strokeStyle = "rgba(140,170,190,0.09)";
  ctx.lineWidth = 1.5;
  const step = size / 8;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  // Extra-fine sub-grid for close-up detail
  ctx.strokeStyle = "rgba(140,170,190,0.04)";
  ctx.lineWidth = 1;
  const subStep = size / 32;
  for (let i = 1; i < 32; i++) {
    if (i % 4 === 0) continue; // already drawn by the main grid
    ctx.beginPath();
    ctx.moveTo(i * subStep, 0);
    ctx.lineTo(i * subStep, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * subStep);
    ctx.lineTo(size, i * subStep);
    ctx.stroke();
  }

  // Corner accent notches
  ctx.strokeStyle = "rgba(255,138,51,0.2)";
  ctx.lineWidth = 3;
  const notch = 28;
  for (const [x, y] of [
    [0, 0],
    [size, 0],
    [0, size],
    [size, size],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y === 0 ? notch : y - notch);
    ctx.lineTo(x, y);
    ctx.lineTo(x === 0 ? notch : x - notch, y);
    ctx.stroke();
  }

  return applyGroundTextureSettings(new THREE.CanvasTexture(canvas));
}

/** Sand variant for the desert BR map — mottled tan/orange speckling instead
 * of a tech grid, same runtime-canvas approach. */
export function createSandTexture(): THREE.CanvasTexture {
  const size = TEX_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#c9a875";
  ctx.fillRect(0, 0, size, size);

  const speckleColors = ["#b8935f", "#d4b587", "#a67c4a", "#e0c496"];
  for (let i = 0; i < 3600; i++) {
    ctx.fillStyle = speckleColors[i % speckleColors.length];
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.5 + Math.random() * 2.4;
    ctx.globalAlpha = 0.22 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Faint wind-ripple streaks
  ctx.strokeStyle = "rgba(120,90,50,0.14)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const y = (i / 16) * size + Math.random() * 14;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 18, size * 0.7, y + 18, size, y);
    ctx.stroke();
  }

  return applyGroundTextureSettings(new THREE.CanvasTexture(canvas));
}

/** Neon District (Tokyo mega-city) street texture — dark wet asphalt with a
 * magenta/cyan-tinted lane grid instead of Tilted Vibes' cooler cyan-only
 * tech grid, giving the third BR map its own visual identity. */
export function createNeonAsphaltTexture(): THREE.CanvasTexture {
  const size = TEX_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0c0d13";
  ctx.fillRect(0, 0, size, size);

  // Faint mottled noise for a wet-asphalt look.
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "#14151c" : "#0a0b10";
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.4 + Math.random() * 2;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Lane-marking grid, alternating magenta/cyan for a neon-reflection feel.
  const step = size / 8;
  for (let i = 1; i < 8; i++) {
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,46,196,0.18)" : "rgba(51,230,255,0.16)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  // Finer secondary lane lines for close-up detail
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const fineStep = size / 24;
  for (let i = 1; i < 24; i++) {
    if (i % 3 === 0) continue;
    ctx.beginPath();
    ctx.moveTo(i * fineStep, 0);
    ctx.lineTo(i * fineStep, size);
    ctx.stroke();
  }

  return applyGroundTextureSettings(new THREE.CanvasTexture(canvas));
}
