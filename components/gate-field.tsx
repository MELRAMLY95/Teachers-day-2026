"use client";

import { useReducedMotion } from "@/components/use-reduced-motion";
import { useStage } from "@/components/worlds/shared/stage";

let gateTime = 0;

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const light = ctx.createRadialGradient(x, y, 2, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#10141c");
  sky.addColorStop(0.42, "#16120e");
  sky.addColorStop(1, "#0a0908");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const dusk = ctx.createRadialGradient(width * 0.5, height * 0.42, 20, width * 0.5, height * 0.5, Math.max(width, height) * 0.62);
  dusk.addColorStop(0, "rgba(196, 132, 72, 0.16)");
  dusk.addColorStop(0.45, "rgba(80, 48, 28, 0.05)");
  dusk.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 48; index += 1) {
    const seed = Math.sin(index * 91.7) * 43758.5453;
    const unit = seed - Math.floor(seed);
    const seed2 = Math.sin(index * 17.3 + 2) * 1000;
    const unit2 = seed2 - Math.floor(seed2);
    const x = unit * width;
    const y = unit2 * height * 0.72;
    const twinkle = 0.25 + Math.abs(Math.sin(time * 0.8 + index)) * 0.75;
    ctx.globalAlpha = 0.15 + unit * 0.45 * twinkle;
    ctx.fillStyle = unit > 0.82 ? "#f6d7a2" : "#f4f0e6";
    ctx.fillRect(x, y, unit > 0.9 ? 1.8 : 1, unit > 0.9 ? 1.8 : 1);
  }
  ctx.globalAlpha = 1;

  const horizon = height * 0.78;
  ctx.fillStyle = "#14110e";
  ctx.fillRect(0, horizon, width, height - horizon);
  ctx.strokeStyle = "rgba(232, 206, 160, 0.18)";
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(width, horizon);
  ctx.stroke();

  const starX = width * 0.14;
  const starY = height * 0.22;
  glow(ctx, starX, starY, 54, "rgba(255, 214, 150, 0.28)");
  ctx.fillStyle = "#fff6e4";
  ctx.beginPath();
  ctx.arc(starX, starY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  const orbit = time * 0.7;
  ctx.strokeStyle = "rgba(232, 214, 186, 0.28)";
  ctx.beginPath();
  ctx.ellipse(starX, starY, 28, 12, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d5e4ff";
  ctx.beginPath();
  ctx.arc(starX + Math.cos(orbit) * 28, starY + Math.sin(orbit) * 12, 2.2, 0, Math.PI * 2);
  ctx.fill();

  const waveX = width * 0.84;
  const waveY = height * 0.24;
  glow(ctx, waveX, waveY, 48, "rgba(170, 190, 230, 0.16)");
  ctx.strokeStyle = "rgba(244, 226, 180, 0.75)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let step = 0; step <= 42; step += 1) {
    const u = step / 42;
    const x = waveX - 36 + u * 72;
    const y = waveY + Math.sin(u * Math.PI * 4 + time * 1.4) * 10;
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const narrow = width < 760;
  const beakerX = width * (narrow ? 0.16 : 0.12);
  const beakerY = height * (narrow ? 0.9 : 0.62);
  glow(ctx, beakerX, beakerY - 10, 42, "rgba(255, 170, 80, 0.16)");
  ctx.strokeStyle = "rgba(244, 236, 220, 0.72)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(beakerX - 14, beakerY - 28);
  ctx.lineTo(beakerX - 11, beakerY + 16);
  ctx.quadraticCurveTo(beakerX, beakerY + 22, beakerX + 11, beakerY + 16);
  ctx.lineTo(beakerX + 14, beakerY - 28);
  ctx.stroke();
  ctx.fillStyle = "rgba(46, 110, 186, 0.72)";
  ctx.beginPath();
  ctx.moveTo(beakerX - 12, beakerY - 4);
  ctx.lineTo(beakerX - 11, beakerY + 15);
  ctx.quadraticCurveTo(beakerX, beakerY + 20, beakerX + 11, beakerY + 15);
  ctx.lineTo(beakerX + 12, beakerY - 4);
  ctx.closePath();
  ctx.fill();
  const flame = 0.75 + Math.sin(time * 9) * 0.25;
  ctx.fillStyle = `rgba(255, 186, 90, ${0.85 * flame})`;
  ctx.beginPath();
  ctx.ellipse(beakerX, beakerY + 30, 3, 7 * flame, 0, 0, Math.PI * 2);
  ctx.fill();

  const bookX = width * (narrow ? 0.84 : 0.88);
  const bookY = height * (narrow ? 0.9 : 0.62);
  glow(ctx, bookX, bookY, 40, "rgba(255, 196, 120, 0.14)");
  ctx.fillStyle = "#f4ead4";
  ctx.fillRect(bookX - 22, bookY - 14, 20, 28);
  ctx.fillStyle = "#fffaf2";
  ctx.fillRect(bookX - 1, bookY - 14, 22, 28);
  ctx.fillStyle = "#6a4030";
  ctx.fillRect(bookX - 2, bookY - 14, 3, 28);
  ctx.strokeStyle = "rgba(70, 90, 140, 0.45)";
  ctx.lineWidth = 1;
  for (let line = 0; line < 4; line += 1) {
    const y = bookY - 6 + line * 5;
    ctx.beginPath();
    ctx.moveTo(bookX + 3, y);
    ctx.lineTo(bookX + 16, y);
    ctx.stroke();
  }

  const archX = width * (narrow ? 0.34 : 0.28);
  const archY = height * (narrow ? 0.78 : 0.9);
  ctx.strokeStyle = "rgba(212, 176, 120, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(archX - 18, archY + 8);
  ctx.lineTo(archX - 18, archY - 10);
  ctx.bezierCurveTo(archX - 16, archY - 28, archX - 4, archY - 36, archX, archY - 38);
  ctx.bezierCurveTo(archX + 4, archY - 36, archX + 16, archY - 28, archX + 18, archY - 10);
  ctx.lineTo(archX + 18, archY + 8);
  ctx.stroke();
  glow(ctx, archX, archY - 8, 22, "rgba(255, 186, 96, 0.12)");

  const heartX = width * (narrow ? 0.66 : 0.74);
  const heartY = height * (narrow ? 0.78 : 0.9);
  const phase = (time % 1.16) / 1.16;
  const beat = Math.exp(-(((phase - 0.12) * 16) ** 2));
  ctx.save();
  ctx.translate(heartX, heartY);
  ctx.scale(1 + beat * 0.06, 1 - beat * 0.04);
  ctx.fillStyle = "#8a2428";
  ctx.beginPath();
  ctx.moveTo(2, 16);
  ctx.bezierCurveTo(-8, 14, -16, 4, -12, -2);
  ctx.bezierCurveTo(-8, -8, -2, -6, 3, -4);
  ctx.bezierCurveTo(8, -8, 16, 0, 14, 8);
  ctx.bezierCurveTo(12, 14, 6, 16, 2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(196, 72, 64, 0.8)";
  ctx.beginPath();
  ctx.ellipse(3, 2, 4.2, 5.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let mote = 0; mote < 18; mote += 1) {
    const seed = Math.sin(mote * 12.1 + 4) * 10000;
    const unit = seed - Math.floor(seed);
    const y = ((unit * height - time * (8 + (mote % 5) * 3)) % height + height) % height;
    const x = ((mote + 0.5) / 18) * width + Math.sin(time * 0.4 + mote) * 10;
    if (Math.hypot(x - width * 0.5, y - height * 0.46) < Math.min(width, height) * 0.22) continue;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#fff1d4";
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function GateField() {
  const reduced = useReducedMotion();
  const ref = useStage((ctx, width, height, dt) => {
    if (!reduced) gateTime += dt;
    drawGate(ctx, width, height, reduced ? 0 : gateTime);
  });
  return <canvas ref={ref} aria-hidden="true" />;
}
