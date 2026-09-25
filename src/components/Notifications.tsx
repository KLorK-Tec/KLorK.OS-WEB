import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { getManifest } from "../os/appResolve";
import { useOSStore } from "../store/useOSStore";

/** toast stack for api.windows.notify() — top-right, under the menu bar */
export default function Notifications() {
  const notifications = useOSStore(useShallow((s) => s.notifications));
  const dismissNotification = useOSStore((s) => s.dismissNotification);
  const openWindow = useOSStore((s) => s.openWindow);
  const accent = useOSStore((s) => s.accent);

  const isMobile = useOSStore((s) => s.isMobile);

  return (
    <div
      className={
        isMobile
          ? "pointer-events-none fixed inset-x-2 top-9 z-[8000] flex flex-col gap-2"
          : "pointer-events-none fixed top-12 right-3 z-[8000] flex w-[330px] flex-col gap-2"
      }
    >
      <AnimatePresence initial={false}>
        {notifications.map((n) => {
          const meta = n.appId ? getManifest(n.appId) : undefined;
          const Icon = meta?.icon ?? Bell;
          return (
            <motion.div
              key={n.id}
              /* FLIP layout animations measure bounding rects every frame —
                 far too costly on mobile, where toasts sit above a
                 full-screen app that would be forced to re-layout */
              layout={!isMobile}
              initial={{ opacity: 0, x: 90, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 70,
                scale: 0.95,
                transition: { duration: 0.18, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={() => {
                if (n.appId) openWindow(n.appId);
                dismissNotification(n.id);
              }}
              className="klork-surface group pointer-events-auto relative flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.12] p-3.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]"
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/20 ${
                  meta?.tile ?? "from-violet-500 to-cyan-400"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[12px] font-semibold text-white/90">
                    {n.title}
                  </p>
                  <span className="shrink-0 font-mono text-[9px] text-white/30">
                    now
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">
                  {n.msg}
                </p>
                {meta && (
                  <p className="mt-1.5 font-mono text-[8.5px] tracking-[0.14em] text-white/25 uppercase">
                    from {meta.name} · click to open
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(n.id);
                }}
                aria-label="Dismiss"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-white/35 transition-all hover:bg-white/10 hover:text-white md:h-5 md:w-5 md:opacity-0 md:group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>

              {/* accent sliver */}
              <span
                aria-hidden
                className="absolute top-3 bottom-3 left-0 w-[2.5px] rounded-full opacity-70"
                style={{ background: accent }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
