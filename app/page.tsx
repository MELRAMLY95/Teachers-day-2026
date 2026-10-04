"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(
  () => import("@/components/experience").then((mod) => mod.Experience),
  {
    ssr: false,
    loading: () => <main className="gate" aria-label="Opening" />,
  },
);

export default function Home() {
  return <Experience />;
}
