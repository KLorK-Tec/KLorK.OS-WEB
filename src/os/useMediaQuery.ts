/* ================================================================== */
/*  Viewport detection                                                 */
/*                                                                     */
/*  `useMediaQuery` is a generic subscription to a CSS media query     */
/*  built on useSyncExternalStore (no effect-driven flash on mount).   */
/*                                                                     */
/*  `useViewportSync` runs once at the OS root and mirrors the         */
/*  result into the Zustand store, so non-React code and any           */
/*  component can read `isMobile` without re-subscribing.              */
/* ================================================================== */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { MOBILE_BREAKPOINT, useOSStore } from "../store/useOSStore";

export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;
export { MOBILE_BREAKPOINT };

/** trailing-edge debounce used for all viewport listeners */
export const VIEWPORT_DEBOUNCE_MS = 150;

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => {
    if (t) clearTimeout(t);
    t = undefined;
  };
  return wrapped;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);

      /*
       * `change` fires once when the breakpoint is actually crossed, so it
       * stays immediate. `resize` fires continuously while the user drags
       * the browser edge — debounced so it can't spam React state.
       */
      const onResize = debounce(onChange, VIEWPORT_DEBOUNCE_MS);

      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else mql.addListener(onChange);
      window.addEventListener("resize", onResize, { passive: true });
      window.addEventListener("orientationchange", onResize, { passive: true });

      return () => {
        onResize.cancel();
        if (mql.removeEventListener) mql.removeEventListener("change", onChange);
        else mql.removeListener(onChange);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      };
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** true when the viewport is a phone-sized screen */
export const useIsMobile = (): boolean => useMediaQuery(MOBILE_QUERY);

/**
 * Mount once (in <App/>): keeps store.isMobile / viewport in sync and
 * normalizes window state when crossing the breakpoint.
 */
export function useViewportSync(): boolean {
  const isMobile = useIsMobile();
  const setIsMobile = useOSStore((s) => s.setIsMobile);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  useEffect(() => {
    const commit = () =>
      useOSStore.getState().setViewport(window.innerWidth, window.innerHeight);
    // debounced: a window resize drag emits hundreds of events per second
    const onResize = debounce(commit, VIEWPORT_DEBOUNCE_MS);
    commit(); // seed immediately on mount
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    return () => {
      onResize.cancel();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return isMobile;
}
