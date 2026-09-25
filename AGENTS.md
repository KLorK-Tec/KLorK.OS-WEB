# Klork.os / Osold

Klork.os is a web-based operating system prototype built as a single-page React app. The package name is `react-vite-tailwind`, but the product/UI is called Klork.os. It is a dark, desktop/mobile OS shell with a window engine, built-in apps, an App Store, notifications, theming, and a mock virtual filesystem.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npx tsc --noEmit
```

Notes:

- `npm run build` runs Vite only; it does not run TypeScript. Run `npx tsc --noEmit` before treating a change as verified.
- There are currently no test or lint scripts.
- The project uses `vite-plugin-singlefile`, so the production build is intended to be a self-contained single-file app.
- Wallpapers and static assets live in `public/wallpapers`.

## Stack

- React 19 + React DOM
- TypeScript with strict mode, `noUnusedLocals`, and `noUnusedParameters`
- Vite 7 + `@vitejs/plugin-react`
- Tailwind CSS 4 via `@tailwindcss/vite`
- Zustand for OS state and the VFS selection store
- Framer Motion for shell/window animation
- react-rnd for desktop window drag/resize
- Lucide React for icons
- Path alias: `@/*` maps to `src/*`

## Project layout

- `src/main.tsx` — React entry point. Installs the global runtime SDK before dynamic apps can evaluate, registers built-in apps, then mounts `App`.
- `src/App.tsx` — OS root. Syncs viewport/mobile state and renders `Desktop` plus the boot overlay.
- `src/components/` — OS shell: desktop, top bar, taskbar/dock, window frames, context menu, notifications, boot screen, and mobile shell components.
- `src/os/` — OS infrastructure: app registry, app resolution, runtime SDK, dynamic app loader, icon registry, viewport helpers, and mock VFS.
- `src/store/useOSStore.ts` — central Zustand store for windows, focus, notifications, personalization, mobile state, and installed apps.
- `src/store/selectors.ts` — narrow store selectors used to avoid unnecessary shell re-renders.
- `src/types/os.ts` — app/plugin manifest, SDK, window, notification, and App Store types.
- `src/apps/` — built-in applications and the App Store catalog.
- `src/utils/cn.ts` — Tailwind-friendly class merge helper using `clsx` and `tailwind-merge`.

## App architecture

Every built-in app is a `KlorkAppModule`: a static manifest plus a React component. Apps are registered into the singleton `AppRegistry` at startup. Registration order controls dock/start-menu/desktop ordering.

A typical app exports:

```tsx
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

Rules:

- Add new built-in app modules under `src/apps/`.
- Register them in `src/apps/builtins.ts`.
- App components receive `KlorkAppProps`: `{ windowId, api }`.
- Use the injected `api.windows` methods for open/close/minimize/notify.
- Use `api.theme.current` for accent and wallpaper and `api.theme.setAccent` for accent changes.
- `defineApp` memoizes the component; do not bypass it for built-ins.
- Keep app props stable when possible so window chrome updates do not re-render app content.

## Dynamic and store apps

`src/os/DynamicAppLoader.tsx` handles apps not present in the built-in registry.

- Store listings must remain JSON-serializable because installed apps persist to localStorage.
- Icons travel as `iconName` and are resolved through `src/os/iconRegistry.ts`.
- Inline catalog apps use ES module `source`; real third-party apps may use a remote `entry` URL.
- Remote modules are plain JavaScript and use React from `window.__KLORK_SDK__`.
- Supported remote module shapes include default/`app` exports containing `{ manifest, Component }`, default component exports, and named `Component` exports.
- Remote app failures are contained by an error boundary and should not crash the OS shell.

## State conventions

- Prefer selectors from `src/store/selectors.ts` over subscribing to the whole store.
- Use `useShallow` for arrays of primitives.
- Avoid broad `useOSStore()` subscriptions; they can re-render the desktop, taskbar, and all windows on unrelated mutations.
- Only durable preferences (`wallpaper`, `accent`) and installed App Store apps persist across reloads.
- Window session state is intentionally not persisted.
- Desktop drag/resize geometry is committed to the store once, on gesture stop, not continuously during the gesture.

## UI/performance conventions

- Preserve the established dark OS aesthetic.
- Use Tailwind utility classes.
- The active accent is exposed as the `--accent` CSS variable.
- Prefer transform/opacity-only animations.
- Avoid adding expensive backdrop filters, large shadows, or per-frame store updates to frequently animated shell surfaces.
- Mobile uses a distinct full-screen app paradigm at or below the `MOBILE_BREAKPOINT` value in `useOSStore.ts`.
- Maintain accessible touch targets on mobile; the shell targets a 44px minimum.
- Respect reduced-motion behavior already encoded in `src/index.css`.

## Verification checklist

For TypeScript/React changes:

1. Run `npx tsc --noEmit`.
2. Run `npm run build` if bundle/build behavior may be affected.
3. Manually check `npm run dev` for desktop and mobile-width behavior when touching shell, windows, apps, or responsive logic.
4. Confirm windows can open, focus, minimize, restore, maximize, resize, and close when touching the window engine.
5. Confirm App Store installs and dynamic apps still resolve when touching the registry/loader/store.