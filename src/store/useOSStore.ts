import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppRegistry } from "../os/AppRegistry";
import type { InstalledApp, OSNotification, StoreListing } from "../types/os";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowBounds extends WindowPosition, WindowSize {}

export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  /** bounds to restore after un-maximizing */
  prevBounds: WindowBounds | null;
}

export interface Wallpaper {
  name: string;
  path: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const TOP_BAR_H = 40;
export const DOCK_CLEARANCE = 96; // reserved space above the dock
export const MIN_WIN = { width: 340, height: 240 };

/* --- mobile paradigm ---------------------------------------------- */
/** viewports at or below this width switch to the mobile OS shell */
export const MOBILE_BREAKPOINT = 768;
/** status bar height on mobile */
export const MOBILE_STATUS_H = 34;
/** home-indicator / dock strip height on mobile */
export const MOBILE_DOCK_H = 88;
/** minimum accessible touch target (WCAG 2.5.5) */
export const TOUCH_TARGET = 44;

export const WALLPAPERS: Wallpaper[] = [
  { name: "Aurora", path: "/wallpapers/aurora.jpg" },
  { name: "Peaks", path: "/wallpapers/peaks.jpg" },
  { name: "Nebula", path: "/wallpapers/nebula.jpg" },
  { name: "Dunes", path: "/wallpapers/dunes.jpg" },
];

export const ACCENTS = [
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Cyan", hex: "#22d3ee" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#fb7185" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 0;
const nextWindowId = (appId: string) => `${appId}:${++idCounter}`;

let notificationCounter = 0;

/** topmost non-minimized window */
const topmostOf = (windows: OSWindow[]): OSWindow | undefined =>
  windows
    .filter((w) => !w.isMinimized)
    .reduce<OSWindow | undefined>(
      (top, w) => (top === undefined || w.zIndex > top.zIndex ? w : top),
      undefined
    );

/** keep z-indexes bounded — renormalize when running hot */
const normalizeZ = (windows: OSWindow[]): OSWindow[] =>
  [...windows]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((w, i) => ({ ...w, zIndex: 10 + i }));

const workAreaHeight = () =>
  (typeof window !== "undefined" ? window.innerHeight : 900) - TOP_BAR_H;
const workAreaWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1440;

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export interface OSState {
  /** session */
  booted: boolean;
  /** viewport — drives the desktop ⇄ mobile paradigm switch */
  isMobile: boolean;
  viewport: { width: number; height: number };
  /** mobile home screen: which app the user launched most recently */
  recentApps: string[];
  /** personalization */
  wallpaper: string;
  accent: string;
  /** window engine */
  windows: OSWindow[];
  activeWindowId: string | null;
  zCounter: number;
  /** notification center */
  notifications: OSNotification[];
  /** third-party apps installed from the App Store (persisted) */
  installedApps: InstalledApp[];

  /* session actions */
  setBooted: (v: boolean) => void;

  /* viewport actions */
  setIsMobile: (v: boolean) => void;
  setViewport: (width: number, height: number) => void;
  /** mobile: send every window to the background (home gesture) */
  goHome: () => void;

  /* personalization actions */
  setWallpaper: (path: string) => void;
  setAccent: (hex: string) => void;

  /* window engine actions */
  openWindow: (appId: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setBounds: (id: string, bounds: Partial<WindowBounds>) => void;
  minimizeAll: () => void;
  closeAllWindows: () => void;

  /* notification actions (SDK: windows.notify) */
  notify: (title: string, msg: string, appId?: string) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  /* app store actions */
  installApp: (listing: StoreListing) => void;
  uninstallApp: (appId: string) => void;
}

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      booted: false,
      isMobile:
        typeof window !== "undefined"
          ? window.innerWidth <= MOBILE_BREAKPOINT
          : false,
      viewport: {
        width: typeof window !== "undefined" ? window.innerWidth : 1440,
        height: typeof window !== "undefined" ? window.innerHeight : 900,
      },
      recentApps: [],
      wallpaper: WALLPAPERS[0].path,
      accent: ACCENTS[0].hex,
      windows: [],
      activeWindowId: null,
      zCounter: 10,
      notifications: [],
      installedApps: [],

      setBooted: (v) => set({ booted: v }),
      setWallpaper: (path) => set({ wallpaper: path }),
      setAccent: (hex) => set({ accent: hex }),

      /* ------------------------------------------------------------ */
      /*  Viewport                                                     */
      /* ------------------------------------------------------------ */
      setIsMobile: (v) =>
        set((s) => {
          if (s.isMobile === v) return s;
          if (v) {
            // entering mobile: windows are full-screen, drop maximize state
            return {
              isMobile: true,
              windows: s.windows.map((w) => ({
                ...w,
                isMaximized: false,
                prevBounds: null,
              })),
            };
          }
          // returning to desktop: re-cascade so nothing sits off-screen
          const vw = workAreaWidth();
          const vh = workAreaHeight();
          return {
            isMobile: false,
            windows: s.windows.map((w, i) => {
              const width = Math.min(w.size.width, vw - 48);
              const height = Math.min(w.size.height, vh - DOCK_CLEARANCE - 24);
              return {
                ...w,
                size: { width, height },
                position: {
                  x: Math.min(Math.max(24, 80 + (i % 5) * 40), Math.max(24, vw - width - 24)),
                  y: Math.min(Math.max(16, 40 + (i % 5) * 34), Math.max(16, vh - height - DOCK_CLEARANCE)),
                },
              };
            }),
          };
        }),

      setViewport: (width, height) =>
        set((s) =>
          s.viewport.width === width && s.viewport.height === height
            ? s
            : { viewport: { width, height } }
        ),

      /** mobile home gesture — background everything, keep it running */
      goHome: () =>
        set((s) => ({
          windows: s.windows.map((w) => ({ ...w, isMinimized: true })),
          activeWindowId: null,
        })),

      /* ------------------------------------------------------------ */
      openWindow: (appId) =>
        set((s) => {
          // resolve size/title from the registry OR an installed app
          const builtin = AppRegistry.manifest(appId);
          const installed = s.installedApps.find((a) => a.id === appId);
          const meta = builtin ?? installed;
          if (!meta) {
            console.warn(`[klork.os] cannot open unknown app "${appId}"`);
            return s;
          }

          let nextZ = s.zCounter + 1;
          const recentApps = [
            appId,
            ...s.recentApps.filter((a) => a !== appId),
          ].slice(0, 8);

          // single-instance: focus / restore an already-open app
          const existing = s.windows.find((w) => w.appId === appId);
          if (existing) {
            const windows = s.windows.map((w) =>
              w.id === existing.id
                ? { ...w, isMinimized: false, zIndex: nextZ }
                : w
            );
            return {
              windows,
              activeWindowId: existing.id,
              zCounter: nextZ,
              recentApps,
            };
          }

          const vw = workAreaWidth();
          const vh = workAreaHeight();

          // mobile windows are full-screen; bounds are computed by the frame
          const size: WindowSize = s.isMobile
            ? { width: vw, height: vh }
            : {
                width: Math.min(meta.defaultSize.width, vw - 48),
                height: Math.min(
                  meta.defaultSize.height,
                  vh - DOCK_CLEARANCE - 24
                ),
              };

          // cascade new windows
          const n = s.windows.length;
          let x = 96 + (n % 5) * 44;
          let y = 48 + (n % 5) * 36;
          if (x + size.width > vw - 24) x = Math.max(24, (vw - size.width) / 2);
          if (y + size.height > vh - DOCK_CLEARANCE)
            y = Math.max(16, (vh - size.height) / 2 - 20);

          let windows: OSWindow[] = [
            ...s.windows,
            {
              id: nextWindowId(appId),
              appId,
              title: meta.name,
              position: { x, y },
              size,
              zIndex: nextZ,
              isMinimized: false,
              isMaximized: false,
              prevBounds: null,
            },
          ];

          if (nextZ > 3900) {
            windows = normalizeZ(windows);
            nextZ = 10 + windows.length;
          }

          return {
            windows,
            activeWindowId: windows[windows.length - 1].id,
            zCounter: nextZ,
            recentApps,
          };
        }),

      /* ------------------------------------------------------------ */
      closeWindow: (id) =>
        set((s) => {
          const windows = s.windows.filter((w) => w.id !== id);
          const top = topmostOf(windows);
          return {
            windows,
            activeWindowId:
              s.activeWindowId === id ? top?.id ?? null : s.activeWindowId,
          };
        }),

      /* ------------------------------------------------------------ */
      focusWindow: (id) =>
        set((s) => {
          const target = s.windows.find((w) => w.id === id);
          if (!target) return s;
          const top = topmostOf(s.windows);
          if (s.activeWindowId === id && top?.id === id && !target.isMinimized)
            return s; // already in front — no-op

          let nextZ = s.zCounter + 1;
          let windows = s.windows.map((w) =>
            w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w
          );
          if (nextZ > 3900) {
            windows = normalizeZ(windows);
            nextZ = 10 + windows.length;
          }
          return { windows, activeWindowId: id, zCounter: nextZ };
        }),

      /* ------------------------------------------------------------ */
      minimizeWindow: (id) =>
        set((s) => {
          const windows = s.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: true } : w
          );
          const top = topmostOf(windows);
          return {
            windows,
            activeWindowId:
              s.activeWindowId === id ? top?.id ?? null : s.activeWindowId,
          };
        }),

      restoreWindow: (id) =>
        set((s) => {
          const nextZ = s.zCounter + 1;
          return {
            windows: s.windows.map((w) =>
              w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w
            ),
            activeWindowId: id,
            zCounter: nextZ,
          };
        }),

      /* ------------------------------------------------------------ */
      toggleMaximize: (id) =>
        set((s) => {
          const nextZ = s.zCounter + 1;
          return {
            windows: s.windows.map((w) => {
              if (w.id !== id) return w;
              if (w.isMaximized) {
                return {
                  ...w,
                  isMaximized: false,
                  zIndex: nextZ,
                  position: w.prevBounds
                    ? { x: w.prevBounds.x, y: w.prevBounds.y }
                    : w.position,
                  size: w.prevBounds
                    ? { width: w.prevBounds.width, height: w.prevBounds.height }
                    : w.size,
                  prevBounds: null,
                };
              }
              return {
                ...w,
                isMaximized: true,
                zIndex: nextZ,
                prevBounds: { ...w.position, ...w.size },
              };
            }),
            activeWindowId: id,
            zCounter: nextZ,
          };
        }),

      /* ------------------------------------------------------------ */
      setBounds: (id, bounds) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id && !w.isMaximized
              ? {
                  ...w,
                  position: {
                    x: bounds.x ?? w.position.x,
                    y: bounds.y ?? w.position.y,
                  },
                  size: {
                    width: bounds.width ?? w.size.width,
                    height: bounds.height ?? w.size.height,
                  },
                }
              : w
          ),
        })),

      /* ------------------------------------------------------------ */
      minimizeAll: () =>
        set((s) => ({
          windows: s.windows.map((w) => ({ ...w, isMinimized: true })),
          activeWindowId: null,
        })),

      closeAllWindows: () => set({ windows: [], activeWindowId: null }),

      /* ------------------------------------------------------------ */
      notify: (title, msg, appId) => {
        const id = `ntf-${++notificationCounter}`;
        set((s) => ({
          notifications: [
            ...s.notifications,
            { id, title, msg, appId, at: Date.now() },
          ].slice(-5),
        }));
        setTimeout(() => get().dismissNotification(id), 4500);
      },

      dismissNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      /* ------------------------------------------------------------ */
      /*  App Store                                                    */
      /* ------------------------------------------------------------ */
      installApp: (listing) =>
        set((s) => {
          if (s.installedApps.some((a) => a.id === listing.id)) return s;
          return {
            installedApps: [
              ...s.installedApps,
              { ...listing, installedAt: Date.now() },
            ],
          };
        }),

      uninstallApp: (appId) =>
        set((s) => ({
          installedApps: s.installedApps.filter((a) => a.id !== appId),
          // close any running windows of the removed app
          windows: s.windows.filter((w) => w.appId !== appId),
          activeWindowId:
            s.windows.find((w) => w.id === s.activeWindowId)?.appId === appId
              ? null
              : s.activeWindowId,
        })),
    }),
    {
      name: "klork.os",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      /** only durable preferences + installed apps survive a reload */
      partialize: (s) => ({
        installedApps: s.installedApps,
        wallpaper: s.wallpaper,
        accent: s.accent,
      }),
    }
  )
);
