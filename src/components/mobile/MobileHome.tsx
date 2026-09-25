import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useOSStore, MOBILE_DOCK_H, MOBILE_STATUS_H } from "../../store/useOSStore";
import { useOpenAppIds } from "../../store/selectors";
import { useAllApps } from "../../os/appResolve";
import type { AppManifest } from "../../types/os";
import { cn } from "../../utils/cn";

const PER_PAGE = 20; // 4 columns × 5 rows

/* --------------------------- home icon ---------------------------- */

const HomeIcon = memo(function HomeIcon({
  manifest,
  index,
  running,
}: {
  manifest: AppManifest;
  index: number;
  running: boolean;
}) {
  const openWindow = useOSStore((s) => s.openWindow);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: Math.min(index * 0.025, 0.4),
        type: "spring",
        stiffness: 420,
        damping: 26,
      }}
      whileTap={{ scale: 0.88 }}
      onClick={() => openWindow(manifest.id)}
      aria-label={`Open ${manifest.name}`}
      /* 44px+ touch target guaranteed by min-h/min-w */
      className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5 rounded-2xl p-1"
    >
      <span
        className={cn(
          "relative grid h-[58px] w-[58px] place-items-center rounded-[1.15rem] bg-gradient-to-br text-white shadow-lg ring-1 ring-white/20",
          manifest.tile ?? "from-zinc-500 to-zinc-700"
        )}
      >
        <manifest.icon className="h-7 w-7" strokeWidth={1.7} />
        {running && (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white/80" />
        )}
      </span>
      <span className="line-clamp-2 w-[68px] text-center text-[10.5px] leading-tight font-medium text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">
        {manifest.name}
      </span>
    </motion.button>
  );
});

/* --------------------------- home screen --------------------------- */

export default function MobileHome({
  occluded = false,
}: {
  /** true when a full-screen app is covering the home screen */
  occluded?: boolean;
}) {
  const apps = useAllApps();
  /** only the set of running appIds — immune to window motion */
  const openAppIds = useOpenAppIds();
  const openSet = useMemo(() => new Set(openAppIds), [openAppIds]);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? apps.filter((a) => a.name.toLowerCase().includes(q)) : apps;
  }, [apps, query]);

  const pages = useMemo(() => {
    const out: AppManifest[][] = [];
    for (let i = 0; i < filtered.length; i += PER_PAGE)
      out.push(filtered.slice(i, i + PER_PAGE));
    return out.length ? out : [[]];
  }, [filtered]);

  const safePage = Math.min(page, pages.length - 1);

  return (
    <div
      className={cn(
        "absolute inset-x-0 z-[10] flex flex-col",
        occluded && "klork-occluded"
      )}
      style={{ top: MOBILE_STATUS_H, bottom: MOBILE_DOCK_H }}
      aria-hidden={occluded}
    >
      {/* search */}
      <div className="shrink-0 px-5 pt-3 pb-1">
        <div className="klork-surface flex h-11 items-center gap-2 rounded-2xl border border-white/12 px-3.5">
          <Search className="h-4 w-4 shrink-0 text-white/45" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search apps"
            aria-label="Search apps"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40"
          />
        </div>
      </div>

      {/* paged icon grid */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <motion.div
          className="flex h-full"
          animate={{ x: `-${safePage * 100}%` }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          drag={pages.length > 1 ? "x" : false}
          dragDirectionLock
          dragElastic={0.12}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -60 && safePage < pages.length - 1)
              setPage(safePage + 1);
            else if (info.offset.x > 60 && safePage > 0) setPage(safePage - 1);
          }}
        >
          {pages.map((group, gi) => (
            <div
              key={gi}
              className="grid h-full w-full shrink-0 grid-cols-4 content-start justify-items-center gap-x-2 gap-y-4 overflow-y-auto px-4 pt-4 pb-2"
            >
              {group.map((m, i) => (
                <HomeIcon
                  key={m.id}
                  manifest={m}
                  index={i}
                  running={openSet.has(m.id)}
                />
              ))}
              {group.length === 0 && (
                <p className="col-span-4 pt-10 text-center text-[12.5px] text-white/45">
                  No apps match “{query}”.
                </p>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* page dots */}
      {pages.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-1.5 pb-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              className="grid h-11 w-6 place-items-center"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === safePage ? "bg-white" : "bg-white/30"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
