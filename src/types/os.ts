/* ================================================================== */
/*  Klork.os SDK — App Plugin Contract                                 */
/*                                                                     */
/*  Every app shipped with (or installed into) Klork.os is a           */
/*  `KlorkAppModule`: a static `AppManifest` describing the app,       */
/*  plus a React `Component` that receives `windowId` and an           */
/*  injected `KlorkAPI` instance as props at mount time.               */
/* ================================================================== */

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/** apps are addressed by a unique string id ("terminal", "hello", …) */
export type AppId = string;

export interface Size {
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  Manifest — static metadata, available without running the app      */
/* ------------------------------------------------------------------ */

export interface AppManifest {
  /** unique identifier used by windows.open(id) and the taskbar */
  id: AppId;
  /** display name (window title, dock tooltip, start menu) */
  name: string;
  /** lucide icon used across the OS chrome */
  icon: LucideIcon;
  /** semver string, e.g. "1.0.0" */
  version: string;
  /** initial window size when first opened */
  defaultSize: Size;
  /** optional per-app minimum window size */
  minSize?: Size;
  /** gradient utility classes for the icon tile (klork chrome) */
  tile?: string;
}

/* ------------------------------------------------------------------ */
/*  KlorkAPI — the surface injected into every running app             */
/* ------------------------------------------------------------------ */

/** handle identifying the window an app instance is running in */
export interface WindowHandle {
  id: string;
  appId: AppId;
}

export interface OSTheme {
  mode: "dark";
  /** active accent color (hex) */
  accent: string;
  /** active wallpaper asset path */
  wallpaper: string;
}

export interface KlorkWindowsAPI {
  /** open (or focus/restore) another app by id */
  open: (appId: AppId) => void;
  /** push a system notification toast */
  notify: (title: string, msg: string) => void;
  /** close a window — defaults to the caller's own window */
  close: (windowId?: string) => void;
  /** minimize a window — defaults to the caller's own window */
  minimize: (windowId?: string) => void;
  /** the window this app instance lives in */
  self: WindowHandle;
}

export interface KlorkThemeAPI {
  /** snapshot of the live theme (reactive — re-renders on change) */
  current: OSTheme;
  setAccent: (hex: string) => void;
}

export interface KlorkAPI {
  windows: KlorkWindowsAPI;
  theme: KlorkThemeAPI;
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export interface OSNotification {
  id: string;
  appId?: AppId;
  title: string;
  msg: string;
  at: number;
}

/* ------------------------------------------------------------------ */
/*  The module contract                                                */
/* ------------------------------------------------------------------ */

/** props every app component receives from the window engine */
export interface KlorkAppProps {
  windowId: string;
  api: KlorkAPI;
}

/** an installable app: manifest + component */
export interface KlorkAppModule {
  manifest: AppManifest;
  Component: ComponentType<KlorkAppProps>;
}

/* ------------------------------------------------------------------ */
/*  App Store — third-party / dynamically loaded apps                  */
/*                                                                     */
/*  Store listings must be JSON-serializable (they persist to          */
/*  localStorage), so the icon travels as a *name* that the icon       */
/*  registry resolves back into a component at runtime.                */
/* ------------------------------------------------------------------ */

export interface StoreListing {
  id: AppId;
  name: string;
  version: string;
  author: string;
  tagline: string;
  description: string;
  category: "Utilities" | "Productivity" | "Developer" | "Fun";
  /** key into the icon registry (src/os/iconRegistry.ts) */
  iconName: string;
  tile: string;
  defaultSize: Size;
  minSize?: Size;
  /** download size label, e.g. "48 KB" */
  weight: string;
  rating: number;
  installs: string;
  verified?: boolean;
  /** remote ES module URL — imported at runtime via import(url) */
  entry?: string;
  /** inline ES module source (mock CDN payload → Blob URL) */
  source?: string;
}

/** a listing the user has installed — persisted in the OS store */
export interface InstalledApp extends StoreListing {
  installedAt: number;
}

/** the runtime surface exposed to dynamically loaded modules */
export interface KlorkGlobalSDK {
  React: typeof import("react");
  version: string;
}
