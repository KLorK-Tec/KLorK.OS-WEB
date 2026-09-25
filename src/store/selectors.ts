/* ================================================================== */
/*  Granular store selectors                                           */
/*                                                                     */
/*  Subscribing with `useOSStore()` (no selector) makes a component    */
/*  re-render on EVERY store mutation — a drag-stop on window A would  */
/*  re-render the desktop, the taskbar and every other window.         */
/*                                                                     */
/*  These hooks subscribe to the narrowest possible slice:             */
/*    · primitives / booleans           → compared with Object.is      */
/*    · arrays of primitives            → compared with useShallow     */
/*    · single window objects           → referentially stable unless  */
/*      that specific window changed (the reducers preserve identity   */
/*      of untouched windows via .map)                                 */
/* ================================================================== */

import { useShallow } from "zustand/react/shallow";
import { useOSStore, type OSState, type OSWindow } from "./useOSStore";

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/*                                                                     */
/*  Every action is created once inside `create()` and never replaced, */
/*  so these selections are permanently stable and never re-render.    */
/* ------------------------------------------------------------------ */

const windowActions = (s: OSState) => ({
  openWindow: s.openWindow,
  closeWindow: s.closeWindow,
  focusWindow: s.focusWindow,
  minimizeWindow: s.minimizeWindow,
  restoreWindow: s.restoreWindow,
  toggleMaximize: s.toggleMaximize,
  setBounds: s.setBounds,
  goHome: s.goHome,
});

export function useWindowActions() {
  return useOSStore(useShallow(windowActions));
}

/* ------------------------------------------------------------------ */
/*  Window engine                                                      */
/* ------------------------------------------------------------------ */

/**
 * Only the *set* of open windows. Dragging, focusing, minimizing or
 * resizing never changes this array's contents, so the window layer
 * re-renders solely on open/close.
 */
export function useWindowIds(): string[] {
  return useOSStore(useShallow((s) => s.windows.map((w) => w.id)));
}

/** A single window record — stable identity unless *this* window changed. */
export function useWindow(windowId: string): OSWindow | undefined {
  return useOSStore((s) => s.windows.find((w) => w.id === windowId));
}

/** Focus state as a boolean: flips only for the two windows involved. */
export function useIsWindowActive(windowId: string): boolean {
  return useOSStore((s) => s.activeWindowId === windowId);
}

/* ------------------------------------------------------------------ */
/*  Taskbar / dock                                                     */
/*                                                                     */
/*  Expressed as arrays of primitives so a drag (which mutates only    */
/*  position/size) produces an identical snapshot → zero re-renders.   */
/* ------------------------------------------------------------------ */

export function useOpenAppIds(): string[] {
  return useOSStore(useShallow((s) => s.windows.map((w) => w.appId)));
}

export function useMinimizedAppIds(): string[] {
  return useOSStore(
    useShallow((s) =>
      s.windows.filter((w) => w.isMinimized).map((w) => w.appId)
    )
  );
}

/** appId of the focused window (not the window id) — dock highlighting. */
export function useActiveAppId(): string | null {
  return useOSStore(
    (s) => s.windows.find((w) => w.id === s.activeWindowId)?.appId ?? null
  );
}

/** window id for an appId — single-instance lookup used by dock clicks. */
export function useWindowIdForApp(appId: string): string | null {
  return useOSStore((s) => s.windows.find((w) => w.appId === appId)?.id ?? null);
}

export function useRunningWindowCount(): number {
  return useOSStore((s) => s.windows.length);
}

export function useAnyWindowVisible(): boolean {
  return useOSStore((s) => s.windows.some((w) => !w.isMinimized));
}

/* ------------------------------------------------------------------ */
/*  Shell / theme                                                      */
/* ------------------------------------------------------------------ */

export const useAccent = () => useOSStore((s) => s.accent);
export const useWallpaper = () => useOSStore((s) => s.wallpaper);
export const useIsMobileMode = () => useOSStore((s) => s.isMobile);

/** Title of the focused window — used by the desktop menu bar. */
export function useActiveWindowTitle(): string {
  return useOSStore(
    (s) => s.windows.find((w) => w.id === s.activeWindowId)?.title ?? "Desktop"
  );
}
