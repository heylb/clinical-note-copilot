"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const Playground = dynamic(() => import("@/components/playground/Playground").then((m) => m.Playground), {
  ssr: false,
});

export default function PlaygroundPage() {
  return <Playground />;
}
