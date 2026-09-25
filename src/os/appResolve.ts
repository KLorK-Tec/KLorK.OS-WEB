/* ================================================================== */
/*  App resolution — merges built-in registry apps with installed      */
/*  third-party apps into a single reactive list.                      */
/*                                                                     */
/*  The AppRegistry is a static singleton, so chrome components can't  */
/*  subscribe to it directly. Installed apps live in the Zustand       */
/*  store — reading both through these hooks means the taskbar,        */
/*  start menu and desktop re-render the moment an app is installed.   */
/* ================================================================== */

import { useMemo } from "react";
import { AppRegistry } from "./AppRegistry";
import { resolveIcon } from "./iconRegistry";
import { useOSStore } from "../store/useOSStore";
import type { AppManifest, InstalledApp } from "../types/os";

/** installed store listing → runtime manifest (icon name → component) */
export const toManifest = (a: InstalledApp): AppManifest => ({
  id: a.id,
  name: a.name,
  icon: resolveIcon(a.iconName),
  version: a.version,
  defaultSize: a.defaultSize,
  minSize: a.minSize,
  tile: a.tile,
});

/** every app available on this system, built-ins first */
export function useAllApps(): AppManifest[] {
  const installedApps = useOSStore((s) => s.installedApps);
  return useMemo(
    () => [...AppRegistry.manifests(), ...installedApps.map(toManifest)],
    [installedApps]
  );
}

/** manifest for a single app id (built-in or installed) */
export function useAppManifest(appId: string): AppManifest | undefined {
  const record = useOSStore((s) => s.installedApps.find((a) => a.id === appId));
  return useMemo(() => {
    const builtin = AppRegistry.manifest(appId);
    if (builtin) return builtin;
    return record ? toManifest(record) : undefined;
  }, [appId, record]);
}

/** non-reactive lookup for code outside React (notifications, terminal…) */
export function getManifest(appId: string): AppManifest | undefined {
  const builtin = AppRegistry.manifest(appId);
  if (builtin) return builtin;
  const record = useOSStore
    .getState()
    .installedApps.find((a) => a.id === appId);
  return record ? toManifest(record) : undefined;
}

/** ids of everything installed, for the terminal's `apps` command */
export const getAllAppIds = (): string[] => [
  ...AppRegistry.ids(),
  ...useOSStore.getState().installedApps.map((a) => a.id),
];
