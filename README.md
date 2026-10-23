# Klork.os

**A web-based operating system prototype, built as a single-page React app.**

Klork.os is a dark, desktop-and-mobile OS shell that runs entirely in your browser where every app is a *Component*. It ships with a window engine, built-in apps, an App Store, notifications, theming, and a mock virtual filesystem, all bundled into one self-contained file.

## Features

- **Window engine**: open, focus, minimize, restore, maximize, drag, resize, and close windows (powered by `react-rnd`)
- **Desktop shell**: top bar, taskbar/dock, start menu, context menu, desktop icons, and a boot screen
- **Mobile shell**: at or below 768px the OS switches to a full-screen app paradigm with a home screen, dock, and status bar, using 44px minimum touch targets
- **Built-in apps**: About, Music, File Explorer, Terminal, App Store, Preview, Projects, Browser, Notes, Hello, and Settings
- **App Store**: install apps from a catalog (Weather Glass, Calculator, Focus Timer, System Monitor, Accent Lab, Lo-Fi Radio), including remote third-party modules
- **Notifications**: system-wide notification center driven by the app API
- **Personalization**: wallpapers and a live accent color exposed as the `--accent` CSS variable
- **Mock virtual filesystem**: a simulated VFS used by the File Explorer, Terminal, and Preview apps
- **Fault isolation**: remote app failures are caught by an error boundary and never crash the shell
- **Reduced-motion support** and transform/opacity-only animations for smooth performance

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 19 |
| Language | TypeScript (strict mode) |
| Build | Vite 7 + `vite-plugin-singlefile` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| State | Zustand 5 |
| Animation | Framer Motion |
| Window drag/resize | react-rnd |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20 or newer (Vite 7 requires it)
- npm

### Install and run

```bash
git clone https://github.com/KLorK-Tec/KLorK.OS-WEB.git
cd KLorK.OS-WEB
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Produce a production build (single-file output in `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npx tsc --noEmit` | Type-check the project |

> `npm run build` runs Vite only and does **not** type-check. Run `npx tsc --noEmit` before treating a change as verified. There are currently no test or lint scripts.

## Project Structure

```
.
├── index.html
├── public/
│   └── wallpapers/          # Wallpaper images
└── src/
    ├── main.tsx             # Entry point: installs runtime SDK, registers apps, mounts <App />
    ├── App.tsx              # OS root: viewport/mobile sync, Desktop, boot overlay
    ├── components/          # Shell: desktop, taskbar, windows, menus, notifications, mobile/
    ├── os/                  # App registry, resolver, runtime SDK, dynamic loader, icons, VFS
    ├── store/               # Zustand store (useOSStore) and narrow selectors
    ├── types/os.ts          # Manifest, SDK, window, notification, and store types
    ├── apps/                # Built-in apps and the App Store catalog
    └── utils/cn.ts          # clsx + tailwind-merge helper
```

The `@/*` path alias maps to `src/*`.

## Building Apps

Every built-in app is a `KlorkAppModule`: a static manifest plus a React component.

```tsx
import { defineApp } from "@/os/AppRegistry";

export const app = defineApp({
  manifest: {
    id: "unique-app-id",
    name: "Display Name",
    icon: SomeLucideIcon,
    version: "1.0.0",
    defaultSize: { width: 660, height: 540 },
    tile: "from-violet-500 to-fuchsia-600",
  },
  Component: AppComponent,
});
```

1. Create your app module under `src/apps/`.
2. Register it in `src/apps/builtins.ts`. Registration order controls dock, start menu, and desktop ordering.
3. Your component receives `{ windowId, api }`:
   - `api.windows` to open, close, minimize, and send notifications
   - `api.theme.current` for the accent and wallpaper, and `api.theme.setAccent` to change the accent

### Dynamic and store apps

Apps that aren't built in are resolved by `src/os/DynamicAppLoader.tsx`:

- Store listings must stay JSON-serializable, since installed apps persist to `localStorage`.
- Icons are passed as an `iconName` and resolved through `src/os/iconRegistry.ts`.
- Inline catalog apps provide an ES module `source`; third-party apps can provide a remote `entry` URL.
- Remote modules are plain JavaScript and use React from `window.__KLORK_SDK__`.
- Supported export shapes: a default or `app` export of `{ manifest, Component }`, a default component export, or a named `Component` export.

## State and Persistence

- Global OS state (windows, focus, notifications, personalization, mobile state, installed apps) lives in `src/store/useOSStore.ts`.
- Prefer the selectors in `src/store/selectors.ts` over subscribing to the whole store, and use `useShallow` for arrays of primitives.
- Only the wallpaper, the accent color, and installed App Store apps persist across reloads. Window sessions are intentionally not persisted.

## Contributing

1. Keep the established dark OS aesthetic and use Tailwind utility classes.
2. Avoid expensive backdrop filters, large shadows, or per-frame store updates on animated shell surfaces.
3. Before opening a PR:
   - Run `npx tsc --noEmit`
   - Run `npm run build` if build behavior may be affected
   - Check `npm run dev` at both desktop and mobile widths when touching the shell, windows, apps, or responsive logic
   - Confirm windows can open, focus, minimize, restore, maximize, resize, and close
   - Confirm App Store installs and dynamic apps still resolve

See [`AGENTS.md`](./AGENTS.md) for the full architecture and conventions guide.

## License

Released under the [MIT License](./LICENSE).
