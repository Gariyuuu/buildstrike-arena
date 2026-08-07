import * as THREE from "three";

/**
 * Runtime-generated (canvas-drawn, not a loaded image file) tileable floor
 * texture — a subtle tech-panel grid. Keeps the "no external assets"
 * convention (nothing on disk) while giving the arena floor real detail
 * instead of a single flat color, which read as too plain/"ugly" at a
 * glance. Client-only (uses document.createElement) — safe because Arena.tsx
 * only renders inside the dynamically-imported (`ssr:false`) game Canvas.
 */
export function createFloorGridTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#12161f";
  ctx.fillRect(0, 0, size, size);

  // Large panel border
  ctx.strokeStyle = "rgba(51,230,255,0.14)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);

  // Fine inner grid
  ctx.strokeStyle = "rgba(140,170,190,0.08)";
  ctx.lineWidth = 1;
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

  // Corner accent notches
  ctx.strokeStyle = "rgba(255,138,51,0.18)";
  ctx.lineWidth = 2;
  const notch = 14;
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

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Sand variant for the desert BR map — mottled tan/orange speckling instead
 * of a tech grid, same runtime-canvas approach. */
export function createSandTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#c9a875";
  ctx.fillRect(0, 0, size, size);

  const speckleColors = ["#b8935f", "#d4b587", "#a67c4a", "#e0c496"];
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = speckleColors[i % speckleColors.length];
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.6 + Math.random() * 2.2;
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Faint wind-ripple streaks
  ctx.strokeStyle = "rgba(120,90,50,0.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * size + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 10, size * 0.7, y + 10, size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
