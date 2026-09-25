import { useEffect, useState } from "react";
import { Battery, Search, Volume2, Wifi } from "lucide-react";
import { useOSStore } from "../store/useOSStore";

/**
 * The clock shows HH:MM — tick once per minute, aligned to the minute
 * boundary. (It used to re-render the whole blurred menu bar every second.)
 */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default function TopBar() {
  const now = useClock();
  const activeTitle = useOSStore(
    (s) => s.windows.find((w) => w.id === s.activeWindowId)?.title ?? "Desktop"
  );

  return (
    <header
      className="fixed inset-x-0 top-0 z-[6500] flex h-10 items-center justify-between border-b border-white/[0.06] px-3.5 select-none"
      /*
       * Nearly-solid instead of backdrop-blur-xl: this bar sits permanently
       * above every window, and a live backdrop-filter re-samples the
       * wallpaper + animating windows below on every frame — the classic
       * Chrome backdrop-flicker the desktop was showing.
       */
      style={{ background: "rgb(8 8 10 / 0.8)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 font-display text-[10px] font-bold text-white ring-1 ring-white/25">
          K
        </div>
        <span className="font-display text-[12.5px] font-semibold tracking-tight text-white/90">
          klork<span className="text-white/40">.os</span>
        </span>
        <span className="h-3 w-px bg-white/15" />
        <span className="truncate text-[11.5px] text-white/55">
          {activeTitle}
        </span>
        <nav className="ml-3 hidden items-center gap-3.5 text-[11px] text-white/40 lg:flex">
          {["File", "Edit", "View", "Go", "Window", "Help"].map((m) => (
            <span key={m} className="cursor-default transition-colors hover:text-white/80">
              {m}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3.5 text-white/60">
        <Search className="h-3.5 w-3.5 transition-colors hover:text-white" />
        <Wifi className="h-3.5 w-3.5" />
        <Volume2 className="h-3.5 w-3.5" />
        <Battery className="h-4 w-4" />
        <span className="text-[11px] whitespace-nowrap text-white/75 tabular-nums">
          {dateFmt.format(now)}&nbsp;&nbsp;{timeFmt.format(now)}
        </span>
      </div>
    </header>
  );
}
