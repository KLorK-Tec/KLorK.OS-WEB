import { motion } from "framer-motion";
import { AppWindow, Image, Info, Minus, Terminal, X } from "lucide-react";
import { useOSStore } from "../store/useOSStore";

export default function ContextMenu({
  x,
  y,
  onClose,
}: {
  x: number;
  y: number;
  onClose: () => void;
}) {
  const openWindow = useOSStore((s) => s.openWindow);
  const minimizeAll = useOSStore((s) => s.minimizeAll);
  const closeAllWindows = useOSStore((s) => s.closeAllWindows);

  const items = [
    {
      icon: Info,
      label: "About Klork.os",
      run: () => openWindow("about"),
    },
    {
      icon: Terminal,
      label: "Open Terminal",
      run: () => openWindow("terminal"),
    },
    {
      icon: Image,
      label: "Change Wallpaper…",
      run: () => openWindow("settings"),
    },
    { divider: true as const },
    { icon: Minus, label: "Minimize All Windows", run: minimizeAll },
    {
      icon: X,
      label: "Close All Windows",
      run: closeAllWindows,
      danger: true,
    },
  ];

  const W = 232;
  const H = 252;
  const left = Math.max(8, Math.min(x, window.innerWidth - W - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - H - 8));

  return (
    <>
      <div
        className="fixed inset-0 z-[6990]"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{ left, top, transformOrigin: "top left", width: W }}
        className="fixed z-[7000] overflow-hidden rounded-2xl border border-white/[0.12] bg-zinc-950/75 p-1.5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      >
        {items.map((item, i) =>
          "divider" in item ? (
            <div key={i} className="mx-2 my-1.5 h-px bg-white/[0.08]" />
          ) : (
            <button
              key={item.label}
              onClick={() => {
                item.run();
                onClose();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors ${
                "danger" in item && item.danger
                  ? "text-rose-300/80 hover:bg-rose-400/10 hover:text-rose-300"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 opacity-60" />
              {item.label}
            </button>
          )
        )}
        <div className="mx-2 mt-1 mb-0.5 flex items-center gap-2 border-t border-white/[0.08] px-1 pt-2 pb-1">
          <AppWindow className="h-3 w-3 text-white/25" />
          <span className="font-mono text-[9px] tracking-wider text-white/25 uppercase">
            klork.os · core window engine
          </span>
        </div>
      </motion.div>
    </>
  );
}
