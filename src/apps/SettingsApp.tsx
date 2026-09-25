import {
  Check,
  Cpu,
  Layers,
  Monitor,
  Paintbrush,
  Settings,
  Wind,
} from "lucide-react";
import { ACCENTS, WALLPAPERS, useOSStore } from "../store/useOSStore";
import { defineApp } from "../os/AppRegistry";
import { cn } from "../utils/cn";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Monitor;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <h3 className="text-[11px] font-semibold tracking-widest text-white/45 uppercase">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export default function SettingsApp() {
  const wallpaper = useOSStore((s) => s.wallpaper);
  const setWallpaper = useOSStore((s) => s.setWallpaper);
  const accent = useOSStore((s) => s.accent);
  const setAccent = useOSStore((s) => s.setAccent);

  const sysRows: [string, string][] = [
    ["system", "klork.os 25.11 · phase 1"],
    ["window engine", "react-rnd + framer-motion"],
    ["state", "zustand"],
    ["styling", "tailwind css v4"],
    ["icons", "lucide"],
  ];

  return (
    <div className="h-full space-y-6 overflow-y-auto p-5">
      <Section title="Wallpaper" icon={Monitor}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {WALLPAPERS.map((w) => {
            const isSel = wallpaper === w.path;
            return (
              <button
                key={w.path}
                onClick={() => setWallpaper(w.path)}
                className="group text-left"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-[1.03]",
                    !isSel && "opacity-70 group-hover:opacity-100"
                  )}
                  style={{
                    boxShadow: isSel ? `0 0 0 2px ${accent}` : undefined,
                  }}
                >
                  <img
                    src={w.path}
                    alt={w.name}
                    className="aspect-[16/10] w-full object-cover"
                    draggable={false}
                  />
                  {isSel && (
                    <div
                      className="absolute top-1.5 right-1.5 grid h-4.5 w-4.5 place-items-center rounded-full"
                      style={{ background: accent }}
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1.5 text-[10.5px]",
                    isSel ? "text-white/85" : "text-white/40"
                  )}
                >
                  {w.name}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Accent color" icon={Paintbrush}>
        <div className="flex items-center gap-2.5">
          {ACCENTS.map((a) => {
            const isSel = accent === a.hex;
            return (
              <button
                key={a.hex}
                onClick={() => setAccent(a.hex)}
                title={a.name}
                aria-label={a.name}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition-transform duration-150 hover:scale-110",
                  isSel && "ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-950"
                )}
                style={{
                  background: `linear-gradient(135deg, ${a.hex}, ${a.hex}99)`,
                  boxShadow: isSel ? `0 0 16px ${a.hex}66` : undefined,
                }}
              >
                {isSel && (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                )}
              </button>
            );
          })}
          <span className="ml-1 font-mono text-[10px] text-white/35">
            {accent}
          </span>
        </div>
      </Section>

      <Section title="System" icon={Cpu}>
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
          {sysRows.map(([k, v], i) => (
            <div
              key={k}
              className={cn(
                "flex items-center justify-between px-3.5 py-2",
                i !== sysRows.length - 1 && "border-b border-white/[0.05]"
              )}
            >
              <span className="text-[11.5px] text-white/45">{k}</span>
              <span className="font-mono text-[10.5px] text-white/70">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-white/[0.05] px-3.5 py-2">
            <span className="text-[11.5px] text-white/45">motion</span>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-300/80">
              <Wind className="h-3 w-3" />
              60fps springs
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.05] px-3.5 py-2">
            <span className="text-[11.5px] text-white/45">window layers</span>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-white/70">
              <Layers className="h-3 w-3 text-white/40" />
              z-managed
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "settings",
    name: "Settings",
    icon: Settings,
    version: "1.2.0",
    defaultSize: { width: 660, height: 520 },
    tile: "from-zinc-400 to-zinc-600",
  },
  Component: SettingsApp,
});
