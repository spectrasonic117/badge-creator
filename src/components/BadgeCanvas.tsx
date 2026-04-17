import { useEffect, useRef, useState } from "react";
import type { BadgeConfig } from "@/lib/badge-utils";
import { renderBadge } from "@/lib/badge-utils";

type Props = {
  config: BadgeConfig;
  onSize?: (w: number, h: number) => void;
};

export function BadgeCanvas({ config, onSize }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const { width, height } = renderBadge(canvasRef.current, config);
    setSize({ w: width, h: height });
    onSize?.(width, height);
  }, [config, onSize]);

  // Auto scale: aim for ~12x preview, clamp so it fits in viewport
  const scale = Math.max(4, Math.min(16, Math.floor(720 / Math.max(size.w, 1))));

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Top label */}
      <div className="pointer-events-none flex items-center justify-center pt-6">
        <span
          className="text-xs uppercase tracking-[0.4em] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono-pixel)" }}
        >
          Preview · {scale}× scale
        </span>
      </div>

      {/* Center canvas area */}
      <div className="checker-grid relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="accent-glow rounded-md p-1 transition-shadow duration-500">
          <canvas
            ref={canvasRef}
            className="pixelated block"
            style={{
              width: size.w * scale,
              height: size.h * scale,
              imageRendering: "pixelated",
            }}
          />
        </div>
      </div>

      {/* Bottom size readout */}
      <div className="pointer-events-none flex items-center justify-center pb-6">
        <div
          className="rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs tracking-widest text-muted-foreground backdrop-blur"
          style={{ fontFamily: "var(--font-mono-pixel)" }}
        >
          {size.w} × {size.h} px
        </div>
      </div>
    </div>
  );
}
