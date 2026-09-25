import { memo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOSStore } from "../store/useOSStore";
import {
  useAnyWindowVisible,
  useIsMobileMode,
  useWallpaper,
  useWindowIds,
} from "../store/selectors";
import { useAllApps } from "../os/appResolve";
import type { AppManifest } from "../types/os";
import TopBar from "./TopBar";
import Taskbar from "./Taskbar";
import WindowFrame from "./WindowFrame";
import ContextMenu from "./ContextMenu";
import Notifications from "./Notifications";
import MobileHome from "./mobile/MobileHome";
import MobileDock from "./mobile/MobileDock";
import MobileStatusBar from "./mobile/MobileStatusBar";
import { cn } from "../utils/cn";

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/* ------------------------- desktop icon ------------------------- */

function DesktopIcon({
  manifest,
  index,
  selected,
  onSelect,
}: {
  manifest: AppManifest;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const openWindow = useOSStore((s) => s.openWindow);

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index + 0.3, duration: 0.5 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={() => openWindow(manifest.id)}
      className={cn(
        "flex w-[88px] flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-colors duration-150",
        selected
          ? "bg-white/15 ring-1 ring-white/30"
          : "hover:bg-white/[0.08]"
      )}
    >
      <div
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-xl ring-1 ring-white/25",
          manifest.tile ?? "from-zinc-500 to-zinc-700"
        )}
      >
        <manifest.icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
      </div>
      <span className="max-w-full truncate text-[10.5px] font-medium text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
        {manifest.name}
      </span>
    </motion.button>
  );
}

/* --------------------------- window layer -------------------------- */

/**
 * Isolated from the rest of the shell: it subscribes to the *ids* of open
 * windows only, so dragging, focusing, minimizing or resizing produces an
 * identical snapshot and this component does not re-render. Each frame
 * then selects its own record by id.
 */
const WindowLayer = memo(function WindowLayer({
  isMobile,
}: {
  isMobile: boolean;
}) {
  const windowIds = useWindowIds();

  /*
   * Mobile: `popLayout` pulls the exiting sheet out of flow immediately so
   * its unmount animation runs on its own compositor layer and can't stall
   * the re-render of whatever is revealed underneath.
   */
  if (isMobile) {
    return (
      <AnimatePresence mode="popLayout">
        {windowIds.map((id) => (
          <WindowFrame key={id} windowId={id} />
        ))}
      </AnimatePresence>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 z-20 overflow-hidden">
      <AnimatePresence>
        {windowIds.map((id) => (
          <WindowFrame key={id} windowId={id} />
        ))}
      </AnimatePresence>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Occlusion timing                                                   */
/*                                                                     */
/*  Hiding the wallpaper/home the instant a window opens would cut the */
/*  entry animation's backdrop away mid-flight. Instead we hide only   */
/*  once the sheet has covered the screen, and reveal immediately when */
/*  it starts leaving.                                                 */
/* ------------------------------------------------------------------ */

function useDeferredOcclusion(covered: boolean, delay = 300): boolean {
  const [occluded, setOccluded] = useState(false);

  useEffect(() => {
    if (!covered) {
      setOccluded(false); // reveal instantly
      return;
    }
    const t = setTimeout(() => setOccluded(true), delay);
    return () => clearTimeout(t);
  }, [covered, delay]);

  return occluded;
}

/* ---------------------------- desktop ---------------------------- */

export default function Desktop() {
  const wallpaper = useWallpaper();
  const isMobile = useIsMobileMode();
  const anyWindowVisible = useAnyWindowVisible();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  /** a full-screen mobile app is covering the shell → stop painting behind it */
  const occluded = useDeferredOcclusion(isMobile && anyWindowVisible);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);

  /** built-ins + App Store installs — reactive, updates on install */
  const installed = useAllApps();

  // welcome window — desktop only; mobile boots to the home screen
  useEffect(() => {
    if (isMobile) return;
    const t = setTimeout(() => {
      const s = useOSStore.getState();
      if (!s.isMobile && s.windows.length === 0) s.openWindow("about");
    }, 3300);
    return () => clearTimeout(t);
  }, [isMobile]);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black font-sans select-none"
      onClick={() => setSelectedIcon(null)}
      onContextMenu={(e) => {
        if (isMobile) return; // native long-press behaviour on touch
        e.preventDefault();
        setSelectedIcon(null);
        setCtx({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* wallpaper + atmosphere — fully removed from paint when occluded */}
      <div className={cn("absolute inset-0", occluded && "klork-occluded")}>
        <AnimatePresence>
          <motion.img
            key={wallpaper}
            src={wallpaper}
            alt=""
            draggable={false}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="klork-wallpaper absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_100%_at_50%_0%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* film grain — grayscale only; mix-blend-overlay would force the
          whole viewport to re-blend on every window-motion frame */}
      {!isMobile && (
        <div
          className="klork-grain pointer-events-none absolute inset-0 z-30"
          style={{ backgroundImage: NOISE }}
        />
      )}

      {/* ---------------------- system chrome ---------------------- */}
      {isMobile ? <MobileStatusBar /> : <TopBar />}

      {/* --------------------- app launch surface ------------------- */}
      {isMobile ? (
        /* stays mounted (keeps page/search state) but leaves the paint
           tree entirely while an app covers the screen */
        <MobileHome occluded={occluded} />
      ) : (
        <div className="absolute top-[52px] bottom-24 left-3 z-10 flex flex-col flex-wrap content-start gap-1">
          {installed.map((m, i) => (
            <DesktopIcon
              key={m.id}
              manifest={m}
              index={i}
              selected={selectedIcon === m.id}
              onSelect={() => setSelectedIcon(m.id)}
            />
          ))}
        </div>
      )}

      {/* ------------------------ window layer ---------------------- */}
      <WindowLayer isMobile={isMobile} />

      {/* sdk notifications */}
      <Notifications />

      {/* right-click menu (desktop only) */}
      {!isMobile && ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} />
      )}

      {/* ------------------------- dock / taskbar ------------------- */}
      {isMobile ? <MobileDock /> : <Taskbar />}
    </div>
  );
}
