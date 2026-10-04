"use client";

import { Button } from "@/components/ui/button";

export function Onward({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" className="onward" onClick={onClick}>
      {children}
    </Button>
  );
}
