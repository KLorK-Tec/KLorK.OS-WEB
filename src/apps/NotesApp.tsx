import { useState } from "react";
import { StickyNote } from "lucide-react";
import { defineApp } from "../os/AppRegistry";

const STORAGE_KEY = "klork.notes";

const DEFAULT_NOTE = `KLORK.OS — BUILD LOG
──────────────────────────────────

[x] PHASE 1 — CORE WINDOW ENGINE
    · zustand window store (open/close/focus/
      minimize/maximize)
    · react-rnd drag & resize
    · glass taskbar + traffic lights
    · boot sequence + start menu

[ ] PHASE 2 — SNAP LAYOUTS + ALT-TAB
[ ] PHASE 3 — NOTIFICATIONS + APP STORE
[ ] PHASE 4 — MULTI-DESKTOP SPACES

ideas:
— train a tiny model that predicts which
  app i'll open next lol
— wallpaper that shifts with time of day
`;

export default function NotesApp() {
  const [text, setText] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_NOTE;
    } catch {
      return DEFAULT_NOTE;
    }
  });

  const save = (v: string) => {
    setText(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* private mode — ignore */
    }
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={text}
        onChange={(e) => save(e.target.value)}
        spellCheck={false}
        placeholder="Start typing…"
        className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-white/80 outline-none placeholder:text-white/25"
      />
      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-4 py-1.5 text-[10px] text-white/30">
        <span>
          {words} words · {text.length} chars
        </span>
        <span>saved locally</span>
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "notes",
    name: "Notes",
    icon: StickyNote,
    version: "1.0.0",
    defaultSize: { width: 540, height: 480 },
    tile: "from-amber-300 to-orange-500",
  },
  Component: NotesApp,
});
