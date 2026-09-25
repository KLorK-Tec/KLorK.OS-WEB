/* ================================================================== */
/*  Hello World — SDK smoke-test app                                   */
/*                                                                     */
/*  Loaded through the App Plugin Architecture: a static manifest      */
/*  plus a component that receives { windowId, api } at runtime.       */
/* ================================================================== */

import { Bell, Rocket, Settings2 } from "lucide-react";
import { defineApp } from "../../os/AppRegistry";
import type { AppManifest, KlorkAppProps } from "../../types/os";

const manifest: AppManifest = {
  id: "hello",
  name: "Hello World",
  icon: Rocket,
  version: "1.0.0",
  defaultSize: { width: 460, height: 420 },
  tile: "from-lime-400 to-emerald-500",
};

function HelloComponent({ windowId, api }: KlorkAppProps) {
  const { accent, wallpaper } = api.theme.current;
  const wpName =
    wallpaper.split("/").pop()?.replace(/\.\w+$/, "") ?? wallpaper;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      {/* icon */}
      <div
        className={`grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br ${manifest.tile} text-white shadow-xl ring-1 ring-white/25`}
      >
        <Rocket className="h-8 w-8" strokeWidth={1.7} />
      </div>

      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-white">
          Hello, Klork.os!
        </h1>
        <p className="mx-auto mt-2 max-w-[300px] text-[12px] leading-relaxed text-white/50">
          This window was resolved by the{" "}
          <span className="font-mono text-white/70">AppRegistry</span> and
          received its <span className="font-mono text-white/70">api</span>{" "}
          object via props.
        </p>
      </div>

      {/* window identity */}
      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] text-white/40">
        windowId · {windowId}
      </div>

      {/* SDK actions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() =>
            api.windows.notify(
              "Hello World",
              `Greetings from hello@${manifest.version} — via api.windows.notify()`
            )
          }
          className="flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95"
          style={{ background: accent, boxShadow: `0 8px 24px ${accent}55` }}
        >
          <Bell className="h-3.5 w-3.5" />
          api.windows.notify()
        </button>
        <button
          onClick={() => api.windows.open("settings")}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-white/75 transition-colors hover:border-white/30 hover:text-white"
        >
          <Settings2 className="h-3.5 w-3.5" />
          api.windows.open()
        </button>
      </div>

      {/* live theme snapshot */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-white/35">
        <span>theme.current</span>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
          style={{ background: accent }}
        />
        <span className="text-white/55">{accent}</span>
        <span>·</span>
        <span className="text-white/55">{wpName}</span>
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest,
  Component: HelloComponent,
});

export default app;
