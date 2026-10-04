import { useEffect, useRef } from "react";

export function useStage(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bitmapW = Math.floor(width * dpr);
      const bitmapH = Math.floor(height * dpr);
      if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
        canvas.width = bitmapW;
        canvas.height = bitmapH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, width, height, dt);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return ref;
}

export type Fonts = { display: string; mono: string; hand: string };

export function readFonts(): Fonts {
  const styles = getComputedStyle(document.documentElement);
  return {
    display: styles.getPropertyValue("--font-display-face").trim() || "Georgia",
    mono: styles.getPropertyValue("--font-mono-face").trim() || "monospace",
    hand: styles.getPropertyValue("--font-hand").trim() || "Georgia",
  };
}
