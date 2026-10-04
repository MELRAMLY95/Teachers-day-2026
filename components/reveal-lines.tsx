"use client";

import { useEffect, useState } from "react";

export function RevealLines({
  lines,
  reducedMotion,
  children,
}: {
  lines: string[];
  reducedMotion: boolean;
  children?: (done: boolean) => React.ReactNode;
}) {
  const [count, setCount] = useState(reducedMotion ? lines.length : 0);
  const done = count >= lines.length;

  useEffect(() => {
    if (reducedMotion || done) return;
    const timer = window.setTimeout(() => setCount((value) => value + 1), count === 0 ? 500 : 1200);
    return () => window.clearTimeout(timer);
  }, [count, done, reducedMotion]);

  return (
    <>
      <div className="reveal" aria-live="polite">
        {lines.slice(0, count).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {children?.(done)}
    </>
  );
}
