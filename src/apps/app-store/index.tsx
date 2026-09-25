/* ================================================================== */
/*  AppStore.app — browse & install community apps                     */
/*                                                                     */
/*  Fetches a (mock) catalog, then writes chosen manifests into the    */
/*  persisted `installedApps` array. The taskbar, start menu and       */
/*  desktop read the same store slice, so installs appear instantly.   */
/* ================================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Download,
  Loader2,
  Search,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { defineApp } from "../../os/AppRegistry";
import { resolveIcon } from "../../os/iconRegistry";
import { useOSStore } from "../../store/useOSStore";
import type { AppManifest, KlorkAppProps, StoreListing } from "../../types/os";
import { cn } from "../../utils/cn";
import { CATALOG } from "./catalog";

const manifest: AppManifest = {
  id: "app-store",
  name: "App Store",
  icon: ShoppingBag,
  version: "1.0.0",
  defaultSize: { width: 820, height: 580 },
  minSize: { width: 520, height: 380 },
  tile: "from-blue-500 to-indigo-600",
};

const CATEGORIES = ["All", "Utilities", "Productivity", "Developer", "Fun"] as const;

/** simulates GET /catalog.json */
function fetchCatalog(): Promise<StoreListing[]> {
  return new Promise((resolve) => setTimeout(() => resolve(CATALOG), 650));
}

/* ---------------------------- listing card ------------------------- */

function ListingCard({
  listing,
  installed,
  busy,
  accent,
  onInstall,
  onUninstall,
  onOpen,
}: {
  listing: StoreListing;
  installed: boolean;
  busy: boolean;
  accent: string;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
}) {
  const Icon = resolveIcon(listing.iconName);

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-colors hover:border-white/15">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/20",
            listing.tile
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[13px] font-semibold text-white/90">
              {listing.name}
            </h3>
            {listing.verified && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            )}
          </div>
          <p className="truncate text-[11px] text-white/45">{listing.tagline}</p>
          <div className="mt-1 flex items-center gap-2 font-mono text-[9.5px] text-white/30">
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {listing.rating}
            </span>
            <span>·</span>
            <span>{listing.installs}</span>
            <span>·</span>
            <span>{listing.weight}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-[11.5px] leading-relaxed text-white/50">
        {listing.description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[9.5px] text-white/25">
          v{listing.version} · {listing.author}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {installed ? (
            <>
              <button
                onClick={onUninstall}
                aria-label={`Uninstall ${listing.name}`}
                className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onOpen}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/12"
              >
                <Check className="h-3 w-3 text-emerald-400" />
                Open
              </button>
            </>
          ) : (
            <button
              onClick={onInstall}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
              style={{ background: accent, boxShadow: `0 6px 18px ${accent}55` }}
            >
              {busy ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Installing
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Install
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ the app ---------------------------- */

function AppStore({ api }: KlorkAppProps) {
  const installedApps = useOSStore((s) => s.installedApps);
  const installApp = useOSStore((s) => s.installApp);
  const uninstallApp = useOSStore((s) => s.uninstallApp);
  const accent = api.theme.current.accent;

  const [catalog, setCatalog] = useState<StoreListing[] | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCatalog().then((c) => alive && setCatalog(c));
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (l) =>
        (category === "All" || l.category === category) &&
        (!q ||
          l.name.toLowerCase().includes(q) ||
          l.tagline.toLowerCase().includes(q) ||
          l.author.toLowerCase().includes(q))
    );
  }, [catalog, category, query]);

  const isInstalled = (id: string) => installedApps.some((a) => a.id === id);

  const handleInstall = (listing: StoreListing) => {
    setBusyId(listing.id);
    // simulate the download/verify step
    setTimeout(() => {
      installApp(listing);
      setBusyId(null);
      api.windows.notify(
        "App installed",
        `${listing.name} v${listing.version} is ready — find it in the dock.`
      );
    }, 850);
  };

  const handleUninstall = (listing: StoreListing) => {
    uninstallApp(listing.id);
    api.windows.notify("App removed", `${listing.name} was uninstalled.`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[15px] font-semibold tracking-tight text-white">
              App Store
            </h1>
            <p className="text-[11px] text-white/40">
              community apps · loaded dynamically at runtime
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9.5px] text-white/45">
            {installedApps.length} installed
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/[0.09] bg-black/30 px-3.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps and authors"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-white/85 outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[10.5px] transition-colors",
                category === c
                  ? "border-white/25 bg-white/12 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/80"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!catalog ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            <p className="font-mono text-[10.5px] text-white/35">
              fetching catalog…
            </p>
          </div>
        ) : results.length === 0 ? (
          <p className="py-12 text-center text-[12px] text-white/35">
            No apps match “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {results.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                installed={isInstalled(l.id)}
                busy={busyId === l.id}
                accent={accent}
                onInstall={() => handleInstall(l)}
                onUninstall={() => handleUninstall(l)}
                onOpen={() => api.windows.open(l.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-4 py-1.5 font-mono text-[9.5px] text-white/25">
        <span>catalog v1 · {catalog?.length ?? 0} listings</span>
        <span>installs persist to localStorage</span>
      </div>
    </div>
  );
}

export const app = defineApp({ manifest, Component: AppStore });

export default app;
