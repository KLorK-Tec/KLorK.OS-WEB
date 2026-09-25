/* ================================================================== */
/*  Terminal.app — klorksh                                             */
/*                                                                     */
/*  A functional CLI: keeps a scrollback of command/output entries,    */
/*  walks the VFS (ls / cd / cat / pwd) and drives the OS through the  */
/*  injected KlorkAPI (open / notify / theme / exit).                  */
/* ================================================================== */

import { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import { defineApp } from "../../os/AppRegistry";
import { getAllAppIds, getManifest } from "../../os/appResolve";
import {
  isFolder,
  joinPath,
  listDir,
  normalizePath,
  parentPath,
  resolvePath,
  useVFSStore,
} from "../../os/vfs";
import type { AppManifest, KlorkAPI, KlorkAppProps } from "../../types/os";

const manifest: AppManifest = {
  id: "terminal",
  name: "Terminal",
  icon: TerminalIcon,
  version: "2.0.0",
  defaultSize: { width: 680, height: 470 },
  minSize: { width: 420, height: 260 },
  tile: "from-zinc-600 to-zinc-900",
};

/* ------------------------------ model ----------------------------- */

type Tone = "dim" | "ok" | "err" | "accent" | "normal";

interface Line {
  text: string;
  tone: Tone;
}

interface Entry {
  id: number;
  /** the prompt line as typed — null for the boot banner */
  input: string | null;
  cwd: string;
  lines: Line[];
}

const L = (text: string, tone: Tone = "normal"): Line => ({ text, tone });

const TONE: Record<Tone, string> = {
  dim: "text-white/35",
  ok: "text-emerald-400/90",
  err: "text-rose-400/90",
  accent: "text-cyan-300/90",
  normal: "text-zinc-300/85",
};

const COMMANDS: [string, string][] = [
  ["help", "list available commands"],
  ["clear", "clear the screen"],
  ["echo <text>", "print text back"],
  ["whoami", "print the current user"],
  ["pwd", "print working directory"],
  ["ls [path]", "list directory contents"],
  ["cd <dir>", "change directory"],
  ["cat <file>", "print a file's contents"],
  ["open <app>", "launch an installed app"],
  ["apps", "list installed apps"],
  ["notify <msg>", "send a system notification"],
  ["theme", "show the active theme"],
  ["date", "print current date & time"],
  ["neofetch", "system information"],
  ["exit", "close this terminal"],
];

const BANNER: Line[] = [
  L("klorksh 2.0.0 — klork.os", "accent"),
  L('type "help" for a list of commands.', "dim"),
];

/* --------------------------- interpreter -------------------------- */

interface RunCtx {
  cwd: string;
  setCwd: (p: string) => void;
  api: KlorkAPI;
  clear: () => void;
}

/** returns output lines for a command; `null` means "no output" */
function execute(raw: string, ctx: RunCtx): Line[] {
  const [name = "", ...args] = raw.trim().split(/\s+/);
  const arg = args.join(" ");
  const { cwd, setCwd, api } = ctx;

  /** resolve a user-supplied path against cwd */
  const abs = (p: string) =>
    p.startsWith("/") ? normalizePath(p) : joinPath(cwd, p);

  switch (name.toLowerCase()) {
    case "":
      return [];

    case "help":
      return [
        L("available commands", "dim"),
        ...COMMANDS.map(([c, d]) => L(`  ${c.padEnd(15)}${d}`)),
      ];

    case "clear":
      ctx.clear();
      return [];

    case "echo":
      return [L(arg)];

    case "whoami":
      return [
        L("visitor", "ok"),
        L("guest session · klork.os · no elevated privileges", "dim"),
      ];

    case "pwd":
      return [L(cwd)];

    case "ls": {
      const target = args[0] ? abs(args[0]) : cwd;
      const node = resolvePath(target);
      if (!node) return [L(`ls: ${args[0] ?? target}: no such file or directory`, "err")];
      if (!isFolder(node)) return [L(node.name)];
      const items = listDir(target);
      if (!items.length) return [L("(empty)", "dim")];
      return items.map((n) =>
        isFolder(n)
          ? L(`  ${n.name.padEnd(22)}<dir>`, "accent")
          : L(`  ${n.name.padEnd(22)}${n.size}`)
      );
    }

    case "cd": {
      if (!args[0] || args[0] === "~") {
        setCwd("/");
        return [];
      }
      const target = args[0] === ".." ? parentPath(cwd) : abs(args[0]);
      const node = resolvePath(target);
      if (!node) return [L(`cd: ${args[0]}: no such file or directory`, "err")];
      if (!isFolder(node)) return [L(`cd: ${args[0]}: not a directory`, "err")];
      setCwd(target);
      return [];
    }

    case "cat": {
      if (!args[0]) return [L("cat: missing operand", "err")];
      const target = abs(args[0]);
      const node = resolvePath(target);
      if (!node) return [L(`cat: ${args[0]}: no such file or directory`, "err")];
      if (isFolder(node)) return [L(`cat: ${args[0]}: is a directory`, "err")];
      if (node.kind === "url") return [L(node.href ?? "", "ok")];
      if (node.kind === "image") {
        useVFSStore.getState().openPreview(target);
        api.windows.open("preview-app");
        return [L(`opening ${node.name} in preview-app …`, "ok")];
      }
      return (node.content ?? "").split("\n").map((l) => L(l));
    }

    case "open": {
      const id = args[0]?.toLowerCase();
      if (!id) return [L("open: missing app id", "err")];
      if (!getManifest(id))
        return [
          L(`open: unknown app "${id}"`, "err"),
          L(`installed: ${getAllAppIds().join("  ")}`, "dim"),
        ];
      api.windows.open(id);
      return [L(`launching ${id} …`, "ok")];
    }

    case "apps": {
      const ids = getAllAppIds();
      return [
        L("installed apps", "dim"),
        ...ids.map((id) => {
          const m = getManifest(id);
          return L(
            `  ${id.padEnd(16)}${(m?.name ?? "?").padEnd(16)}v${m?.version ?? "?"}`
          );
        }),
      ];
    }

    case "notify": {
      const msg = arg || "Hello from klorksh!";
      api.windows.notify("Terminal", msg);
      return [L("notification dispatched → api.windows.notify()", "ok")];
    }

    case "theme": {
      const t = api.theme.current;
      return [
        L(`mode       ${t.mode}`),
        L(`accent     ${t.accent}`),
        L(`wallpaper  ${t.wallpaper}`),
      ];
    }

    case "date":
      return [L(new Date().toString())];

    case "neofetch":
      return [
        L("  █▄▀ █   █▀█ █▀█ █▄▀   ▄▄ ▄▄▄", "accent"),
        L("  █░█ █▄▄ █▄█ █▀▄ █░█ ▄ █▄█ ▄▄█", "accent"),
        L(""),
        L("  os        klork.os 25.11"),
        L("  shell     klorksh 2.0.0"),
        L("  wm        react-rnd + framer-motion"),
        L("  state     zustand"),
        L("  sdk       KlorkAppModule"),
        L(`  apps      ${getAllAppIds().length} installed`),
        L("  user      visitor"),
      ];

    case "exit":
      api.windows.close();
      return [];

    case "sudo":
      return [L("visitor is not in the sudoers file. This incident will be reported.", "err")];

    default:
      return [
        L(`klorksh: command not found: ${name}`, "err"),
        L('try "help"', "dim"),
      ];
  }
}

/* ---------------------------- component --------------------------- */

let entryId = 0;

function Terminal({ api }: KlorkAppProps) {
  const [cwd, setCwd] = useState("/");
  const [entries, setEntries] = useState<Entry[]>([
    { id: ++entryId, input: null, cwd: "/", lines: BANNER },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = value;
    let cleared = false;

    const lines = execute(input, {
      cwd,
      setCwd,
      api,
      clear: () => {
        cleared = true;
      },
    });

    setEntries((prev) =>
      cleared ? [] : [...prev, { id: ++entryId, input, cwd, lines }]
    );
    if (input.trim()) setHistory((h) => [input, ...h].slice(0, 60));
    setHIndex(-1);
    setValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(hIndex + 1, history.length - 1);
      if (history[next] !== undefined) {
        setHIndex(next);
        setValue(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = hIndex - 1;
      setHIndex(next);
      setValue(next >= 0 ? history[next] ?? "" : "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = value.trim();
      if (!partial || partial.includes(" ")) return;
      const match = COMMANDS.map(([c]) => c.split(" ")[0]).find((c) =>
        c.startsWith(partial)
      );
      if (match) setValue(match);
    }
  };

  const Prompt = ({ dir }: { dir: string }) => (
    <>
      <span className="text-emerald-400/90">visitor@klork</span>
      <span className="text-zinc-500">:</span>
      <span className="text-cyan-300/80">{dir}</span>
      <span className="text-zinc-500">$&nbsp;</span>
    </>
  );

  return (
    <div
      className="flex h-full cursor-text flex-col bg-[#08080b]/85"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-2 font-mono text-[12px] leading-[1.6]"
      >
        {entries.map((entry) => (
          <div key={entry.id}>
            {entry.input !== null && (
              <div className="break-all whitespace-pre-wrap">
                <Prompt dir={entry.cwd} />
                <span className="text-zinc-100">{entry.input}</span>
              </div>
            )}
            {entry.lines.map((l, i) => (
              <div
                key={i}
                className={`break-all whitespace-pre-wrap ${TONE[l.tone]}`}
              >
                {l.text || "\u00A0"}
              </div>
            ))}
          </div>
        ))}

        {/* live prompt */}
        <form onSubmit={submit} className="flex items-baseline">
          <span className="shrink-0 whitespace-pre">
            <Prompt dir={cwd} />
          </span>
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal input"
            className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-zinc-100 outline-none"
          />
        </form>
        <div className="h-2" />
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-black/30 px-4 py-1.5 font-mono text-[9.5px] text-white/25">
        <span>klorksh · {cwd}</span>
        <span>↑↓ history · tab complete · ctrl+l clear</span>
      </div>
    </div>
  );
}

export const app = defineApp({ manifest, Component: Terminal });

export default app;
