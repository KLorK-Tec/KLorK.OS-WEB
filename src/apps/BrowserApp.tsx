import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  RotateCw,
} from "lucide-react";
import { cn } from "../utils/cn";
import { defineApp } from "../os/AppRegistry";

const HOME_URL = "https://klork-tec.github.io/PortfolioKK/";

export default function BrowserApp() {
  const [frameKey, setFrameKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const reload = () => {
    setSpinning(true);
    setLoading(true);
    setFrameKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <button
          disabled
          className="grid h-7 w-7 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
          aria-label="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          disabled
          className="grid h-7 w-7 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
          aria-label="Forward"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={reload}
          className="grid h-7 w-7 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10"
          aria-label="Reload"
        >
          <RotateCw className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
        </button>

        <div className="mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-black/40 px-3 py-1.5">
          <Lock className="h-3 w-3 shrink-0 text-emerald-400/80" />
          <span className="truncate font-mono text-[10.5px] text-white/50">
            {HOME_URL}
          </span>
        </div>

        <a
          href={HOME_URL}
          target="_blank"
          rel="noreferrer"
          className="grid h-7 w-7 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10"
          aria-label="Open externally"
          title="Open externally"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* viewport */}
      <div className="relative min-h-0 flex-1 bg-[#0a0a0f]">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#0a0a0f]">
            <div className="flex flex-col items-center gap-3 text-white/40">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-[10.5px]">
                loading portfolio…
              </span>
            </div>
          </div>
        )}
        <iframe
          key={frameKey}
          src={HOME_URL}
          title="Kooshan Kalhor — Portfolio"
          onLoad={() => setLoading(false)}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "browser",
    name: "Browser",
    icon: Globe,
    version: "0.9.0",
    defaultSize: { width: 880, height: 580 },
    tile: "from-orange-400 to-rose-500",
  },
  Component: BrowserApp,
});
