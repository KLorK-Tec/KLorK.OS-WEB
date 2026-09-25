import {
  memo,
  startTransition,
  useEffect,
  useState,
  type ComponentType,
} from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { KlorkAPI } from "../../types/os";
import AppSurface from "../AppSurface";

/* ================================================================== */
/*  MobileAppWrapper — two-pass render                                 */
/*                                                                     */
/*  Pass 1 (this frame): the window shell paints and the hardware      */
/*          entry transition starts against a cheap skeleton.          */
/*  Pass 2 (after 2 rAFs): the real app tree mounts inside a           */
/*          non-urgent transition, so React can yield and the          */
/*          entrance animation is never blocked by app mount work      */
/*          (Terminal scrollback, App Store catalog fetch, remote      */
/*          ES-module evaluation, chart timers, …).                    */
/*                                                                     */
/*  Two rAFs are used deliberately: the first fires *before* the       */
/*  browser has committed the initial paint of the shell, the second   */
/*  fires once that frame is on screen.                                */
/* ================================================================== */

function AppSkeleton({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3"
      aria-busy="true"
      aria-live="polite"
    >
      <Icon className="klork-skeleton h-7 w-7 text-white/30" strokeWidth={1.6} />
      <div className="flex flex-col items-center gap-2">
        <span className="klork-skeleton h-2 w-28 rounded-full bg-white/10" />
        <span
          className="klork-skeleton h-2 w-20 rounded-full bg-white/10"
          style={{ animationDelay: "120ms" }}
        />
      </div>
      <span className="sr-only">Loading app…</span>
    </div>
  );
}

const MobileAppWrapper = memo(function MobileAppWrapper({
  windowId,
  appId,
  api,
  icon,
}: {
  windowId: string;
  appId: string;
  api: KlorkAPI;
  icon: LucideIcon;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let inner = 0;

    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (cancelled) return;
        // non-urgent: React may yield to keep the animation at 60fps
        startTransition(() => setReady(true));
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  if (!ready) return <AppSkeleton icon={icon} />;

  return (
    /* opacity-only fold-in — the skeleton→content swap never hard-blinks */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full w-full"
    >
      <AppSurface windowId={windowId} appId={appId} api={api} />
    </motion.div>
  );
}) as ComponentType<{
  windowId: string;
  appId: string;
  api: KlorkAPI;
  icon: LucideIcon;
}>;

export default MobileAppWrapper;
