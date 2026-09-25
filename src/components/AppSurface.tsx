import { memo } from "react";
import { AppRegistry } from "../os/AppRegistry";
import { DynamicAppLoader } from "../os/DynamicAppLoader";
import { useOSStore } from "../store/useOSStore";
import type { KlorkAPI } from "../types/os";

/* ================================================================== */
/*  AppSurface                                                         */
/*                                                                     */
/*  The single place an app's React tree is mounted.                   */
/*                                                                     */
/*  Memoized on (windowId, appId, api). `api` is memoized inside       */
/*  useKlorkAPI, so focus changes, z-index changes, drags and resizes  */
/*  re-render the window *chrome* only — this subtree is untouched     */
/*  and, critically, never unmounts (app state, scroll offsets and     */
/*  timers all survive).                                               */
/* ================================================================== */

const AppSurface = memo(function AppSurface({
  windowId,
  appId,
  api,
}: {
  windowId: string;
  appId: string;
  api: KlorkAPI;
}) {
  const mod = AppRegistry.get(appId);
  // only subscribes when the app is NOT built-in
  const installed = useOSStore((s) =>
    mod ? undefined : s.installedApps.find((a) => a.id === appId)
  );

  return mod ? (
    <mod.Component windowId={windowId} api={api} />
  ) : (
    <DynamicAppLoader
      record={installed}
      appId={appId}
      windowId={windowId}
      api={api}
    />
  );
});

export default AppSurface;
