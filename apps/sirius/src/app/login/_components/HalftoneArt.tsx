"use client";

import HalftoneReveal from "@workspace/ui/components/halftone-reveal";

export function HalftoneArt() {
  return (
    <div className="absolute inset-0">
      <HalftoneReveal
        src="https://picsum.photos/seed/halftone-reveal/1200/800"
        inkColor="#141414"
        paperColor="#ffffff"
        mode="mono"
        dotDensity={71}
        angle={45}
        revealRadius={0.4}
        dotSize={1}
        shape="circle"
        contrast={1.15}
        invert={false}
        edge={0.8}
        follow={0.37}
        idleReveal={0}
        trigger="hover"
        borderRadius="0"
      />
    </div>
  );
}
