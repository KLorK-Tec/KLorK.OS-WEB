/* ================================================================== */
/*  DynamicAppLoader                                                   */
/*                                                                     */
/*  When an appId isn't found in the local AppRegistry, the window     */
/*  engine falls back to here. We look the app up in the installed     */
/*  list and load its ES module at runtime with a real dynamic         */
/*  `import(url)` — no bundler involvement — wrapped in React.lazy     */
/*  + Suspense and guarded by an error boundary.                       */
/*                                                                     */
/*  Accepted module shapes:                                            */
/*    export default { manifest, Component }   ← KlorkAppModule        */
/*    export const app = { manifest, Component }                       */
/*    export default Component                                         */
/*    export const Component = …                                       */
/* ================================================================== */

import {
  Component as ReactComponent,
  lazy,
  memo,
  Suspense,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { AlertTriangle, Loader2, PackageX } from "lucide-react";
import type { InstalledApp, KlorkAPI, KlorkAppProps } from "../types/os";

/* ------------------------------------------------------------------ */
/*  Module URL resolution                                              */
/* ------------------------------------------------------------------ */

const blobUrls = new Map<string, string>();

/**
 * Real remote apps ship an `entry` URL. Catalog demo apps ship inline
 * `source`, which we turn into an object URL — a genuine ES module the
 * browser fetches and evaluates, exactly like a CDN bundle would be.
 */
function entryUrlFor(record: InstalledApp): string {
  if (record.entry) return record.entry;

  const key = `${record.id}@${record.version}`;
  const cached = blobUrls.get(key);
  if (cached) return cached;

  const url = URL.createObjectURL(
    new Blob([record.source ?? ""], { type: "text/javascript" })
  );
  blobUrls.set(key, url);
  return url;
}

/* ------------------------------------------------------------------ */
/*  Lazy component cache — one React.lazy per app@version              */
/* ------------------------------------------------------------------ */

const lazyCache = new Map<string, ComponentType<KlorkAppProps>>();

export function getRemoteComponent(
  record: InstalledApp
): ComponentType<KlorkAppProps> {
  const key = `${record.id}@${record.version}`;
  const cached = lazyCache.get(key);
  if (cached) return cached;

  const LazyApp = lazy(async () => {
    const url = entryUrlFor(record);

    // the actual dynamic ES module import
    const mod: Record<string, unknown> = await import(
      /* @vite-ignore */ url
    );

    const candidate =
      (mod.default as Record<string, unknown> | undefined) ??
      (mod.app as Record<string, unknown> | undefined);

    const Component =
      (candidate?.Component as ComponentType<KlorkAppProps> | undefined) ??
      (typeof candidate === "function"
        ? (candidate as ComponentType<KlorkAppProps>)
        : undefined) ??
      (mod.Component as ComponentType<KlorkAppProps> | undefined);

    if (typeof Component !== "function") {
      throw new Error(
        `module "${record.id}" does not export a KlorkAppModule (missing Component)`
      );
    }

    // memoized like built-ins: chrome re-renders never reach the app tree
    return { default: memo(Component) as ComponentType<KlorkAppProps> };
  });

  lazyCache.set(key, LazyApp);
  return LazyApp;
}

/** drop a cached module (used on uninstall / reinstall) */
export function invalidateRemoteApp(record: InstalledApp): void {
  const key = `${record.id}@${record.version}`;
  lazyCache.delete(key);
  const url = blobUrls.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    blobUrls.delete(key);
  }
}

/* ------------------------------------------------------------------ */
/*  UI states                                                          */
/* ------------------------------------------------------------------ */

function LoadingPane({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      <p className="font-mono text-[10.5px] tracking-wider text-white/35">
        loading {name} …
      </p>
      <p className="font-mono text-[9px] text-white/20">
        dynamic import() · external module
      </p>
    </div>
  );
}

function ErrorPane({ name, error }: { name: string; error: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/25">
        <AlertTriangle className="h-5 w-5 text-rose-300" />
      </div>
      <p className="text-[13px] font-medium text-white/80">
        {name} failed to load
      </p>
      <p className="max-w-[320px] font-mono text-[10px] leading-relaxed break-words text-white/35">
        {error}
      </p>
      <p className="font-mono text-[9px] text-white/20">
        the module could not be fetched or evaluated
      </p>
    </div>
  );
}

function NotInstalledPane({ appId }: { appId: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
        <PackageX className="h-5 w-5 text-white/30" />
      </div>
      <p className="text-[13px] font-medium text-white/70">App not installed</p>
      <p className="font-mono text-[10.5px] text-white/30">
        no module registered or installed for “{appId}”
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error boundary                                                     */
/* ------------------------------------------------------------------ */

interface BoundaryProps {
  name: string;
  children: ReactNode;
}
interface BoundaryState {
  error: string | null;
}

class RemoteErrorBoundary extends ReactComponent<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[klork.os] remote app "${this.props.name}" crashed`, error, info);
  }

  render() {
    if (this.state.error)
      return <ErrorPane name={this.props.name} error={this.state.error} />;
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/*  Host — what WindowFrame renders for non-built-in apps              */
/* ------------------------------------------------------------------ */

export function DynamicAppLoader({
  record,
  appId,
  windowId,
  api,
}: {
  record?: InstalledApp;
  appId: string;
  windowId: string;
  api: KlorkAPI;
}) {
  if (!record) return <NotInstalledPane appId={appId} />;

  const RemoteApp = getRemoteComponent(record);

  return (
    <RemoteErrorBoundary key={`${record.id}@${record.version}`} name={record.name}>
      <Suspense fallback={<LoadingPane name={record.name} />}>
        <RemoteApp windowId={windowId} api={api} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
