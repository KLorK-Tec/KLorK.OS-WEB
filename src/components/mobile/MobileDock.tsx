import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, X } from "lucide-react";
import { MOBILE_DOCK_H, useOSStore } from "../../store/useOSStore";
import {
  useAccent,
  useActiveAppId,
  useAnyWindowVisible,
  useMinimizedAppIds,
  useOpenAppIds,
  useRunningWindowCount,
  useWindowActions,
} from "../../store/selectors";
import { useShallow } from "zustand/react/shallow";
import { useAllApps } from "../../os/appResolve";
import type { AppManifest } from "../../types/os";
import { cn } from "../../utils/cn";

/** apps pinned to the dock when nothing is running */
const PINNED = ["file-explorer", "terminal", "app-store", "about"];

/* ------------------------- app switcher --------------------------- */

function AppSwitcher({ onClose }: { onClose: () => void }) {
  const windows = useOSStore((s) => s.windows);
  const focusWindow = useOSStore((s) => s.focusWindow);
  const closeWindow = useOSStore((s) => s.closeWindow);
  const apps = useAllApps();
  const byId = (id: string) => apps.find((a) => a.id === id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="klork-surface fixed inset-0 z-[7800] flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 pt-10 pb-3">
        <p className="text-[13px] font-semibold text-white/90">Recent apps</p>
        <button
          onClick={onClose}
          aria-label="Close app switcher"
          className="grid h-11 w-11 place-items-center rounded-full text-white/70 active:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {windows.length === 0 ? (
          <p className="pt-16 text-center text-[13px] text-white/45">
            No apps running
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {windows.map((w) => {
              const m = byId(w.appId);
              return (
                <div
                  key={w.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusWindow(w.id);
                    onClose();
                  }}
                  className="relative flex h-40 flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900/70"
                >
                  <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.05] px-3 py-2">
                    {m && (
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br text-white",
                          m.tile ?? "from-zinc-500 to-zinc-700"
                        )}
                      >
                        <m.icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                    )}
                    <span className="truncate text-[11.5px] text-white/85">
                      {w.title}
                    </span>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-white/[0.05] to-transparent" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(w.id);
                    }}
                    aria-label={`Close ${w.title}`}
                    className="absolute top-1 right-1 grid h-11 w-11 place-items-center text-white/60 active:text-white"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-black/70">
                      <X className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------------------- the dock ----------------------------- */

export default function MobileDock() {
  /* all primitive/shallow subscriptions — unaffected by window motion */
  const openAppIds = useOpenAppIds();
  const minimizedAppIds = useMinimizedAppIds();
  const activeAppId = useActiveAppId();
  const recentApps = useOSStore(useShallow((s) => s.recentApps));
  const windowCount = useRunningWindowCount();
  const anyOpen = useAnyWindowVisible();
  const accent = useAccent();
  const { openWindow, goHome } = useWindowActions();

  const apps = useAllApps();
  const [switcher, setSwitcher] = useState(false);

  const openSet = useMemo(() => new Set(openAppIds), [openAppIds]);
  const minimizedSet = useMemo(
    () => new Set(minimizedAppIds),
    [minimizedAppIds]
  );

  /** running apps first, then recents, then pinned — capped at 4 */
  const dockApps = useMemo(() => {
    const ids: string[] = [];
    for (const id of [...openAppIds, ...recentApps, ...PINNED]) {
      if (!ids.includes(id) && apps.some((a) => a.id === id)) ids.push(id);
      if (ids.length === 4) break;
    }
    return ids
      .map((id) => apps.find((a) => a.id === id))
      .filter((a): a is AppManifest => !!a);
  }, [openAppIds, recentApps, apps]);

  return (
    <>
      <div
        style={{ height: MOBILE_DOCK_H }}
        className="fixed inset-x-0 bottom-0 z-[7600] flex flex-col justify-end"
      >
        {/* dock tray */}
        <div className="klork-surface mx-3 mb-1 flex items-center gap-1 rounded-[1.6rem] border border-white/12 px-2 py-2">
          {dockApps.map((m) => {
            const isOpen = openSet.has(m.id);
            const isActive =
              isOpen && activeAppId === m.id && !minimizedSet.has(m.id);
            return (
              <button
                key={m.id}
                onClick={() => openWindow(m.id)}
                aria-label={`Open ${m.name}`}
                className="relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-transform active:scale-90"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white ring-1 ring-white/20",
                    m.tile ?? "from-zinc-500 to-zinc-700"
                  )}
                  style={
                    isActive
                      ? { boxShadow: `0 0 0 1.5px ${accent}, 0 6px 18px ${accent}55` }
                      : undefined
                  }
                >
                  <m.icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                {isOpen && (
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: isActive ? accent : "rgba(255,255,255,.5)" }}
                  />
                )}
              </button>
            );
          })}

          {/* app switcher */}
          <button
            onClick={() => setSwitcher(true)}
            aria-label="Open app switcher"
            className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-transform active:scale-90"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] text-white/80">
              <LayoutGrid className="h-5 w-5" strokeWidth={1.9} />
            </span>
            {windowCount > 0 && (
              <span className="absolute top-0 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {windowCount}
              </span>
            )}
          </button>
        </div>

        {/* home indicator — tap or swipe up to go home */}
        <button
          onClick={() => anyOpen && goHome()}
          aria-label="Go to home screen"
          className="mx-auto grid h-6 w-40 shrink-0 place-items-center"
        >
          <span
            className={cn(
              "h-1 w-32 rounded-full transition-colors",
              anyOpen ? "bg-white/85" : "bg-white/35"
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {switcher && <AppSwitcher onClose={() => setSwitcher(false)} />}
      </AnimatePresence>
    </>
  );
}
