/* ================================================================== */
/*  useKlorkAPI — builds the SDK surface for one running window        */
/*                                                                     */
/*  Called once per WindowFrame; the resulting object is injected      */
/*  into the app component as the `api` prop. Because it subscribes    */
/*  to the store, `api.theme.current` stays live (accent / wallpaper   */
/*  changes re-render the host app).                                   */
/* ================================================================== */

import { useMemo } from "react";
import { useOSStore } from "../store/useOSStore";
import type { KlorkAPI } from "../types/os";

export function useKlorkAPI(windowId: string): KlorkAPI {
  const openWindow = useOSStore((s) => s.openWindow);
  const closeWindow = useOSStore((s) => s.closeWindow);
  const minimizeWindow = useOSStore((s) => s.minimizeWindow);
  const notify = useOSStore((s) => s.notify);
  const accent = useOSStore((s) => s.accent);
  const wallpaper = useOSStore((s) => s.wallpaper);
  const setAccent = useOSStore((s) => s.setAccent);
  const appId = useOSStore(
    (s) => s.windows.find((w) => w.id === windowId)?.appId
  );

  return useMemo<KlorkAPI>(
    () => ({
      windows: {
        open: (id) => openWindow(id),
        notify: (title, msg) => notify(title, msg, appId),
        close: (id) => closeWindow(id ?? windowId),
        minimize: (id) => minimizeWindow(id ?? windowId),
        self: { id: windowId, appId: appId ?? "" },
      },
      theme: {
        current: { mode: "dark", accent, wallpaper },
        setAccent,
      },
    }),
    [
      openWindow,
      closeWindow,
      minimizeWindow,
      notify,
      setAccent,
      windowId,
      appId,
      accent,
      wallpaper,
    ]
  );
}
