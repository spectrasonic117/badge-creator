import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { ControlPanel } from "@/components/ControlPanel";
import { BadgeCanvas } from "@/components/BadgeCanvas";
import type { BadgeConfig } from "@/lib/badge-utils";
import { hexToOklch, renderBadge } from "@/lib/badge-utils";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Badge Forge — Minecraft Rank Badge Generator" },
      {
        name: "description",
        content:
          "Design pixel-perfect Minecraft-style rank badges. Customize text, gradients, padding, shadow and export PNGs instantly.",
      },
    ],
  }),
});

const DEFAULT_CONFIG: BadgeConfig = {
  text: "ADMIN",
  padding: { l: 4, r: 4, t: 2, b: 2 },
  gradientDirection: "horizontal",
  bgStart: "#FF3333",
  bgEnd: "#CC0000",
  textColor: "#FFFFFF",
  shadowEnabled: true,
  shadowColor: "#660000",
};

function Index() {
  const [config, setConfig] = useState<BadgeConfig>(DEFAULT_CONFIG);

  // Drive accent color dynamically from the badge's start gradient color.
  useEffect(() => {
    const { l, c, h } = hexToOklch(config.bgStart);
    const root = document.documentElement;
    // Boost lightness/chroma slightly so accent reads on dark UI
    const accentL = Math.min(0.78, Math.max(0.55, l + 0.05));
    const accentC = Math.min(0.22, c);
    root.style.setProperty("--accent-l", accentL.toString());
    root.style.setProperty("--accent-s", accentC.toString());
    root.style.setProperty("--accent-h", h.toString());
  }, [config.bgStart]);

  const handleDownload = () => {
    const off = document.createElement("canvas");
    renderBadge(off, config);
    // Upscale 12x for a chunky export
    const SCALE = 12;
    const scaled = document.createElement("canvas");
    scaled.width = off.width * SCALE;
    scaled.height = off.height * SCALE;
    const sctx = scaled.getContext("2d")!;
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(off, 0, 0, scaled.width, scaled.height);
    const url = scaled.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.text.toLowerCase() || "badge"}.png`;
    a.click();
  };

  const memoConfig = useMemo(() => config, [config]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground dark">
      <ControlPanel config={memoConfig} setConfig={setConfig} />

      <main className="relative flex-1">
        <BadgeCanvas config={memoConfig} />

        {/* Floating download FAB */}
        <button
          onClick={handleDownload}
          aria-label="Download badge"
          className="group absolute right-6 top-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-2 ring-accent/40 transition-all hover:scale-110 hover:shadow-2xl"
          style={{
            boxShadow:
              "0 10px 30px -10px color-mix(in oklab, var(--accent) 60%, transparent)",
          }}
        >
          <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
        </button>
      </main>
    </div>
  );
}
