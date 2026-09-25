import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { Rnd, type Props as RndProps } from "react-rnd";
import {
  AppWindow,
  ChevronDown,
  Minus,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DOCK_CLEARANCE,
  MIN_WIN,
  MOBILE_DOCK_H,
  MOBILE_STATUS_H,
  TOP_BAR_H,
  useOSStore,
  type OSWindow,
} from "../store/useOSStore";
import {
  useAccent,
  useIsMobileMode,
  useIsWindowActive,
  useWindow,
  useWindowActions,
} from "../store/selectors";
import { AppRegistry } from "../os/AppRegistry";
import { useKlorkAPI } from "../os/useKlorkAPI";
import { resolveIcon } from "../os/iconRegistry";
import AppSurface from "./AppSurface";
import MobileAppWrapper from "./mobile/MobileAppWrapper";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------------ */
/*  Chrome metadata (icon / version / min size)                        */
/* ------------------------------------------------------------------ */

function useAppChrome(appId: string) {
  const mod = AppRegistry.get(appId);
  const installed = useOSStore((s) =>
    mod ? undefined : s.installedApps.find((a) => a.id === appId)
  );

  return {
    icon:
      mod?.manifest.icon ??
      (installed ? resolveIcon(installed.iconName) : AppWindow),
    version: mod?.manifest.version ?? installed?.version,
    minWidth:
      mod?.manifest.minSize?.width ?? installed?.minSize?.width ?? MIN_WIN.width,
    minHeight:
      mod?.manifest.minSize?.height ??
      installed?.minSize?.height ??
      MIN_WIN.height,
  };
}

/* ------------------------------------------------------------------ */
/*  macOS-style traffic light (desktop only)                           */
/* ------------------------------------------------------------------ */

const TrafficLight = memo(function TrafficLight({
  color,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  color: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="klork-no-drag group/tl relative grid h-3 w-3 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
      style={{
        background: active ? color : "#3f3f46",
        boxShadow: active
          ? `inset 0 0 0 0.5px rgba(0,0,0,.25), 0 0 6px ${color}55`
          : "inset 0 0 0 0.5px rgba(255,255,255,.08)",
      }}
    >
      {/* invisible 44px hit area — accessible target, no visual change */}
      <span aria-hidden className="absolute -inset-[15.5px]" />
      <Icon
        strokeWidth={3.2}
        className="h-[7px] w-[7px] text-black/60 opacity-0 transition-opacity duration-100 group-hover/lights:opacity-100"
      />
    </button>
  );
});

/* ================================================================== */
/*  MOBILE SHELL                                                       */
/*                                                                     */
/*  Enter/exit animate ONLY opacity + transform (scale/translate),     */
/*  with translateZ(0) so the whole gesture stays on the compositor.   */
/*  No `layout` / `layoutId` — those force per-frame getBoundingClient */
/*  Rect FLIP measurements, which is exactly what stalls a phone.      */
/* ================================================================== */

const ENTER = {
  opacity: 1,
  scale: 1,
  y: 0,
  z: 0,
  transition: { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.7 },
};

const FROM = { opacity: 0, scale: 0.94, y: 28, z: 0 };

const BACKGROUNDED = {
  opacity: 0,
  scale: 0.92,
  y: 44,
  z: 0,
  transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
};

const EXIT = {
  opacity: 0,
  scale: 0.93,
  y: 24,
  z: 0,
  transition: { duration: 0.17, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
};

const MobileWindowFrame = memo(
  forwardRef<HTMLDivElement, { win: OSWindow }>(function MobileWindowFrame(
    { win },
    ref
  ) {
    const { closeWindow, minimizeWindow, focusWindow } = useWindowActions();
    const accent = useAccent();
    const { icon: TitleIcon } = useAppChrome(win.appId);
    const api = useKlorkAPI(win.id);

    /**
     * NOTE: no onAnimationStart/onAnimationComplete callbacks here.
     * They fire on mount AND on every animate re-trigger; flipping the
     * will-change class from them promoted/demoted the layer mid-spring
     * and produced a visible flash. `translateZ(0)` from
     * `.klork-mobile-window` keeps the layer stable instead.
     */

    /** swipe-to-dismiss starts from the title bar only (never from content) */
    const dragControls = useDragControls();

    const handleDragEnd = useCallback(
      (_e: unknown, info: PanInfo) => {
        if (info.offset.y > 110 || info.velocity.y > 750) minimizeWindow(win.id);
      },
      [minimizeWindow, win.id]
    );

    return (
      <motion.div
        ref={ref}
        role="dialog"
        aria-label={win.title}
        onPointerDown={() => focusWindow(win.id)}
        /* explicitly opt out of FLIP layout animations on mobile */
        layout={false}
        initial={FROM}
        animate={win.isMinimized ? BACKGROUNDED : ENTER}
        exit={EXIT}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.55 }}
        onDragEnd={handleDragEnd}
        style={{
          zIndex: win.zIndex,
          top: MOBILE_STATUS_H,
          bottom: MOBILE_DOCK_H,
          pointerEvents: win.isMinimized ? "none" : "auto",
        }}
        className="klork-mobile-window fixed inset-x-0 flex touch-pan-y flex-col overflow-hidden rounded-t-3xl rounded-b-2xl border border-white/12"
      >
        {/* ---------------- title bar (drag handle) ------------------ */}
        <div
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            dragControls.start(e);
          }}
          className="relative flex shrink-0 touch-none flex-col items-center border-b border-white/[0.07] bg-white/[0.04] pt-2 pb-1.5"
        >
          <span
            aria-hidden
            className="h-1 w-10 rounded-full bg-white/25"
            style={{ boxShadow: `0 0 10px ${accent}44` }}
          />

          <div className="flex w-full items-center gap-2 px-2 pt-1.5">
            <button
              onClick={() => closeWindow(win.id)}
              aria-label={`Close ${win.title}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/70 transition-colors active:bg-white/10"
            >
              <ChevronDown className="h-5 w-5" strokeWidth={2.2} />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
              <TitleIcon
                className="h-4 w-4 shrink-0 text-white/50"
                strokeWidth={2.2}
              />
              <span className="truncate text-[14px] font-medium text-white/90">
                {win.title}
              </span>
            </div>

            <button
              onClick={() => minimizeWindow(win.id)}
              aria-label={`Send ${win.title} to background`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/70 transition-colors active:bg-white/10"
            >
              <Minus className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          <p className="pb-0.5 text-[9px] tracking-wider text-white/25">
            swipe down to close
          </p>
        </div>

        {/* -------------------- content (deferred) ------------------- */}
        <div className="klork-window-content relative min-h-0 flex-1 overflow-hidden">
          <MobileAppWrapper
            windowId={win.id}
            appId={win.appId}
            api={api}
            icon={TitleIcon}
          />
        </div>
      </motion.div>
    );
  })
);

/* ================================================================== */
/*  DESKTOP SHELL — react-rnd drag + resize                            */
/* ================================================================== */

const DesktopWindowFrame = memo(function DesktopWindowFrame({
  win,
}: {
  win: OSWindow;
}) {
  const {
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    focusWindow,
    setBounds,
  } = useWindowActions();
  const active = useIsWindowActive(win.id);
  const accent = useAccent();
  const { icon: TitleIcon, version, minWidth, minHeight } = useAppChrome(
    win.appId
  );
  const api = useKlorkAPI(win.id);

  /**
   * Drag/resize state is LOCAL. react-rnd moves the node with a CSS
   * transform on every pointer frame; we never write to Zustand
   * mid-gesture — the committed geometry is dispatched once, in
   * onDragStop / onResizeStop. There is deliberately no onDrag/onResize.
   */
  const [interacting, setInteracting] = useState(false);

  const [springing, setSpringing] = useState(false);
  useEffect(() => {
    setSpringing(true);
    const t = setTimeout(() => setSpringing(false), 320);
    return () => clearTimeout(t);
  }, [win.isMaximized]);

  const parentW = typeof window !== "undefined" ? window.innerWidth : 1440;
  const parentH =
    (typeof window !== "undefined" ? window.innerHeight : 900) - TOP_BAR_H;

  const maxBounds = {
    x: 10,
    y: 8,
    width: parentW - 20,
    height: parentH - 8 - DOCK_CLEARANCE,
  };

  const handleStyles: RndProps["resizeHandleStyles"] = {
    top: { top: -4, height: 10 },
    bottom: { bottom: -4, height: 10 },
    left: { left: -4, width: 10 },
    right: { right: -4, width: 10 },
    topLeft: { top: -6, left: -6, width: 16, height: 16 },
    topRight: { top: -6, right: -6, width: 16, height: 16 },
    bottomLeft: { bottom: -6, left: -6, width: 16, height: 16 },
    bottomRight: { bottom: -6, right: -6, width: 16, height: 16 },
  };

  const beginInteraction = useCallback(() => {
    setInteracting(true);
    focusWindow(win.id);
  }, [focusWindow, win.id]);

  return (
    <Rnd
      bounds="parent"
      size={
        win.isMaximized
          ? { width: maxBounds.width, height: maxBounds.height }
          : win.size
      }
      position={
        win.isMaximized ? { x: maxBounds.x, y: maxBounds.y } : win.position
      }
      minWidth={minWidth}
      minHeight={minHeight}
      dragHandleClassName="klork-drag-handle"
      cancel=".klork-no-drag"
      disableDragging={win.isMaximized}
      enableResizing={!win.isMaximized}
      resizeHandleStyles={handleStyles}
      onMouseDown={() => focusWindow(win.id)}
      onDragStart={beginInteraction}
      onResizeStart={beginInteraction}
      /* ── single store dispatch per gesture ── */
      onDragStop={(_e, d) => {
        setInteracting(false);
        setBounds(win.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        setInteracting(false);
        setBounds(win.id, {
          x: pos.x,
          y: pos.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
      style={{
        zIndex: win.zIndex,
        pointerEvents: win.isMinimized ? "none" : "auto",
        transition:
          springing && !interacting
            ? "transform .3s cubic-bezier(.32,.72,.24,1), width .3s cubic-bezier(.32,.72,.24,1), height .3s cubic-bezier(.32,.72,.24,1)"
            : undefined,
      }}
      className="pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        /*
         * Transform + opacity ONLY. Animating filter:blur() on an element
         * that also carries backdrop-filter tiled the raster every focus
         * re-trigger (zIndex changes recreate `win`, restarting this
         * animation), which is where the blink came from.
         */
        animate={
          win.isMinimized
            ? {
                opacity: 0,
                scale: 0.45,
                y: 340,
                transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 400, damping: 32 },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.92,
          y: 14,
          transition: { duration: 0.16, ease: "easeIn" },
        }}
        style={{ transformOrigin: "50% 100%" }}
        className={cn(
          "isolate flex h-full w-full flex-col overflow-hidden rounded-2xl border",
          interacting ? "klork-dragging" : "backdrop-blur-2xl",
          active
            ? "border-white/20 bg-zinc-950/65 shadow-[0_32px_90px_-16px_rgba(0,0,0,0.85)]"
            : "border-white/[0.09] bg-zinc-950/50 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]",
          !interacting &&
            "transition-[border-color,box-shadow,background-color] duration-300"
        )}
      >
        {/* ------------------------- title bar ------------------------- */}
        <div
          className={cn(
            "klork-drag-handle relative flex h-10 shrink-0 cursor-default items-center border-b px-3.5 select-none",
            active
              ? "border-white/[0.08] bg-white/[0.04]"
              : "border-white/[0.05] bg-white/[0.02]"
          )}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest(".klork-no-drag")) return;
            toggleMaximize(win.id);
          }}
        >
          <div className="group/lights flex items-center gap-2">
            <TrafficLight
              color="#ff5f57"
              icon={X}
              label="Close"
              active={active}
              onClick={() => closeWindow(win.id)}
            />
            <TrafficLight
              color="#febc2e"
              icon={Minus}
              label="Minimize"
              active={active}
              onClick={() => minimizeWindow(win.id)}
            />
            <TrafficLight
              color="#28c840"
              icon={Plus}
              label="Maximize"
              active={active}
              onClick={() => toggleMaximize(win.id)}
            />
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-x-16 flex items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors duration-200",
              active ? "text-white/85" : "text-white/35"
            )}
          >
            <TitleIcon className="h-3.5 w-3.5 opacity-70" strokeWidth={2.2} />
            <span className="truncate">{win.title}</span>
            {version && (
              <span className="hidden font-mono text-[9px] text-white/25 md:inline">
                v{version}
              </span>
            )}
          </div>

          <div className="ml-auto hidden font-mono text-[10px] tracking-wider text-white/25 sm:block">
            {Math.round(win.size.width)}×{Math.round(win.size.height)}
          </div>
        </div>

        {/* --------------------------- content ------------------------- */}
        <div
          className={cn(
            "klork-window-content relative min-h-0 flex-1",
            !active && "opacity-90",
            !interacting && "transition-opacity duration-300"
          )}
        >
          <AppSurface windowId={win.id} appId={win.appId} api={api} />
          {/* accent edge-light — always mounted, opacity toggled (previously
              mounted/unmounted on focus, causing an instant pop) */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-300",
              active ? "opacity-60" : "opacity-0"
            )}
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
            }}
          />
        </div>
      </motion.div>
    </Rnd>
  );
});

/* ================================================================== */
/*  Paradigm switch                                                    */
/*                                                                     */
/*  forwardRef so AnimatePresence mode="popLayout" can measure the     */
/*  mobile frame; memo + windowId keying keeps window A's lifecycle    */
/*  fully isolated from window B.                                      */
/* ================================================================== */

const WindowFrame = memo(
  forwardRef<HTMLDivElement, { windowId: string }>(function WindowFrame(
    { windowId },
    ref
  ) {
    const win = useWindow(windowId);
    const isMobile = useIsMobileMode();

    if (!win) return null;
    return isMobile ? (
      <MobileWindowFrame ref={ref} win={win} />
    ) : (
      <DesktopWindowFrame win={win} />
    );
  })
);

export default WindowFrame;
