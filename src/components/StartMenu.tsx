import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Power, Search } from "lucide-react";
import { useOSStore } from "../store/useOSStore";
import { useAllApps } from "../os/appResolve";

export default function StartMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const openWindow = useOSStore((s) => s.openWindow);
  const closeAllWindows = useOSStore((s) => s.closeAllWindows);
  const clearNotifications = useOSStore((s) => s.clearNotifications);
  const setBooted = useOSStore((s) => s.setBooted);
  const accent = useOSStore((s) => s.accent);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** built-ins + App Store installs, filtered by the search box */
  const allApps = useAllApps();
  const apps = allApps.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const launch = (id: string) => {
    openWindow(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="fixed inset-0 z-[5900]"
          />
          <div className="pointer-events-none fixed bottom-[86px] left-1/2 z-[6000] w-[min(420px,92vw)] -translate-x-1/2">
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.96,
                transition: { duration: 0.14, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              style={{ transformOrigin: "50% 100%" }}
              className="pointer-events-auto overflow-hidden rounded-3xl border border-white/[0.12] bg-zinc-950/70 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            >
              {/* user header */}
              <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03] px-5 py-4">
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl font-display text-sm font-bold text-white ring-1 ring-white/25"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, #06b6d4)`,
                    boxShadow: `0 8px 24px ${accent}44`,
                  }}
                >
                  KK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13.5px] font-semibold text-white/90">
                    Kooshan Kalhor
                  </p>
                  <p className="truncate text-[10.5px] text-white/40">
                    AI/ML Developer — Tehran, IR
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 font-mono text-[9.5px] text-white/45">
                  v25.11
                </span>
              </div>

              {/* search */}
              <div className="px-5 pt-4">
                <div className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-black/30 px-3.5 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type here to search"
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-white/85 outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* pinned apps — registry-driven */}
              <div className="px-5 pt-4 pb-2">
                <p className="mb-2.5 text-[10px] font-semibold tracking-widest text-white/35 uppercase">
                  Pinned
                </p>
                {apps.length === 0 ? (
                  <p className="py-6 text-center text-[11.5px] text-white/35">
                    No apps found for “{query}”
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {apps.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => launch(m.id)}
                        className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-colors hover:bg-white/[0.07]"
                      >
                        <div
                          className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${
                            m.tile ?? "from-zinc-500 to-zinc-700"
                          } text-white shadow-lg ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-110`}
                        >
                          <m.icon className="h-5 w-5" strokeWidth={1.9} />
                        </div>
                        <span className="text-[10px] text-white/65 group-hover:text-white/90">
                          {m.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* footer */}
              <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-5 py-3">
                <span className="font-mono text-[10px] text-white/35">
                  klork<span className="text-white/20">.os</span> · plugin sdk
                </span>
                <button
                  onClick={() => {
                    closeAllWindows();
                    clearNotifications();
                    onClose();
                    setBooted(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10.5px] text-white/60 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <Power className="h-3 w-3" />
                  restart
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
