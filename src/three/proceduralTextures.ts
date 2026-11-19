import * as THREE from 'three';

function makeCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTexturePack {
  sandstone: THREE.CanvasTexture;
  marble: THREE.CanvasTexture;
  kashiMosaic: THREE.CanvasTexture;
  courtyardStone: THREE.CanvasTexture;
  cedarWood: THREE.CanvasTexture;
  shojiLattice: THREE.CanvasTexture;
  kawaraRoof: THREE.CanvasTexture;
  zenGravel: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTexturePack(maxAnisotropy: number): ProceduralTexturePack {
  const sandstone = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#9c412c';
      ctx.fillRect(0, 0, s, s);
      const rows = 12;
      const cols = 6;
      const rh = s / rows;
      const cw = s / cols;
      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (cw * 0.5);
        for (let c = -1; c <= cols; c++) {
          const shade = 0.88 + ((r * 7 + c * 13) % 10) * 0.024;
          const R = Math.min(255, Math.floor(164 * shade));
          const G = Math.min(255, Math.floor(68 * shade));
          const B = Math.min(255, Math.floor(46 * shade));
          ctx.fillStyle = `rgb(${R},${G},${B})`;
          ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
        }
      }
      // Subtle Mughal arch linework band
      ctx.strokeStyle = 'rgba(232, 188, 134, 0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, s - 16, s - 16);
    },
    maxAnisotropy,
    2,
    2,
  );

  const marble = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#f3efe6';
      ctx.fillRect(0, 0, s, s);
      // Soft diagonal mineral veins
      ctx.strokeStyle = 'rgba(182, 174, 160, 0.35)';
      for (let i = 0; i < 14; i++) {
        ctx.lineWidth = 1.5 + (i % 3);
        ctx.beginPath();
        const y0 = (i * 42) % s;
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(s * 0.35, y0 + 28, s * 0.65, y0 - 22, s, (y0 + 55) % s);
        ctx.stroke();
      }
      // Subtle pietra dura floral border dots
      ctx.fillStyle = 'rgba(180, 128, 62, 0.32)';
      for (let x = 32; x < s; x += 64) {
        ctx.beginPath();
        ctx.arc(x, 24, 4, 0, Math.PI * 2);
        ctx.arc(x, s - 24, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    maxAnisotropy,
    2,
    2,
  );

  const kashiMosaic = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#c46a45';
      ctx.fillRect(0, 0, s, s);
      const colors = ['#1b4d7e', '#e5a93c', '#2b7a6b', '#f2e8d5', '#8b3a2b'];
      const panelW = s / 4;
      const panelH = s / 2;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * panelW + 10;
          const y = row * panelH + 14;
          const w = panelW - 20;
          const h = panelH - 28;
          ctx.fillStyle = '#183f66';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#e8c47a';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
          // Stylized tile medallions
          ctx.fillStyle = colors[(row + col) % colors.length];
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, w * 0.24, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e5a93c';
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, w * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    maxAnisotropy,
    2,
    1,
  );

  const courtyardStone = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#a87d61';
      ctx.fillRect(0, 0, s, s);
      const grid = 8;
      const step = s / grid;
      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const v = ((x * 19 + y * 31) % 12) - 6;
          ctx.fillStyle = `rgb(${172 + v}, ${126 + v}, ${98 + v})`;
          ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
        }
      }
    },
    maxAnisotropy,
    6,
    6,
  );

  const cedarWood = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#6a442a';
      ctx.fillRect(0, 0, s, s);
      const planks = 8;
      const pw = s / planks;
      for (let i = 0; i < planks; i++) {
        const shade = 0.88 + (i % 4) * 0.05;
        ctx.fillStyle = `rgb(${Math.floor(110 * shade)}, ${Math.floor(70 * shade)}, ${Math.floor(42 * shade)})`;
        ctx.fillRect(i * pw + 1, 0, pw - 2, s);
        ctx.strokeStyle = 'rgba(42, 24, 12, 0.35)';
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 6; g++) {
          ctx.beginPath();
          ctx.moveTo(i * pw + 6 + g * 8, 0);
          ctx.lineTo(i * pw + 8 + g * 8, s);
          ctx.stroke();
        }
      }
    },
    maxAnisotropy,
    2,
    2,
  );

  const shojiLattice = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#fbf5e6';
      ctx.fillRect(0, 0, s, s);
      // Warm interior glow gradient
      const grad = ctx.createRadialGradient(s / 2, s / 2, 20, s / 2, s / 2, s * 0.65);
      grad.addColorStop(0, '#ffe8b3');
      grad.addColorStop(1, '#f3e5c8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);

      // Kumiko cedar lattice bars
      ctx.fillStyle = '#472d1b';
      const cols = 6;
      const rows = 8;
      for (let c = 0; c <= cols; c++) {
        const x = (c * s) / cols;
        ctx.fillRect(x - 4, 0, 8, s);
      }
      for (let r = 0; r <= rows; r++) {
        const y = (r * s) / rows;
        ctx.fillRect(0, y - 4, s, 8);
      }
      // Outer wooden frame
      ctx.lineWidth = 22;
      ctx.strokeStyle = '#3b2415';
      ctx.strokeRect(0, 0, s, s);
    },
    maxAnisotropy,
    1,
    1,
  );

  const kawaraRoof = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#252a32';
      ctx.fillRect(0, 0, s, s);
      const cols = 12;
      const rows = 10;
      const cw = s / cols;
      const rh = s / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#2f3540' : '#292e38';
          ctx.fillRect(c * cw + 1, r * rh + 2, cw - 2, rh - 4);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(c * cw + 2, r * rh + 2, cw * 0.3, rh - 4);
        }
      }
    },
    maxAnisotropy,
    3,
    2,
  );

  const zenGravel = makeCanvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = '#d8d3c8';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(130, 124, 114, 0.35)';
      ctx.lineWidth = 4;
      for (let y = 12; y < s; y += 16) {
        ctx.beginPath();
        for (let x = 0; x <= s; x += 16) {
          const wave = Math.sin((x / s) * Math.PI * 4) * 3;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
    },
    maxAnisotropy,
    3,
    3,
  );

  // Radial soft contact shadow (no color space needed as alpha/color)
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 256;
  contactCanvas.height = 256;
  const cctx = contactCanvas.getContext('2d')!;
  const rg = cctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  rg.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  rg.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
  rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cctx.fillStyle = rg;
  cctx.fillRect(0, 0, 256, 256);
  const contactShadow = new THREE.CanvasTexture(contactCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  return {
    sandstone,
    marble,
    kashiMosaic,
    courtyardStone,
    cedarWood,
    shojiLattice,
    kawaraRoof,
    zenGravel,
    contactShadow,
    dispose: () => {
      sandstone.dispose();
      marble.dispose();
      kashiMosaic.dispose();
      courtyardStone.dispose();
      cedarWood.dispose();
      shojiLattice.dispose();
      kawaraRoof.dispose();
      zenGravel.dispose();
      contactShadow.dispose();
    },
  };
}
