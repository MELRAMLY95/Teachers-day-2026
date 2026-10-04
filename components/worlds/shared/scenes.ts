export type SceneTone = "chemistry" | "physics" | "math" | "english" | "inner";

export type SceneSpot = { id: string; x: number; y: number; open: number };

export type SceneFrame = {
  time: number;
  life: number;
  warmth: number;
  focus: string | null;
  freeze: boolean;
  width: number;
  height: number;
  spots: SceneSpot[];
};

function mix(a: string, b: string, t: number) {
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const from = parse(a);
  const to = parse(b);
  const amount = Math.min(1, Math.max(0, t));
  const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

function hash(index: number) {
  const value = Math.sin(index * 91.7 + 4.2) * 43758.5453;
  return value - Math.floor(value);
}

function sky(ctx: CanvasRenderingContext2D, frame: SceneFrame, top: string, mid: string, bottom: string, warm: string) {
  const t = Math.max(frame.life, frame.warmth * 0.85);
  const gradient = ctx.createLinearGradient(0, 0, 0, frame.height);
  gradient.addColorStop(0, mix(top, warm, t * 0.45));
  gradient.addColorStop(0.55, mix(mid, warm, t * 0.28));
  gradient.addColorStop(1, mix(bottom, warm, t * 0.55));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

function vignette(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  const veil = ctx.createRadialGradient(
    frame.width / 2,
    frame.height / 2,
    frame.width * 0.18,
    frame.width / 2,
    frame.height / 2,
    frame.width * 0.72,
  );
  veil.addColorStop(0, "rgba(0,0,0,0)");
  veil.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, frame.width, frame.height);
  if (frame.focus) {
    ctx.fillStyle = "rgba(6, 4, 3, 0.5)";
    ctx.fillRect(0, 0, frame.width, frame.height);
  }
}

function dust(ctx: CanvasRenderingContext2D, frame: SceneFrame, color: string, count: number, speed: number) {
  ctx.fillStyle = color;
  for (let index = 0; index < count; index += 1) {
    const x = (hash(index) * frame.width + frame.time * speed * (0.4 + hash(index + 7))) % frame.width;
    const y = (hash(index + 3) * frame.height - frame.time * (6 + hash(index + 5) * 10) + frame.height) % frame.height;
    ctx.globalAlpha = 0.12 + hash(index + 9) * 0.28;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + hash(index + 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, color: string, time: number) {
  const breathe = 0.85 + Math.sin(time * 0.8 + x) * 0.15;
  const radius = 11 + open * 18;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, radius * 2.2);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = (0.22 + open * 0.5) * breathe;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.8 + open * 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2.4 + open * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function molecule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  seed: number,
  alpha: number,
) {
  const nodes = 3 + (seed % 2);
  const points = Array.from({ length: nodes }, (_, index) => {
    const angle = time * 0.15 + index * ((Math.PI * 2) / nodes) + seed;
    return { x: x + Math.cos(angle) * scale, y: y + Math.sin(angle) * scale * 0.72 };
  });
  ctx.strokeStyle = `rgba(244, 220, 180, ${alpha})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(next.x, next.y);
  });
  ctx.stroke();
  points.forEach((point, index) => {
    ctx.fillStyle = index === 0 ? `rgba(255, 214, 160, ${alpha})` : `rgba(196, 122, 58, ${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 0 ? 4.5 : 3.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawChemistry(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#100c09", "#1a120c", "#24160e", "#c47a3a");
  const { width, height, life, warmth, time } = frame;
  const cx = width * 0.5;
  const cy = height * 0.46;
  const sunReach = Math.min(width, height) * (0.16 + warmth * 0.22 + life * 0.06);
  const sun = ctx.createRadialGradient(cx, cy - 30, 8, cx, cy - 10, sunReach * 2.4);
  sun.addColorStop(0, `rgba(255, 220, 170, ${0.2 + warmth * 0.55})`);
  sun.addColorStop(0.35, `rgba(212, 140, 64, ${0.12 + life * 0.25})`);
  sun.addColorStop(1, "rgba(212, 140, 64, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy - 18, sunReach * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 214, 160, ${0.15 + warmth * 0.55})`;
  ctx.beginPath();
  ctx.arc(cx, cy - height * 0.08, 18 + warmth * 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mix("#140e0a", "#3a2416", life * 0.7);
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  ctx.strokeStyle = `rgba(244, 220, 180, ${0.12 + life * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.7);
  ctx.lineTo(width, height * 0.7);
  ctx.stroke();

  const glass = [
    { x: width * 0.22, h: 54 },
    { x: width * 0.3, h: 38 },
    { x: width * 0.72, h: 46 },
    { x: width * 0.8, h: 32 },
  ];
  glass.forEach((piece) => {
    ctx.strokeStyle = `rgba(244, 228, 200, ${0.28 + life * 0.35})`;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(piece.x, height * 0.7 - piece.h, 18, piece.h);
    ctx.fillStyle = `rgba(212, 140, 64, ${0.08 + life * 0.2})`;
    ctx.fillRect(piece.x + 2, height * 0.7 - piece.h * 0.45, 14, piece.h * 0.45);
  });

  const flask = Math.min(width, height) * 0.13;
  ctx.strokeStyle = `rgba(244, 228, 200, ${0.5 + life * 0.35})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - flask * 0.16, cy - flask * 1.15);
  ctx.lineTo(cx - flask * 0.16, cy - flask * 0.32);
  ctx.bezierCurveTo(cx - flask * 0.95, cy - flask * 0.05, cx - flask * 0.82, cy + flask * 0.9, cx, cy + flask);
  ctx.bezierCurveTo(cx + flask * 0.82, cy + flask * 0.9, cx + flask * 0.95, cy - flask * 0.05, cx + flask * 0.16, cy - flask * 0.32);
  ctx.lineTo(cx + flask * 0.16, cy - flask * 1.15);
  ctx.stroke();
  const liquid = ctx.createLinearGradient(cx, cy, cx, cy + flask);
  liquid.addColorStop(0, `rgba(255, 196, 120, ${0.15 + life * 0.35})`);
  liquid.addColorStop(1, `rgba(176, 78, 42, ${0.28 + life * 0.5})`);
  ctx.fillStyle = liquid;
  ctx.beginPath();
  ctx.ellipse(cx, cy + flask * 0.38, flask * 0.58, flask * 0.4, 0, 0, Math.PI);
  ctx.fill();

  const burner = ctx.createRadialGradient(cx, height * 0.7, 2, cx, height * 0.7, 36 + life * 20);
  burner.addColorStop(0, `rgba(255, 180, 90, ${0.35 + warmth * 0.4})`);
  burner.addColorStop(1, "rgba(255, 180, 90, 0)");
  ctx.fillStyle = burner;
  ctx.beginPath();
  ctx.ellipse(cx, height * 0.7, 40 + life * 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const bubbles = 5 + Math.round(life * 14);
  for (let index = 0; index < bubbles; index += 1) {
    const rise = (time * (14 + hash(index) * 18) + hash(index + 2) * 90) % (flask * 1.3);
    const y = cy + flask * 0.45 - rise;
    if (y < cy - flask * 0.2) continue;
    ctx.fillStyle = `rgba(255, 228, 190, ${0.28 + life * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx + (hash(index + 3) - 0.5) * flask * 0.7, y, 1.6 + hash(index) * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const clusters = 2 + Math.round(life * 4);
  for (let index = 0; index < clusters; index += 1) {
    const orbit = 70 + index * 28;
    const angle = time * (0.18 + index * 0.04) + index;
    molecule(
      ctx,
      cx + Math.cos(angle) * orbit * 1.5,
      cy - 10 + Math.sin(angle) * orbit * 0.45,
      14 + life * 4,
      time,
      index + 1,
      0.35 + life * 0.45,
    );
  }

  if (frame.focus === "lessons") {
    const wx = width * 0.16;
    const wy = height * 0.18;
    const glow = ctx.createLinearGradient(wx, wy, wx + width * 0.22, wy + height * 0.2);
    glow.addColorStop(0, "rgba(255, 214, 160, 0.22)");
    glow.addColorStop(1, "rgba(255, 214, 160, 0.02)");
    ctx.fillStyle = glow;
    ctx.fillRect(wx, wy, width * 0.2, height * 0.18);
    ctx.strokeStyle = "rgba(255, 220, 180, 0.35)";
    ctx.strokeRect(wx, wy, width * 0.2, height * 0.18);
  }

  dust(ctx, frame, "rgba(255, 210, 160, 0.8)", 18 + Math.round(life * 24), 8);
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 186, 120, 0.95)", time);
}

function drawPhysics(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#070814", "#101426", "#16120e", "#c4a36a");
  const { width, height, life, time, warmth, focus } = frame;
  const cx = width * 0.5;
  const cy = height * 0.42;
  for (let index = 0; index < 48; index += 1) {
    ctx.globalAlpha = 0.15 + hash(index) * 0.45 + life * 0.15;
    ctx.fillStyle = "#f4ead8";
    ctx.fillRect(hash(index + 2) * width, hash(index + 4) * height * 0.7, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 110 + life * 50);
  glow.addColorStop(0, `rgba(255, 236, 210, ${0.75 + warmth * 0.2})`);
  glow.addColorStop(0.35, `rgba(212, 168, 96, ${0.2 + warmth * 0.35})`);
  glow.addColorStop(1, "rgba(212, 168, 96, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 140 + life * 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6edd8";
  ctx.beginPath();
  ctx.arc(cx, cy, 6 + life * 3, 0, Math.PI * 2);
  ctx.fill();

  const rings = 3 + Math.round(life * 4);
  for (let ring = 1; ring <= rings; ring += 1) {
    ctx.strokeStyle = `rgba(214, 196, 160, ${0.14 + life * 0.14})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40 * ring, 18 * ring, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    const angle = time * (0.22 + ring * 0.04) + ring * 0.7;
    ctx.fillStyle = "rgba(244, 228, 200, 0.85)";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * 40 * ring, cy + Math.sin(angle) * 18 * ring, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(196, 168, 110, ${0.12 + life * 0.25})`;
  for (let index = 0; index < 5; index += 1) {
    const angle = -0.9 + index * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 18, cy + Math.sin(angle) * 18);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle) * 90,
      cy + 40 + index * 8,
      cx + Math.cos(angle) * (140 + life * 40),
      cy + 80,
    );
    ctx.stroke();
  }

  const waveY = height * 0.66;
  ctx.beginPath();
  ctx.strokeStyle = `rgba(232, 210, 170, ${0.25 + life * 0.45})`;
  ctx.lineWidth = 1.4;
  for (let x = width * 0.12; x <= width * 0.88; x += 4) {
    const y = waveY + Math.sin(x * 0.02 + time * 1.4) * (8 + life * 16);
    if (x === width * 0.12) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (focus === "try") {
    ctx.strokeStyle = "rgba(244, 214, 160, 0.7)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 20);
    ctx.quadraticCurveTo(cx + 20, cy - 80, cx + 120, cy - 30);
    ctx.stroke();
    const climb = (time * 0.15) % 1;
    const px = cx - 30 + climb * 150;
    const py = cy + 20 + (climb < 0.5 ? -climb * 160 : -80 + (climb - 0.5) * 100);
    ctx.fillStyle = "#f6edd8";
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  dust(ctx, frame, "rgba(220, 206, 170, 0.7)", 10 + Math.round(life * 12), 4);
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(220, 206, 170, 0.95)", time);
}

function polygon(ctx: CanvasRenderingContext2D, sides: number, radius: number) {
  ctx.beginPath();
  for (let step = 0; step <= sides; step += 1) {
    const angle = (step / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawMath(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#12100c", "#1a1612", "#241c14", "#d4b483");
  const { width, height, life, time } = frame;
  ctx.strokeStyle = `rgba(212, 180, 130, ${0.05 + life * 0.06})`;
  ctx.lineWidth = 1;
  const gap = 48;
  for (let x = gap; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = gap; y < height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const cx = width * 0.5;
  const cy = height * 0.44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.04);
  ctx.strokeStyle = `rgba(228, 206, 160, ${0.4 + life * 0.4})`;
  ctx.lineWidth = 1.5;
  const reach = Math.min(width, height) * (0.1 + life * 0.05);
  for (let turn = 0; turn < 4; turn += 1) polygon(ctx, 5, reach * (1 - turn * 0.2));
  ctx.rotate(-time * 0.07);
  ctx.strokeStyle = `rgba(244, 228, 200, ${0.25 + life * 0.35})`;
  polygon(ctx, 3, reach * 0.62);
  ctx.restore();

  ctx.beginPath();
  ctx.strokeStyle = `rgba(232, 206, 150, ${0.35 + life * 0.4})`;
  for (let x = width * 0.34; x <= width * 0.66; x += 3) {
    const local = (x - width * 0.34) / (width * 0.32);
    const y = cy + Math.min(width, height) * 0.16 + Math.sin(local * Math.PI * 3 + time * 0.6) * (8 + life * 8);
    if (x === width * 0.18) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const marks = 6 + Math.round(life * 10);
  for (let index = 0; index < marks; index += 1) {
    const x = width * (0.12 + hash(index) * 0.76);
    const y = height * (0.16 + hash(index + 2) * 0.68);
    ctx.globalAlpha = 0.15 + life * 0.35;
    ctx.strokeStyle = "rgba(228, 206, 160, 0.8)";
    ctx.strokeRect(x, y, 7, 7);
  }
  ctx.globalAlpha = 1;

  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(228, 206, 160, 0.95)", time);
  if (frame.freeze) {
    ctx.fillStyle = "rgba(8, 6, 4, 0.5)";
    ctx.fillRect(0, 0, width, height);
    const lookY = cy - Math.min(width, height) * 0.2;
    ctx.fillStyle = "rgba(244, 228, 200, 0.9)";
    ctx.beginPath();
    ctx.arc(cx - 18, lookY, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 18, lookY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, books: number, life: number, seed: number) {
  for (let index = 0; index < books; index += 1) {
    const h = 22 + hash(seed + index) * 18 + life * 6;
    const colors = ["#6a3028", "#3c4a34", "#5a3a28", "#2c2622", "#7a6238", "#4a342c"];
    ctx.globalAlpha = 0.45 + life * 0.45;
    ctx.fillStyle = colors[(seed + index) % colors.length];
    ctx.fillRect(x + index * 11, y - h, 8, h);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(212, 180, 140, ${0.25 + life * 0.3})`;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + books * 11, y);
  ctx.stroke();
}

function drawEnglish(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#140e0a", "#1c120e", "#2a1a12", "#c47a3a");
  const { width, height, life, warmth, focus } = frame;
  const lampX = width * 0.5;
  const lampY = height * 0.2;
  const lamp = ctx.createRadialGradient(lampX, lampY, 4, lampX, lampY, 240 + life * 90);
  lamp.addColorStop(0, `rgba(255, 214, 160, ${0.28 + warmth * 0.45})`);
  lamp.addColorStop(0.4, `rgba(196, 122, 58, ${0.08 + life * 0.12})`);
  lamp.addColorStop(1, "rgba(255, 214, 160, 0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(244, 220, 180, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lampX, lampY - 28);
  ctx.lineTo(lampX, lampY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(lampX, lampY, 7, 0, Math.PI * 2);
  ctx.stroke();

  shelf(ctx, 16, height * 0.34, 5, life, 2);
  shelf(ctx, 16, height * 0.58, 5, life, 5);
  shelf(ctx, width - 78, height * 0.34, 5, life, 8);
  shelf(ctx, width - 78, height * 0.58, 5, life, 11);

  if (focus !== "notebooks") {
    ctx.fillStyle = mix("#1a120e", "#3a281c", life);
    ctx.fillRect(width * 0.32, height * 0.72, width * 0.36, 10);
    ctx.strokeStyle = `rgba(244, 220, 180, ${0.35 + life * 0.3})`;
    ctx.strokeRect(width * 0.4, height * 0.62, width * 0.09, height * 0.1);
    ctx.strokeRect(width * 0.51, height * 0.62, width * 0.09, height * 0.1);
  }

  if (focus === "notebooks") {
    const covers = [
      { color: "#7a3030", ruled: true },
      { color: "#3c4a34", ruled: true },
      { color: "#2a3a52", ruled: true },
      { color: "#cbb48a", ruled: false },
    ];
    covers.forEach((cover, index) => {
      const x = width * 0.34 + index * 58;
      const y = height * 0.3;
      ctx.fillStyle = cover.color;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(x, y, 46, 62);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(244, 228, 210, 0.45)";
      ctx.strokeRect(x, y, 46, 62);
      if (cover.ruled) {
        ctx.strokeStyle = "rgba(244, 228, 210, 0.35)";
        for (let line = 0; line < 4; line += 1) {
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 16 + line * 10);
          ctx.lineTo(x + 38, y + 16 + line * 10);
          ctx.stroke();
        }
      }
    });
  }

  dust(ctx, frame, "rgba(255, 214, 170, 0.7)", 12 + Math.round(life * 16), 3);
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 196, 150, 0.95)", frame.time);
}

function starPattern(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number) {
  ctx.strokeStyle = `rgba(214, 186, 140, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let step = 0; step < 8; step += 1) {
    const angle = (step / 8) * Math.PI * 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();
}

function drawInner(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#100e0c", "#161310", "#221c16", "#c4a36a");
  const { width, height, life, focus } = frame;
  const cx = width * 0.5;
  const base = height * 0.68;
  ctx.fillStyle = mix("#16120e", "#2a2218", life * 0.6);
  ctx.fillRect(0, height * 0.78, width, height * 0.22);

  const light = ctx.createRadialGradient(cx, base - 150, 10, cx, base - 80, 180 + life * 40);
  light.addColorStop(0, `rgba(255, 220, 180, ${0.08 + life * 0.22})`);
  light.addColorStop(1, "rgba(255, 220, 180, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = `rgba(214, 186, 140, ${0.28 + life * 0.45})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 78, base);
  ctx.lineTo(cx - 78, base - 130);
  ctx.quadraticCurveTo(cx, base - 230 - life * 16, cx + 78, base - 130);
  ctx.lineTo(cx + 78, base);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 58, base);
  ctx.lineTo(cx - 58, base - 110);
  ctx.quadraticCurveTo(cx, base - 190 - life * 10, cx + 58, base - 110);
  ctx.lineTo(cx + 58, base);
  ctx.stroke();

  starPattern(ctx, cx, base - 78, 22 + life * 8, 0.2 + life * 0.35);

  const stones = focus === "trip" ? 9 : 3 + Math.round(life * 6);
  for (let index = 0; index < stones; index += 1) {
    const missing = focus === "trip" && index === stones - 1;
    const x = width * (0.16 + index * 0.075);
    ctx.fillStyle = missing ? "rgba(214, 190, 150, 0.08)" : `rgba(214, 190, 150, ${0.18 + life * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(x, height * 0.84, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (missing) {
      ctx.strokeStyle = "rgba(214, 190, 150, 0.35)";
      ctx.stroke();
    }
  }
  if (life > 0.05 || focus === "trip") {
    const lanternX = width * 0.16;
    ctx.fillStyle = `rgba(255, 196, 120, ${0.35 + life * 0.4})`;
    ctx.beginPath();
    ctx.arc(lanternX, height * 0.78, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  dust(ctx, frame, "rgba(220, 196, 160, 0.65)", 8 + Math.round(life * 10), 2);
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(220, 196, 160, 0.95)", frame.time);
}

export function drawScene(ctx: CanvasRenderingContext2D, tone: SceneTone, frame: SceneFrame) {
  if (tone === "chemistry") drawChemistry(ctx, frame);
  else if (tone === "physics") drawPhysics(ctx, frame);
  else if (tone === "math") drawMath(ctx, frame);
  else if (tone === "english") drawEnglish(ctx, frame);
  else drawInner(ctx, frame);
  vignette(ctx, frame);
}
