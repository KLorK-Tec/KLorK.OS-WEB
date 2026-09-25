/* ================================================================== */
/*  AppRegistry — installed-app dictionary                             */
/*                                                                     */
/*  Built-in apps register themselves at startup (see                  */
/*  src/apps/builtins.ts). The window engine, taskbar, start menu      */
/*  and desktop all resolve apps through this registry, so new         */
/*  apps only need a `KlorkAppModule` + one `register()` call.         */
/* ================================================================== */

import { memo } from "react";
import type { AppId, AppManifest, KlorkAppModule } from "../types/os";

class KlorkAppRegistry {
  /** registration order is preserved → drives dock/start-menu order */
  private modules = new Map<AppId, KlorkAppModule>();

  register(mod: KlorkAppModule): KlorkAppModule {
    if (this.modules.has(mod.manifest.id)) {
      console.warn(`[klork.os] app "${mod.manifest.id}" re-registered — overriding`);
    }
    this.modules.set(mod.manifest.id, mod);
    return mod;
  }

  registerAll(mods: KlorkAppModule[]): void {
    mods.forEach((m) => this.register(m));
  }

  get(id: AppId): KlorkAppModule | undefined {
    return this.modules.get(id);
  }

  has(id: AppId): boolean {
    return this.modules.has(id);
  }

  manifest(id: AppId): AppManifest | undefined {
    return this.modules.get(id)?.manifest;
  }

  /** all installed manifests, in registration order */
  manifests(): AppManifest[] {
    return [...this.modules.values()].map((m) => m.manifest);
  }

  ids(): AppId[] {
    return [...this.modules.keys()];
  }
}

/** the singleton registry shared by the whole OS */
export const AppRegistry = new KlorkAppRegistry();

/**
 * Contract helper for app modules.
 *
 * Every app component is automatically wrapped in React.memo, so a window
 * re-rendering its chrome (focus, z-index, title bar state) can never
 * re-render the app's tree — its props (`windowId`, `api`) are referentially
 * stable, so the memo comparison always short-circuits.
 */
export function defineApp(mod: KlorkAppModule): KlorkAppModule {
  return {
    manifest: mod.manifest,
    Component: memo(mod.Component) as KlorkAppModule["Component"],
  };
}
