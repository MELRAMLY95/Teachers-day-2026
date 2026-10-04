export type Look = {
  x: number;
  y: number;
  viewW: number;
  viewH: number;
  worldW: number;
  worldH: number;
  panning: boolean;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  looked: boolean;
  framed: boolean;
};

export function createLook(): Look {
  return {
    x: 0,
    y: 0,
    viewW: 1,
    viewH: 1,
    worldW: 1,
    worldH: 1,
    panning: false,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
    looked: false,
    framed: false,
  };
}

export function clampLook(look: Look) {
  const maxX = Math.max(0, look.worldW - look.viewW);
  const maxY = Math.max(0, look.worldH - look.viewH);
  look.x = Math.min(maxX, Math.max(0, look.x));
  look.y = Math.min(maxY, Math.max(0, look.y));
}

export function startPan(look: Look, sx: number, sy: number) {
  look.panning = true;
  look.sx = sx;
  look.sy = sy;
  look.ox = look.x;
  look.oy = look.y;
}

export function dragPan(look: Look, sx: number, sy: number) {
  if (!look.panning) return;
  look.x = look.ox - (sx - look.sx);
  look.y = look.oy - (sy - look.sy);
  if (Math.hypot(sx - look.sx, sy - look.sy) > 8) look.looked = true;
  clampLook(look);
}

export function stopPan(look: Look, sx: number, sy: number) {
  const moved = look.panning && Math.hypot(sx - look.sx, sy - look.sy) > 8;
  look.panning = false;
  return moved;
}

export function drawSlip(
  ctx: CanvasRenderingContext2D,
  text: string,
  hand: string,
  viewW: number,
  viewH: number,
) {
  if (!text) return;
  const pad = 16;
  const boxW = Math.min(480, Math.max(160, viewW - 28));
  const x = (viewW - boxW) / 2;
  const y = Math.max(12, viewH - 98);
  ctx.fillStyle = "rgba(243, 234, 216, 0.96)";
  ctx.fillRect(x, y, boxW, 78);
  ctx.fillStyle = "#241c14";
  ctx.font = `20px ${hand}`;
  ctx.textAlign = "left";
  const words = text.split(" ");
  let line = "";
  let yy = y + 30;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > boxW - pad * 2 && line) {
      ctx.fillText(line, x + pad, yy);
      line = word;
      yy += 24;
      if (yy > y + 70) return;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x + pad, yy);
}
