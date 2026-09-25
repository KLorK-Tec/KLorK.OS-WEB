/* ================================================================== */
/*  FileExplorer.app — navigates the Klork VFS                         */
/*                                                                     */
/*  Contract: KlorkAppModule ({ manifest, Component }).                */
/*  Clicking a file sets the VFS preview target and calls              */
/*  api.windows.open("preview-app").                                   */
/* ================================================================== */

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  FileCode2,
  FileImage,
  FileJson,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  HardDrive,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { defineApp } from "../../os/AppRegistry";
import {
  basename,
  isFolder,
  joinPath,
  listDir,
  parentPath,
  useVFSStore,
  type VFSNode,
} from "../../os/vfs";
import type { AppManifest, KlorkAppProps } from "../../types/os";
import { cn } from "../../utils/cn";

const manifest: AppManifest = {
  id: "file-explorer",
  name: "File Explorer",
  icon: Folder,
  version: "2.0.0",
  defaultSize: { width: 760, height: 520 },
  minSize: { width: 460, height: 320 },
  tile: "from-sky-400 to-blue-600",
};

/* ------------------------- icon mapping -------------------------- */

function iconFor(node: VFSNode): { Icon: LucideIcon; cls: string } {
  if (isFolder(node)) return { Icon: Folder, cls: "text-sky-300" };
  switch (node.kind) {
    case "md":
      return { Icon: FileCode2, cls: "text-violet-300" };
    case "json":
      return { Icon: FileJson, cls: "text-amber-300" };
    case "pdf":
      return { Icon: FileType2, cls: "text-rose-300" };
    case "image":
      return { Icon: FileImage, cls: "text-fuchsia-300" };
    case "url":
      return { Icon: Link2, cls: "text-emerald-300" };
    default:
      return { Icon: FileText, cls: "text-zinc-300" };
  }
}

/* ---------------------------- component --------------------------- */

function FileExplorer({ api }: KlorkAppProps) {
  const { lastDir, setLastDir, openPreview } = useVFSStore();
  const [cwd, setCwd] = useState(lastDir);
  const [selected, setSelected] = useState<string | null>(null);
  const accent = api.theme.current.accent;

  const entries = listDir(cwd);
  const segments = cwd.split("/").filter(Boolean);

  const navigate = (path: string) => {
    setCwd(path);
    setLastDir(path);
    setSelected(null);
  };

  /** file click → hand off to preview-app through the SDK */
  const openNode = (node: VFSNode, path: string) => {
    if (isFolder(node)) return navigate(path);
    openPreview(path);
    api.windows.open("preview-app");
  };

  const handleClick = (node: VFSNode, path: string) => {
    setSelected(path);
    if (!isFolder(node)) openNode(node, path); // clicking a file previews it
  };

  const roots = listDir("/").filter(isFolder);

  return (
    <div className="flex h-full bg-zinc-950/20">
      {/* ------------------------- sidebar ------------------------- */}
      <aside className="hidden w-48 shrink-0 flex-col gap-0.5 border-r border-white/[0.06] bg-white/[0.02] p-2 sm:flex">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
          Locations
        </p>
        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors",
            cwd === "/"
              ? "bg-white/10 text-white/90"
              : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
          )}
        >
          <HardDrive className="h-3.5 w-3.5 text-violet-300" />
          klork-disk
        </button>
        {roots.map((r) => {
          const path = joinPath("/", r.name);
          const active = cwd === path || cwd.startsWith(path + "/");
          return (
            <button
              key={r.name}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors",
                active
                  ? "bg-white/10 text-white/90"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
              )}
            >
              {active ? (
                <FolderOpen className="h-3.5 w-3.5 text-sky-300" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-sky-300" />
              )}
              {r.name}
            </button>
          );
        })}

        <div className="mt-auto rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2">
          <p className="font-mono text-[9px] leading-relaxed text-white/30">
            mount /dev/klork0
            <br />
            <span className="text-white/45">{entries.length}</span> entries
          </p>
        </div>
      </aside>

      {/* --------------------------- main -------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* toolbar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
          <button
            onClick={() => navigate(parentPath(cwd))}
            disabled={cwd === "/"}
            className="grid h-6 w-6 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
            aria-label="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigate(parentPath(cwd))}
            disabled={cwd === "/"}
            className="mr-1 grid h-6 w-6 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
            aria-label="Up one level"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>

          {/* breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg border border-white/[0.07] bg-black/30 px-2 py-1">
            <button
              onClick={() => navigate("/")}
              className="rounded px-1 py-0.5 font-mono text-[11px] text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              /
            </button>
            {segments.map((seg, i) => {
              const path = "/" + segments.slice(0, i + 1).join("/");
              const isLast = i === segments.length - 1;
              return (
                <span key={path} className="flex shrink-0 items-center gap-0.5">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-white/20" />}
                  <button
                    onClick={() => navigate(path)}
                    className={cn(
                      "rounded px-1 py-0.5 font-mono text-[11px] transition-colors hover:bg-white/10",
                      isLast ? "text-white/85" : "text-white/45"
                    )}
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* column headers */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.05] px-4 py-1.5 text-[9.5px] font-semibold tracking-widest text-white/25 uppercase">
          <span className="flex-1">Name</span>
          <span className="hidden w-24 md:block">Kind</span>
          <span className="hidden w-20 text-right sm:block">Size</span>
          <span className="hidden w-24 text-right lg:block">Modified</span>
        </div>

        {/* listing */}
        <div
          className="min-h-0 flex-1 overflow-y-auto p-1.5"
          onClick={() => setSelected(null)}
        >
          {entries.length === 0 ? (
            <p className="py-10 text-center font-mono text-[11px] text-white/25">
              folder is empty
            </p>
          ) : (
            entries.map((node) => {
              const path = joinPath(cwd, node.name);
              const { Icon, cls } = iconFor(node);
              const isSel = selected === path;
              return (
                <button
                  key={path}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(node, path);
                  }}
                  onDoubleClick={() => openNode(node, path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                    isSel ? "bg-white/[0.12]" : "hover:bg-white/[0.06]"
                  )}
                  style={isSel ? { boxShadow: `inset 0 0 0 1px ${accent}55` } : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", cls)} strokeWidth={1.8} />
                  <span className="flex-1 truncate text-[12px] text-white/80">
                    {node.name}
                  </span>
                  <span className="hidden w-24 font-mono text-[10px] text-white/30 md:block">
                    {isFolder(node) ? "folder" : node.kind}
                  </span>
                  <span className="hidden w-20 text-right font-mono text-[10px] text-white/30 sm:block">
                    {isFolder(node) ? `${node.children.length} items` : node.size}
                  </span>
                  <span className="hidden w-24 text-right font-mono text-[10px] text-white/25 lg:block">
                    {isFolder(node) ? "—" : node.modified}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* status bar */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-3.5 py-1.5 font-mono text-[10px] text-white/35">
          <span>
            {selected ? basename(selected) : `${entries.length} items`}
          </span>
          <span className="text-white/25">
            click a file → api.windows.open('preview-app')
          </span>
        </div>
      </div>
    </div>
  );
}

export const app = defineApp({ manifest, Component: FileExplorer });

export default app;
