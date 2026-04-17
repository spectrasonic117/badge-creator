import type { BadgeConfig, GradientStop } from "@/lib/badge-utils";
import { GRADIENT_PRESETS, stopsToCss } from "@/lib/badge-utils";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  config: BadgeConfig;
  setConfig: (c: BadgeConfig) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "13px", letterSpacing: "0.25em" }}
    >
      {children}
    </div>
  );
}

function PaddingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-3 text-xs text-muted-foreground"
        style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
      >
        {label}
      </span>
      <Slider
        value={[value]}
        min={0}
        max={16}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        className="flex-1"
      />
      <span
        className="w-5 text-right text-xs text-foreground"
        style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
      >
        {value}
      </span>
    </div>
  );
}

function stopsEqual(a: GradientStop[], b: GradientStop[]) {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.color.toLowerCase() === b[i].color.toLowerCase() && Math.abs(s.pos - b[i].pos) < 0.001);
}

export function ControlPanel({ config, setConfig }: Props) {
  const update = <K extends keyof BadgeConfig>(key: K, value: BadgeConfig[K]) =>
    setConfig({ ...config, [key]: value });

  const updatePadding = (side: keyof BadgeConfig["padding"], value: number) =>
    setConfig({ ...config, padding: { ...config.padding, [side]: value } });

  const updateStop = (index: number, patch: Partial<GradientStop>) => {
    const next = config.gradientStops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setConfig({ ...config, gradientStops: next });
  };

  const addStop = () => {
    if (config.gradientStops.length >= 6) return;
    const sorted = [...config.gradientStops].sort((a, b) => a.pos - b.pos);
    // Insert in the largest gap
    let bestGap = 0;
    let bestPos = 0.5;
    let bestColor = sorted[0].color;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].pos - sorted[i].pos;
      if (gap > bestGap) {
        bestGap = gap;
        bestPos = (sorted[i].pos + sorted[i + 1].pos) / 2;
        bestColor = sorted[i].color;
      }
    }
    setConfig({ ...config, gradientStops: [...config.gradientStops, { color: bestColor, pos: bestPos }] });
  };

  const removeStop = (index: number) => {
    if (config.gradientStops.length <= 2) return;
    setConfig({
      ...config,
      gradientStops: config.gradientStops.filter((_, i) => i !== index),
    });
  };

  const previewAngle = config.gradientDirection === "horizontal" ? 180 : 90;

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-border bg-panel p-6">
      {/* Logo / title */}
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
          <span style={{ fontFamily: "var(--font-pixel)", fontSize: "11px" }}>B</span>
        </div>
        <div>
          <h1
            className="text-sm text-foreground"
            style={{ fontFamily: "var(--font-pixel)", fontSize: "11px" }}
          >
            BADGE FORGE
          </h1>
          <p className="text-[10px] text-muted-foreground">Minecraft rank generator</p>
        </div>
      </div>

      {/* Badge text */}
      <div>
        <SectionLabel>Badge Text</SectionLabel>
        <Input
          value={config.text}
          maxLength={16}
          onChange={(e) => update("text", e.target.value.toUpperCase())}
          className="h-11 border-border bg-input text-center text-foreground"
          style={{ fontFamily: "var(--font-pixel)", fontSize: "13px", letterSpacing: "0.15em" }}
        />
      </div>

      {/* Padding */}
      <div className="space-y-3">
        <SectionLabel>Padding</SectionLabel>
        <PaddingRow label="L" value={config.padding.l} onChange={(v) => updatePadding("l", v)} />
        <PaddingRow label="R" value={config.padding.r} onChange={(v) => updatePadding("r", v)} />
        <PaddingRow label="T" value={config.padding.t} onChange={(v) => updatePadding("t", v)} />
        <PaddingRow label="B" value={config.padding.b} onChange={(v) => updatePadding("b", v)} />
      </div>

      {/* Corner radius (pixel-art) */}
      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Corner Radius</SectionLabel>
          <span
            className="mb-3 text-xs text-foreground"
            style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
          >
            {config.cornerRadius}px
          </span>
        </div>
        <Slider
          value={[config.cornerRadius]}
          min={0}
          max={12}
          step={1}
          onValueChange={(v) => update("cornerRadius", v[0])}
        />
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Square</span>
          <span>Round</span>
        </div>
      </div>

      {/* Gradient direction */}
      <div>
        <SectionLabel>Gradient Direction</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {(["horizontal", "vertical"] as const).map((dir) => {
            const active = config.gradientDirection === dir;
            return (
              <button
                key={dir}
                onClick={() => update("gradientDirection", dir)}
                className={cn(
                  "h-10 rounded-md border text-xs capitalize transition-all",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground",
                )}
              >
                {dir === "horizontal" ? "↕ Horizontal" : "↔ Vertical"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gradient Presets */}
      <div>
        <SectionLabel>Gradient Presets</SectionLabel>
        <div className="grid grid-cols-7 gap-2">
          {GRADIENT_PRESETS.map((p) => {
            const isActive = stopsEqual(config.gradientStops, p.stops);
            return (
              <button
                key={p.name}
                title={p.name}
                onClick={() => setConfig({ ...config, gradientStops: p.stops.map((s) => ({ ...s })) })}
                className={cn(
                  "aspect-square rounded-md ring-1 transition-all",
                  isActive
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-panel"
                    : "ring-border hover:scale-105",
                )}
                style={{
                  background: stopsToCss(p.stops, 180),
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Gradient Preview */}
      <div>
        <SectionLabel>Gradient Preview</SectionLabel>
        <div
          className="h-3 w-full rounded-full ring-1 ring-border"
          style={{ background: stopsToCss(config.gradientStops, previewAngle) }}
        />
      </div>

      {/* Gradient Stops (multi-color) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Gradient Colors</SectionLabel>
          <button
            onClick={addStop}
            disabled={config.gradientStops.length >= 6}
            className={cn(
              "mb-3 flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-all",
              "hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {config.gradientStops.map((stop, i) => (
            <StopRow
              key={i}
              stop={stop}
              canRemove={config.gradientStops.length > 2}
              onChange={(patch) => updateStop(i, patch)}
              onRemove={() => removeStop(i)}
            />
          ))}
        </div>
      </div>

      {/* Text color */}
      <div className="space-y-3">
        <SectionLabel>Text Color</SectionLabel>
        <ColorRow label="Text" value={config.textColor} onChange={(v) => update("textColor", v)} />
      </div>

      {/* Shadow */}
      <div className="space-y-3">
        <SectionLabel>Text Shadow</SectionLabel>
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
          <span className="text-xs text-foreground">Enable shadow</span>
          <Switch
            checked={config.shadowEnabled}
            onCheckedChange={(v) => update("shadowEnabled", v)}
          />
        </div>
        <ColorRow
          label="Shadow color"
          value={config.shadowColor}
          onChange={(v) => update("shadowColor", v)}
          disabled={!config.shadowEnabled}
        />
        <div
          className={cn(
            "rounded-md border border-border bg-card px-3 py-2",
            !config.shadowEnabled && "opacity-50",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Shadow alpha</span>
            <span
              className="text-xs text-foreground"
              style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
            >
              {Math.round(config.shadowAlpha * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round(config.shadowAlpha * 100)]}
            min={0}
            max={100}
            step={1}
            disabled={!config.shadowEnabled}
            onValueChange={(v) => update("shadowAlpha", v[0] / 100)}
          />
        </div>
      </div>
    </aside>
  );
}

function StopRow({
  stop,
  canRemove,
  onChange,
  onRemove,
}: {
  stop: GradientStop;
  canRemove: boolean;
  onChange: (patch: Partial<GradientStop>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-border">
        <span className="absolute inset-0" style={{ backgroundColor: stop.color }} />
        <input
          type="color"
          value={stop.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={stop.color.toUpperCase()}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ color: v });
            }}
            className="w-20 bg-transparent text-xs text-foreground outline-none"
            style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
          />
          <span
            className="text-[11px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "13px" }}
          >
            {Math.round(stop.pos * 100)}%
          </span>
        </div>
        <Slider
          value={[Math.round(stop.pos * 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onChange({ pos: v[0] / 100 })}
        />
      </div>
      <button
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove color stop"
        className={cn(
          "grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-all",
          "hover:border-destructive/60 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2",
        disabled && "opacity-50",
      )}
    >
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-border">
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <div className="flex flex-1 flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          disabled={disabled}
          className="bg-transparent text-xs text-foreground outline-none"
          style={{ fontFamily: "var(--font-mono-pixel)", fontSize: "14px" }}
        />
      </div>
    </div>
  );
}
