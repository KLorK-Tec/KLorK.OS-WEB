/* ================================================================== */
/*  preview-app — renders whatever the VFS preview target points to    */
/*                                                                     */
/*  Launched by FileExplorer via api.windows.open("preview-app").      */
/* ================================================================== */

import {
  ExternalLink,
  Eye,
  FolderOpen,
  ImageIcon,
  Wallpaper,
} from "lucide-react";
import { defineApp } from "../../os/AppRegistry";
import { basename, resolvePath, useVFSStore, type VFSFile } from "../../os/vfs";
import { useOSStore } from "../../store/useOSStore";
import type { AppManifest, KlorkAppProps } from "../../types/os";

const manifest: AppManifest = {
  id: "preview-app",
  name: "Preview",
  icon: Eye,
  version: "1.0.0",
  defaultSize: { width: 620, height: 560 },
  tile: "from-indigo-400 to-violet-600",
};

/* ------------------- ultra-light markdown renderer ------------------ */

function Markdown({ src }: { src: string }) {
  return (
    <div className="space-y-2">
      {src.split("\n").map((line, i) => {
        if (line.startsWith("# "))
          return (
            <h1
              key={i}
              className="font-display text-lg font-semibold tracking-tight text-white"
            >
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2
              key={i}
              className="pt-2 text-[13px] font-semibold text-white/85"
            >
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("- "))
          return (
            <div key={i} className="flex gap-2 pl-1 text-[12px] text-white/60">
              <span className="text-white/25">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-[12px] leading-relaxed text-white/60">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

/** bold-only inline parser (**text**) */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white/90">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ---------------------------- component --------------------------- */

function FileBody({ f, accent }: { f: VFSFile; accent: string }) {
  const setWallpaper = useOSStore((s) => s.setWallpaper);

  switch (f.kind) {
    case "image":
      return (
        <div className="space-y-3">
          <img
            src={f.src}
            alt={f.name}
            className="w-full rounded-xl border border-white/10 object-cover shadow-lg"
          />
          <button
            onClick={() => f.src && setWallpaper(f.src)}
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11.5px] font-medium text-white transition-transform hover:scale-105 active:scale-95"
            style={{ background: accent, boxShadow: `0 8px 22px ${accent}55` }}
          >
            <Wallpaper className="h-3.5 w-3.5" />
            Set as wallpaper
          </button>
        </div>
      );

    case "url":
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[12px] text-white/55">
            This shortcut points to an external location.
          </p>
          <code className="max-w-full truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-300/80">
            {f.href}
          </code>
          <a
            href={f.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[11.5px] text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open link
          </a>
        </div>
      );

    case "md":
      return <Markdown src={f.content ?? ""} />;

    default:
      return (
        <pre className="overflow-x-auto rounded-xl border border-white/[0.07] bg-black/40 p-4 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-white/70">
          {f.content}
        </pre>
      );
  }
}

function Preview({ api }: KlorkAppProps) {
  const previewPath = useVFSStore((s) => s.previewPath);
  const accent = api.theme.current.accent;
  const node = previewPath ? resolvePath(previewPath) : undefined;

  /* empty state */
  if (!node || node.type !== "file") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
          <ImageIcon className="h-6 w-6 text-white/25" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-white/70">
            Nothing to preview
          </p>
          <p className="mt-1 text-[11.5px] text-white/40">
            Pick a file in File Explorer to open it here.
          </p>
        </div>
        <button
          onClick={() => api.windows.open("file-explorer")}
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11.5px] font-medium text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: accent, boxShadow: `0 8px 22px ${accent}55` }}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Open File Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* file header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-white/85">
            {basename(previewPath!)}
          </p>
          <p className="truncate font-mono text-[10px] text-white/35">
            {previewPath}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] text-white/45 uppercase">
            {node.kind}
          </span>
          <span className="hidden font-mono text-[9.5px] text-white/30 sm:inline">
            {node.size}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <FileBody f={node} accent={accent} />
      </div>

      {/* footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-4 py-1.5 font-mono text-[10px] text-white/30">
        <span>modified {node.modified}</span>
        <button
          onClick={() => api.windows.open("file-explorer")}
          className="transition-colors hover:text-white/70"
        >
          reveal in file explorer →
        </button>
      </div>
    </div>
  );
}

export const app = defineApp({ manifest, Component: Preview });

export default app;
