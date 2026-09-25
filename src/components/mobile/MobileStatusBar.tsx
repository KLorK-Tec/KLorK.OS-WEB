import { useEffect, useState } from "react";
import { BatteryMedium, SignalHigh, Wifi } from "lucide-react";
import { MOBILE_STATUS_H, useOSStore } from "../../store/useOSStore";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** iOS-style status bar pinned to the top of the mobile shell */
export default function MobileStatusBar() {
  const [now, setNow] = useState(() => new Date());
  const notificationCount = useOSStore((s) => s.notifications.length);

  /** HH:MM clock — tick once per minute, aligned to the minute boundary */
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

  return (
    <div
      style={{ height: MOBILE_STATUS_H }}
      className="fixed inset-x-0 top-0 z-[7500] flex items-center justify-between px-5 select-none"
    >
      <span className="text-[13px] font-semibold text-white tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
        {timeFmt.format(now)}
      </span>

      <div className="flex items-center gap-1.5 text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
        {notificationCount > 0 && (
          <span className="mr-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {notificationCount}
          </span>
        )}
        <SignalHigh className="h-3.5 w-3.5" strokeWidth={2.4} />
        <Wifi className="h-3.5 w-3.5" strokeWidth={2.4} />
        <BatteryMedium className="h-4 w-4" strokeWidth={2.2} />
      </div>
    </div>
  );
}
