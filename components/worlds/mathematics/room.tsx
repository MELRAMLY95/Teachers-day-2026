"use client";

import { useSound } from "@/components/sound";
import { bridgeProgress, isQuarterTurn } from "@/lib/rooms/puzzles";
import type { Teacher } from "@/lib/types";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { clampLook, createLook, drawSlip, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage, type Fonts } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type Stone = { id: string; value: number; x: number; y: number; homeX: number; homeY: number };

type Runtime = {
  lengthA: number;
  lengthB: number;
  stones: Stone[];
  held: "a" | "b" | "stone" | "turn" | null;
  stoneId: string | null;
  sequence: boolean;
  shear: number;
  angle: number;
  found: Set<string>;
  fonts: Fonts;
  fontsReady: boolean;
  notice: string;
  grabX: number;
  grabY: number;
  look: Look;
  line: { id: string; index: number; text: string } | null;
  stare: number;
};

function createRuntime(): Runtime {
  const values = [7, 8, 13, 4];
  return {
    lengthA: 120,
    lengthB: 120,
    stones: values.map((value, index) => ({
      id: `n${value}-${index}`,
      value,
      x: 0,
      y: 0,
      homeX: 0,
      homeY: 0,
    })),
    held: null,
    stoneId: null,
    sequence: false,
    shear: 0,
    angle: 0.35,
    found: new Set(),
    fonts: { display: "Georgia", mono: "monospace", hand: "Georgia" },
    fontsReady: false,
    notice: "",
    grabX: 0,
    grabY: 0,
    look: createLook(),
    line: null,
    stare: 0,
  };
}

const RELIC_SPOTS: { id: string; x: number; y: number }[] = [
  { id: "sweet", x: 0.05, y: 0.8 },
  { id: "talk", x: 0.11, y: 0.16 },
  { id: "company", x: 0.18, y: 0.82 },
  { id: "love", x: 0.24, y: 0.14 },
  { id: "amazing", x: 0.32, y: 0.8 },
  { id: "work", x: 0.36, y: 0.62 },
  { id: "kill", x: 0.08, y: 0.48 },
  { id: "stare", x: 0.15, y: 0.32 },
  { id: "maths", x: 0.4, y: 0.16 },
  { id: "you", x: 0.48, y: 0.78 },
  { id: "motive", x: 0.56, y: 0.18 },
  { id: "ambition", x: 0.66, y: 0.76 },
  { id: "future", x: 0.76, y: 0.18 },
  { id: "obgyn", x: 0.9, y: 0.46 },
];

function relicRects(worldW: number, worldH: number) {
  return RELIC_SPOTS.map((spot) => ({
    id: spot.id,
    x: spot.x * worldW,
    y: spot.y * worldH,
    w: 100,
    h: 40,
  }));
}

function layout(viewW: number, viewH: number) {
  const worldW = viewW * 2.6;
  const worldH = viewH;
  const zone = worldW / 3;
  const narrow = viewW < 800;
  return {
    worldW,
    worldH,
    gap: { x: zone * 0.12, y: worldH * 0.62, w: narrow ? zone * 0.76 : zone * 0.5, h: 18 },
    originA: { x: zone * 0.14, y: worldH * (narrow ? 0.32 : 0.28) },
    originB: { x: zone * 0.14, y: worldH * (narrow ? 0.42 : 0.38) },
    slot: { x: zone + zone * 0.36, y: worldH * 0.56, w: 72, h: 72 },
    turn: { x: zone * 2 + zone * 0.42, y: worldH * 0.36 },
    door: { x: worldW - 130, y: worldH * 0.12, w: 92, h: narrow ? 120 : 170 },
    plates: [
      { id: "bridge", x: zone * 0.14, y: worldH * 0.5, w: 130, h: 36 },
      { id: "sequence", x: zone + zone * 0.32, y: worldH * 0.46, w: 140, h: 36 },
      { id: "turn", x: zone * 2 + zone * 0.28, y: worldH * 0.52, w: 120, h: 36 },
    ],
    homes: [
      { x: zone + zone * 0.18, y: worldH * 0.8 },
      { x: zone + zone * 0.38, y: worldH * 0.8 },
      { x: zone + zone * 0.56, y: worldH * 0.8 },
      { x: zone + zone * 0.74, y: worldH * 0.8 },
    ],
  };
}

const HOURS = ["09:00", "14:00", "21:00", "23:30", "01:00", "03:00"];

export function ImpossibleRoom({
  teacher,
  covered,
  onEnterMemory,
  onLeave,
}: {
  teacher: Teacher;
  covered: boolean;
  onEnterMemory: () => void;
  onLeave: () => void;
}) {
  const sound = useSound();
  const rtRef = useRef<Runtime | null>(null);
  const [hour, setHour] = useState(0);
  const [seenHours, setSeenHours] = useState<number[]>([0]);
  const [showFinale, setShowFinale] = useState(false);
  const onlineRef = useRef(false);
  useEffect(() => {
    onlineRef.current = seenHours.length >= HOURS.length;
  }, [seenHours.length]);
  const [announce, setAnnounce] = useState("");
  const announced = useRef("");
  const runtime = useCallback(() => {
    rtRef.current ??= createRuntime();
    return rtRef.current;
  }, []);

  const canvasRef = useStage((ctx, width, height) => {
    const rt = runtime();
    if (!rt.fontsReady) {
      rt.fonts = readFonts();
      rt.fontsReady = true;
    }
    const place = layout(width, height);
    rt.look.viewW = width;
    rt.look.viewH = height;
    rt.look.worldW = place.worldW;
    rt.look.worldH = place.worldH;
    if (!rt.look.framed) rt.look.framed = true;
    clampLook(rt.look);
    ctx.save();
    ctx.translate(-rt.look.x, -rt.look.y);
    rt.stones.forEach((stone, index) => {
      const home = place.homes[index];
      if (!home) return;
      stone.homeX = home.x;
      stone.homeY = home.y;
      if (rt.held === "stone" && rt.stoneId === stone.id) return;
      if (rt.sequence && stone.value === 8) {
        stone.x = place.slot.x + place.slot.w / 2;
        stone.y = place.slot.y + place.slot.h / 2;
        return;
      }
      if (stone.x === 0 && stone.y === 0) {
        stone.x = home.x;
        stone.y = home.y;
      }
    });

    const progress = bridgeProgress(rt.lengthA, rt.lengthB);
    const turned = isQuarterTurn(rt.angle);
    const solved = progress > 0.92 && rt.sequence && turned && onlineRef.current;
    const sky = ctx.createLinearGradient(0, 0, 0, place.worldH);
    sky.addColorStop(0, "#14110e");
    sky.addColorStop(1, "#2a2218");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, place.worldW, place.worldH);

    ctx.strokeStyle = "rgba(214, 186, 130, 0.35)";
    ctx.lineWidth = 1;
    const vanishX = place.worldW * 0.5;
    const vanishY = place.worldH * 0.16;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo((i / 8) * place.worldW, place.worldH);
      ctx.stroke();
    }

    if (rt.shear > 0) {
      ctx.fillStyle = "#f6f1e6";
      ctx.beginPath();
      ctx.ellipse(place.originA.x + 20, place.originA.y - 70, 18, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(place.originA.x + 78, place.originA.y - 70, 18, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#140e0a";
      ctx.beginPath();
      ctx.arc(place.originA.x + 20, place.originA.y - 70, 4, 0, Math.PI * 2);
      ctx.arc(place.originA.x + 78, place.originA.y - 70, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(244, 236, 220, 0.8)";
      ctx.font = `18px ${rt.fonts.hand}`;
      ctx.textAlign = "left";
      ctx.fillText("I will kill you.", place.originA.x + 108, place.originA.y - 64);
    }

    ctx.fillStyle = "#070605";
    ctx.beginPath();
    ctx.moveTo(place.gap.x, place.gap.y + 18);
    ctx.lineTo(place.gap.x + place.gap.w, place.gap.y + 18);
    ctx.lineTo(place.gap.x + place.gap.w - 36, place.gap.y + 110);
    ctx.lineTo(place.gap.x + 36, place.gap.y + 110);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(36, place.worldH * 0.12);
    ctx.transform(1, 0, rt.shear * 0.02, 1, 0, 0);
    ctx.fillStyle = "#2c261f";
    ctx.fillRect(0, 0, 26, place.worldH * 0.78);
    ctx.fillStyle = "#4a4034";
    ctx.fillRect(-6, 0, 38, 10);
    ctx.restore();
    ctx.save();
    ctx.translate(place.worldW - 70, place.worldH * 0.12);
    ctx.transform(1, 0, -rt.shear * 0.02, 1, 0, 0);
    ctx.fillStyle = "#2c261f";
    ctx.fillRect(0, 0, 26, place.worldH * 0.78);
    ctx.fillStyle = "#4a4034";
    ctx.fillRect(-6, 0, 38, 10);
    ctx.restore();

    const planks = Math.round(progress * 8);
    for (let i = 0; i < planks; i += 1) {
      ctx.fillStyle = `rgba(232, 214, 180, ${0.35 + i * 0.06})`;
      ctx.fillRect(place.gap.x + i * (place.gap.w / 8), place.gap.y, place.gap.w / 8 - 4, 14);
    }
    ctx.strokeStyle = "rgba(232, 214, 180, 0.4)";
    ctx.strokeRect(place.gap.x, place.gap.y, place.gap.w, place.gap.h);

    drawBeam(ctx, place.originA.x, place.originA.y, rt.lengthA, rt.fonts, "a");
    drawBeam(ctx, place.originB.x, place.originB.y, rt.lengthB, rt.fonts, "b");
    const ratio = Math.max(rt.lengthA, rt.lengthB) / Math.max(1, Math.min(rt.lengthA, rt.lengthB));
    ctx.fillStyle = progress > 0.92 ? "#f0d7a4" : "rgba(244, 236, 220, 0.8)";
    ctx.font = `16px ${rt.fonts.mono}`;
    ctx.textAlign = "left";
    ctx.fillText(progress > 0.92 ? `${ratio.toFixed(3)}  φ` : ratio.toFixed(3), place.originA.x, place.originA.y - 18);

    ctx.strokeStyle = rt.sequence ? "rgba(232, 214, 180, 0.9)" : "rgba(232, 214, 180, 0.35)";
    ctx.strokeRect(place.slot.x, place.slot.y, place.slot.w, place.slot.h);
    ctx.font = `18px ${rt.fonts.display}`;
    ctx.fillStyle = "rgba(244,236,220,0.75)";
    ctx.textAlign = "left";
    ctx.fillText("1   1   2   3   5", Math.max(12, place.slot.x - 168), place.slot.y - 14);
    if (!rt.sequence) {
      ctx.font = `13px ${rt.fonts.hand}`;
      ctx.textAlign = "center";
      ctx.fillText("next", place.slot.x + place.slot.w / 2, place.slot.y + place.slot.h / 2 + 4);
    }

    for (const stone of rt.stones) {
      ctx.beginPath();
      ctx.arc(stone.x, stone.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = stone.value === 8 && rt.sequence ? "#e7d3a4" : "#d9c7a2";
      ctx.fill();
      ctx.fillStyle = "#241c14";
      ctx.font = `20px ${rt.fonts.display}`;
      ctx.textAlign = "center";
      ctx.fillText(String(stone.value), stone.x, stone.y + 7);
    }

    const turn = place.turn;
    ctx.save();
    ctx.translate(turn.x, turn.y);
    ctx.rotate(rt.angle);
    ctx.strokeStyle = "rgba(244, 236, 220, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.fillStyle = "#f3ead8";
    ctx.beginPath();
    ctx.arc(34, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(turn.x, turn.y);
    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = "rgba(244, 236, 220, 0.28)";
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.setLineDash([]);
    ctx.restore();
    ctx.fillStyle = "rgba(244,236,220,0.7)";
    ctx.font = `14px ${rt.fonts.hand}`;
    ctx.textAlign = "center";
    ctx.fillText("turn it a quarter", turn.x, turn.y + 70);

    ctx.fillStyle = solved ? "rgba(255, 196, 130, 0.55)" : "#1a1612";
    ctx.fillRect(place.door.x, place.door.y, place.door.w, place.door.h);
    ctx.strokeStyle = solved ? "#e7c48a" : "#6a5844";
    ctx.strokeRect(place.door.x, place.door.y, place.door.w, place.door.h);
    ctx.fillStyle = "rgba(244,236,220,0.85)";
    ctx.font = `13px ${rt.fonts.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(solved ? "open" : "shut", place.door.x + place.door.w / 2, place.door.y + place.door.h - 16);

    for (const item of place.plates) {
      const open = rt.found.has(item.id) || (item.id === "bridge" && progress > 0.92) || (item.id === "sequence" && rt.sequence) || (item.id === "turn" && turned);
      ctx.fillStyle = open ? "rgba(243, 234, 216, 0.92)" : "rgba(243, 234, 216, 0.18)";
      ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.fillStyle = open ? "#241c14" : "rgba(244,236,220,0.7)";
      ctx.font = `14px ${rt.fonts.hand}`;
      ctx.textAlign = "left";
      ctx.fillText(open ? "a note" : "—", item.x + 10, item.y + 22);
    }

    for (const relic of relicRects(place.worldW, place.worldH)) {
      const open = rt.found.has(relic.id);
      ctx.fillStyle = relic.id === "kill" ? "rgba(90, 20, 16, 0.85)" : open ? "rgba(243, 234, 216, 0.92)" : "rgba(243, 234, 216, 0.2)";
      ctx.fillRect(relic.x, relic.y, relic.w, relic.h);
      ctx.fillStyle = relic.id === "kill" ? "#f6e6dc" : open ? "#241c14" : "rgba(244,236,220,0.75)";
      ctx.font = `14px ${rt.fonts.hand}`;
      ctx.textAlign = "center";
      const label = relic.id === "stare" ? "look" : relic.id === "kill" ? "the line" : relic.id === "obgyn" ? "OB/GYN" : relic.id;
      ctx.fillText(label, relic.x + relic.w / 2, relic.y + 25);
      if (relic.id === "stare") {
        ctx.fillStyle = "#f4efe6";
        ctx.beginPath();
        ctx.ellipse(relic.x + 28, relic.y - 16, 10, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(relic.x + 58, relic.y - 16, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#140e0a";
        ctx.beginPath();
        ctx.arc(relic.x + 28, relic.y - 16, 3, 0, Math.PI * 2);
        ctx.arc(relic.x + 58, relic.y - 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    if (rt.stare > 0) {
      ctx.fillStyle = "rgba(6, 4, 3, 0.78)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#f6f1e6";
      ctx.beginPath();
      ctx.ellipse(width * 0.4, height * 0.42, 54, 34, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.6, height * 0.42, 54, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#140e0a";
      ctx.beginPath();
      ctx.arc(width * 0.4, height * 0.42, 10, 0, Math.PI * 2);
      ctx.arc(width * 0.6, height * 0.42, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#d7f5d4";
    ctx.font = `14px ${rt.fonts.mono}`;
    ctx.textAlign = "left";
    ctx.fillText(`${HOURS[hour] ?? ""}   ONLINE`, 24, height - 24);
    if (progress > 0.92 && rt.look.x < 24) {
      ctx.fillStyle = "rgba(240, 215, 164, 0.9)";
      ctx.fillRect(width - 8, height * 0.4, 8, 80);
    }
    if (!rt.look.looked) {
      ctx.fillStyle = "rgba(244, 236, 220, 0.78)";
      ctx.font = `16px ${rt.fonts.hand}`;
      ctx.textAlign = "left";
      ctx.fillText("Drag the floor. The rest of the room is further along.", 22, 36);
    }
    if (rt.line && rt.stare !== 1) drawSlip(ctx, rt.line.text, rt.fonts.hand, width, height);
    const status =
      (rt.stare === 1 ? "" : rt.line?.text) ||
      rt.notice ||
      (solved ? "The door is open." : "The room is still waiting on the lengths, the number, and the turn.");
    if (status !== announced.current) {
      announced.current = status;
      setAnnounce(status);
    }
  });

  function pointOf(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  }

  function openRelic(id: string) {
    const rt = runtime();
    const memory = teacher.memories.find((item) => item.id === id);
    const lines = memory?.lines ?? [];
    if (id === "stare") {
      rt.stare += 1;
      if (rt.stare === 1) {
        rt.line = null;
        sound.duck(0.04);
        return;
      }
      if (rt.stare === 2) {
        rt.line = { id, index: 0, text: lines[0] ?? "Yep." };
        sound.page();
        return;
      }
      rt.found.add("stare");
      rt.line = { id, index: 1, text: lines[1] ?? "That stare." };
      rt.stare = 3;
      sound.duck(1);
      sound.page();
      return;
    }
    if (id === "kill") {
      rt.found.add("kill");
      rt.stare = 0;
      rt.line = { id, index: 0, text: lines[0] ?? "And of course, I could never forget your iconic 'I will kill you.'" };
      sound.page();
      return;
    }
    rt.stare = 0;
    rt.found.add(id);
    if (!rt.line || rt.line.id !== id) {
      rt.line = { id, index: 0, text: lines[0] ?? "" };
    } else {
      const next = rt.line.index + 1;
      rt.line = next >= lines.length ? null : { id, index: next, text: lines[next] ?? "" };
    }
    sound.page();
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const place = layout(point.width, point.height);
    rt.held = null;
    rt.stoneId = null;
    rt.look.panning = false;
    const handleA = { x: place.originA.x + rt.lengthA, y: place.originA.y };
    const handleB = { x: place.originB.x + rt.lengthB, y: place.originB.y };
    if (Math.hypot(world.x - handleA.x, world.y - handleA.y) < 18) rt.held = "a";
    else if (Math.hypot(world.x - handleB.x, world.y - handleB.y) < 18) rt.held = "b";
    else if (Math.hypot(world.x - place.turn.x, world.y - place.turn.y) < 64) rt.held = "turn";
    else {
      const stone = [...rt.stones].reverse().find((item) => Math.hypot(world.x - item.x, world.y - item.y) < 28);
      if (stone && !(rt.sequence && stone.value === 8)) {
        rt.held = "stone";
        rt.stoneId = stone.id;
      }
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    rt.grabX = world.x;
    rt.grabY = world.y;
    if (!rt.held) startPan(rt.look, point.x, point.y);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    if (rt.look.panning) {
      dragPan(rt.look, point.x, point.y);
      return;
    }
    if (!rt.held) return;
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const place = layout(point.width, point.height);
    if (rt.held === "a") rt.lengthA = Math.min(280, Math.max(48, world.x - place.originA.x));
    if (rt.held === "b") rt.lengthB = Math.min(280, Math.max(48, world.x - place.originB.x));
    if (rt.held === "turn") rt.angle = Math.atan2(world.y - place.turn.y, world.x - place.turn.x);
    if (rt.held === "stone") {
      const stone = rt.stones.find((item) => item.id === rt.stoneId);
      if (stone) {
        stone.x = world.x;
        stone.y = world.y;
      }
    }
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    const panned = stopPan(rt.look, point.x, point.y);
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const place = layout(point.width, point.height);
    const held = rt.held;
    rt.held = null;
    if (panned) return;
    if (held === "stone") {
      const stone = rt.stones.find((item) => item.id === rt.stoneId);
      const slot = place.slot;
      const inside =
        stone &&
        stone.x > slot.x &&
        stone.x < slot.x + slot.w &&
        stone.y > slot.y &&
        stone.y < slot.y + slot.h;
      if (stone && inside && stone.value === 8) {
        rt.sequence = true;
        rt.shear = 0;
      } else if (stone && inside) {
        rt.shear = Math.min(18, rt.shear + 6);
        stone.x = stone.homeX;
        stone.y = stone.homeY;
        rt.notice = "I will kill you.";
        announced.current = "";
      } else if (stone && !rt.sequence) {
        stone.x = stone.homeX;
        stone.y = stone.homeY;
      }
    }
    rt.stoneId = null;

    const relic = relicRects(place.worldW, place.worldH).find(
      (item) => world.x >= item.x && world.x <= item.x + item.w && world.y >= item.y && world.y <= item.y + item.h,
    );
    if (relic && !held) {
      openRelic(relic.id);
      return;
    }

    const progress = bridgeProgress(rt.lengthA, rt.lengthB);
    const turned = isQuarterTurn(rt.angle);
    const hitPlate = place.plates.find(
      (item) => world.x >= item.x && world.x <= item.x + item.w && world.y >= item.y && world.y <= item.y + item.h,
    );
    if (hitPlate && !held) {
      const ready =
        (hitPlate.id === "bridge" && progress > 0.92) ||
        (hitPlate.id === "sequence" && rt.sequence) ||
        (hitPlate.id === "turn" && turned);
      if (ready) {
        const memory = teacher.memories.find((item) => item.id === hitPlate.id);
        const lines = memory?.lines ?? [];
        rt.found.add(hitPlate.id);
        if (!rt.line || rt.line.id !== hitPlate.id) {
          rt.line = { id: hitPlate.id, index: 0, text: lines[0] ?? "" };
        } else {
          const next = rt.line.index + 1;
          rt.line = next >= lines.length ? null : { id: hitPlate.id, index: next, text: lines[next] ?? "" };
        }
        sound.page();
      }
    }
    const inDoor =
      world.x >= place.door.x &&
      world.x <= place.door.x + place.door.w &&
      world.y >= place.door.y &&
      world.y <= place.door.y + place.door.h;
    if (inDoor && !held) {
      if (progress > 0.92 && rt.sequence && turned && onlineRef.current) {
        sound.duck(0.14);
        setShowFinale(true);
      }
      else {
        rt.notice = onlineRef.current
          ? "The door is part of the room. The lengths, the number, and the turn still have to move it."
          : "The clock is still online. Change the hour.";
        announced.current = "";
      }
    }
  }

  return (
    <div className={`lab-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag the floor to move through the room. Drag the ends of the two lengths until the longer
        divided by the shorter is the golden ratio. Further along, drag the next number into the gap
        and turn the square a quarter. The clock stays online. Change the hour.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="The impossible room"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
      <div className="desk-clock">
        <button
          type="button"
          onClick={() => {
            const next = (hour + 1) % HOURS.length;
            const seen = seenHours.includes(next) ? seenHours : [...seenHours, next];
            setHour(next);
            setSeenHours(seen);
            if (seen.length >= HOURS.length) {
              const rt = runtime();
              rt.found.add("online");
              rt.line = { id: "online", index: 0, text: "You're somehow always online whenever I text you, and I'm still trying to figure out how." };
              sound.page();
            }
          }}
        >
          {HOURS[hour]}
        </button>
        <span>Online</span>
      </div>
      {showFinale ? <Sequence kind="sun" lines={teacher.finale} onDone={onEnterMemory} /> : null}
    </div>
  );
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  fonts: Fonts,
  label: string,
) {
  ctx.fillStyle = "#cbb892";
  ctx.fillRect(x, y - 5, length, 10);
  ctx.beginPath();
  ctx.arc(x + length, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#f3ead8";
  ctx.fill();
  ctx.fillStyle = "#241c14";
  ctx.font = `12px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText(label, x + length, y + 4);
}
