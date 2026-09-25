import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useOSStore } from "../store/useOSStore";
import {
  useAccent,
  useActiveAppId,
  useMinimizedAppIds,
  useOpenAppIds,
  useWindowActions,
} from "../store/selectors";
import { useAllApps } from "../os/appResolve";
import StartMenu from "./StartMenu";
import { cn } from "../utils/cn";

export default function Taskbar() {
  /*
   * Every subscription here is a primitive or an array of primitives, so a
   * drag / resize (which only mutates position + size) yields an identical
   * snapshot and the whole dock skips re-rendering.
   */
  const openAppIds = useOpenAppIds();
  const minimizedAppIds = useMinimizedAppIds();
  const activeAppId = useActiveAppId();
  const accent = useAccent();
  const { openWindow, focusWindow, restoreWindow, minimizeWindow } =
    useWindowActions();

  const [startOpen, setStartOpen] = useState(false);

  /** built-ins + App Store installs — reactive, updates on install */
  const installed = useAllApps();

  const openSet = useMemo(() => new Set(openAppIds), [openAppIds]);
  const minimizedSet = useMemo(
    () => new Set(minimizedAppIds),
    [minimizedAppIds]
  );

  /** open → focus → restore → minimize (docked icon semantics) */
  const handleAppClick = useCallback(
    (appId: string) => {
      setStartOpen(false);
      // read the window record imperatively — no subscription, no re-render
      const win = useOSStore.getState().windows.find((w) => w.appId === appId);
      if (!win) return openWindow(appId);
      if (win.isMinimized) return restoreWindow(win.id);
      if (useOSStore.getState().activeWindowId === win.id)
        return minimizeWindow(win.id);
      focusWindow(win.id);
    },
    [openWindow, restoreWindow, minimizeWindow, focusWindow]
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[6000] flex justify-center">
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.15 }}
          /* nearly-solid fill instead of backdrop-blur-2xl — windows
             animate underneath the dock (genie minimize targets it), and a
             live blur here re-sampled them every frame = visible flicker */
          className="pointer-events-auto flex items-end gap-1.5 rounded-[1.5rem] border border-white/[0.12] px-2.5 py-2 shadow-[0_28px_70px_-14px_rgba(0,0,0,0.8)]"
          style={{ background: "rgb(8 8 10 / 0.82)" }}
        >
          {/* start button */}
          <motion.button
            whileHover={{ y: -7, scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={() => setStartOpen((v) => !v)}
            className="group relative shrink-0"
            aria-label="Start"
          >
            <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-950/90 px-2.5 py-1 text-[10.5px] whitespace-nowrap text-white/80 opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
              Start
            </span>
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 font-display text-base font-bold text-white ring-1 ring-white/25 transition-shadow duration-300",
                startOpen
                  ? "shadow-[0_0_28px_rgba(168,85,247,0.55)]"
                  : "shadow-lg shadow-fuchsia-500/20"
              )}
            >
              K
            </span>
          </motion.button>

          <span className="mx-0.5 h-8 w-px shrink-0 self-center bg-white/10" />

          {/* app icons — registry-driven */}
          {installed.map((manifest) => {
            const isOpen = openSet.has(manifest.id);
            const isActive =
              isOpen &&
              activeAppId === manifest.id &&
              !minimizedSet.has(manifest.id);

            return (
              <motion.button
                key={manifest.id}
                whileHover={{ y: -7, scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                onClick={() => handleAppClick(manifest.id)}
                className="group relative shrink-0 pb-1.5"
                aria-label={manifest.name}
              >
                <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-950/90 px-2.5 py-1 text-[10.5px] whitespace-nowrap text-white/80 opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
                  {manifest.name}
                  <span className="ml-1.5 font-mono text-[9px] text-white/30">
                    v{manifest.version}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white ring-1 ring-white/20 transition-all duration-300",
                    manifest.tile ?? "from-zinc-500 to-zinc-700",
                    isOpen ? "shadow-lg" : "opacity-70 saturate-[0.75] hover:opacity-100 hover:saturate-100"
                  )}
                  style={{
                    boxShadow: isActive
                      ? `0 0 0 1px ${accent}77, 0 10px 26px -6px ${accent}66`
                      : undefined,
                  }}
                >
                  <manifest.icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                {/* running indicator */}
                <span
                  className="absolute bottom-0 left-1/2 h-1 -translate-x-1/2 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 14 : isOpen ? 5 : 0,
                    opacity: isOpen ? 1 : 0,
                    background: isActive ? accent : "rgba(255,255,255,0.45)",
                    boxShadow: isActive ? `0 0 8px ${accent}` : undefined,
                  }}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} />
    </>
  );
}
