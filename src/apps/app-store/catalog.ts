/* ================================================================== */
/*  Mock community catalog                                             */
/*                                                                     */
/*  Stands in for a remote registry (GET /catalog.json). Each listing  */
/*  carries an ES module payload in `source`, which the                */
/*  DynamicAppLoader turns into an object URL and imports at runtime.  */
/*  A listing may instead point at a real CDN via `entry`.             */
/*                                                                     */
/*  Remote modules are plain JS (no bundler): they pull React off      */
/*  window.__KLORK_SDK__ and build UI with React.createElement.        */
/* ================================================================== */

import type { StoreListing } from "../../types/os";

/* ------------------------------ weather ---------------------------- */

const WEATHER_SRC = `
const { React } = window.__KLORK_SDK__;
const h = React.createElement;

const CITIES = [
  { city: "Tehran",  temp: 18, cond: "Clear",   icon: "sun",   hi: 21, lo: 7  },
  { city: "Isfahan", temp: 15, cond: "Breezy",  icon: "wind",  hi: 19, lo: 5  },
  { city: "Tabriz",  temp: 6,  cond: "Snow",    icon: "snow",  hi: 8,  lo: -2 },
  { city: "Shiraz",  temp: 22, cond: "Sunny",   icon: "sun",   hi: 25, lo: 11 }
];

const GLYPH = { sun: "\\u2600", wind: "\\u2248", snow: "\\u2744" };

function Weather(props) {
  const api = props.api;
  const [i, setI] = React.useState(0);
  const d = CITIES[i];
  const accent = api.theme.current.accent;

  return h("div", { className: "flex h-full flex-col p-5" },
    h("div", { className: "flex items-start justify-between" },
      h("div", null,
        h("p", { className: "text-[11px] uppercase tracking-widest text-white/40" }, "now in"),
        h("h1", { className: "text-lg font-semibold text-white" }, d.city)
      ),
      h("span", { className: "text-3xl", style: { color: accent } }, GLYPH[d.icon])
    ),
    h("div", { className: "mt-4 flex items-end gap-2" },
      h("span", { className: "text-6xl font-light text-white" }, d.temp),
      h("span", { className: "mb-2 text-2xl text-white/40" }, "\\u00B0C")
    ),
    h("p", { className: "mt-1 text-[12px] text-white/55" },
      d.cond + "  \\u00B7  H " + d.hi + "\\u00B0  L " + d.lo + "\\u00B0"),
    h("div", { className: "mt-5 grid grid-cols-4 gap-1.5" },
      CITIES.map(function (c, idx) {
        return h("button", {
          key: c.city,
          onClick: function () { setI(idx); },
          className: "rounded-xl border px-2 py-2 text-[10.5px] transition-colors " +
            (idx === i
              ? "border-white/25 bg-white/10 text-white"
              : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80")
        }, c.city);
      })
    ),
    h("div", { className: "mt-auto flex items-center justify-between" },
      h("span", { className: "font-mono text-[9px] text-white/25" }, "remote module \\u00B7 window " + props.windowId),
      h("button", {
        onClick: function () { api.windows.notify("Weather Glass", d.city + " is " + d.temp + "\\u00B0C and " + d.cond.toLowerCase()); },
        className: "rounded-full px-3 py-1.5 text-[10.5px] font-medium text-white",
        style: { background: accent }
      }, "notify forecast")
    )
  );
}

export default { manifest: { id: "weather-glass" }, Component: Weather };
`;

/* ---------------------------- calculator --------------------------- */

const CALC_SRC = `
const { React } = window.__KLORK_SDK__;
const h = React.createElement;

const KEYS = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","C","+"];

function Calc(props) {
  const accent = props.api.theme.current.accent;
  const [expr, setExpr] = React.useState("");
  const [out, setOut] = React.useState("0");

  function press(k) {
    if (k === "C") { setExpr(""); setOut("0"); return; }
    setExpr(expr + k);
  }
  function equals() {
    try {
      const safe = expr.replace(/[^0-9+\\-*/(). ]/g, "");
      const val = Function("return (" + (safe || "0") + ")")();
      const txt = String(Math.round(val * 1e8) / 1e8);
      setOut(txt); setExpr(txt);
    } catch (e) { setOut("error"); }
  }

  return h("div", { className: "flex h-full flex-col p-4" },
    h("div", { className: "rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-right" },
      h("p", { className: "h-4 truncate font-mono text-[11px] text-white/35" }, expr || "\\u00A0"),
      h("p", { className: "truncate font-mono text-3xl text-white" }, out)
    ),
    h("div", { className: "mt-3 grid flex-1 grid-cols-4 gap-1.5" },
      KEYS.map(function (k) {
        const op = "+-*/".indexOf(k) >= 0;
        return h("button", {
          key: k,
          onClick: function () { press(k); },
          className: "rounded-xl border border-white/10 font-mono text-[15px] transition-colors " +
            (op ? "bg-white/[0.08] text-white/80 hover:bg-white/15"
                : k === "C" ? "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
                : "bg-white/[0.03] text-white/85 hover:bg-white/10")
        }, k);
      }),
      h("button", {
        onClick: equals,
        className: "col-span-4 rounded-xl py-2.5 font-mono text-[15px] font-semibold text-white",
        style: { background: accent }
      }, "=")
    )
  );
}

export default { manifest: { id: "calculator" }, Component: Calc };
`;

/* ----------------------------- pomodoro ---------------------------- */

const POMODORO_SRC = `
const { React } = window.__KLORK_SDK__;
const h = React.createElement;

function pad(n) { return (n < 10 ? "0" : "") + n; }

function Pomodoro(props) {
  const api = props.api;
  const accent = api.theme.current.accent;
  const [total, setTotal] = React.useState(25 * 60);
  const [left, setLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);

  React.useEffect(function () {
    if (!running) return;
    const t = setInterval(function () {
      setLeft(function (v) {
        if (v <= 1) {
          clearInterval(t);
          setRunning(false);
          api.windows.notify("Focus Timer", "Session complete \\u2014 take a break.");
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return function () { clearInterval(t); };
  }, [running]);

  function preset(mins) {
    setRunning(false); setTotal(mins * 60); setLeft(mins * 60);
  }

  const pct = total ? (1 - left / total) * 100 : 0;

  return h("div", { className: "flex h-full flex-col items-center justify-center gap-5 p-6" },
    h("p", { className: "font-mono text-6xl tabular-nums text-white" },
      pad(Math.floor(left / 60)) + ":" + pad(left % 60)),
    h("div", { className: "h-1.5 w-56 overflow-hidden rounded-full bg-white/10" },
      h("div", {
        className: "h-full rounded-full transition-all duration-500",
        style: { width: pct + "%", background: accent }
      })
    ),
    h("div", { className: "flex gap-2" },
      [15, 25, 50].map(function (m) {
        return h("button", {
          key: m,
          onClick: function () { preset(m); },
          className: "rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60 hover:text-white"
        }, m + "m");
      })
    ),
    h("div", { className: "flex gap-2" },
      h("button", {
        onClick: function () { setRunning(!running); },
        className: "rounded-full px-5 py-2 text-[12px] font-medium text-white",
        style: { background: accent }
      }, running ? "Pause" : "Start"),
      h("button", {
        onClick: function () { setRunning(false); setLeft(total); },
        className: "rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-[12px] text-white/70 hover:text-white"
      }, "Reset")
    ),
    h("p", { className: "font-mono text-[9px] text-white/25" }, "loaded dynamically \\u00B7 " + props.windowId)
  );
}

export default { manifest: { id: "focus-timer" }, Component: Pomodoro };
`;

/* ---------------------------- sys monitor -------------------------- */

const SYSMON_SRC = `
const { React } = window.__KLORK_SDK__;
const h = React.createElement;

function Bar(p) {
  return h("div", { className: "space-y-1" },
    h("div", { className: "flex justify-between font-mono text-[10px] text-white/45" },
      h("span", null, p.label), h("span", null, Math.round(p.value) + "%")),
    h("div", { className: "h-2 overflow-hidden rounded-full bg-white/[0.07]" },
      h("div", {
        className: "h-full rounded-full transition-all duration-500",
        style: { width: p.value + "%", background: p.color }
      })
    )
  );
}

function SysMon(props) {
  const accent = props.api.theme.current.accent;
  const [s, setS] = React.useState({ cpu: 24, mem: 58, net: 12, gpu: 33 });
  const [hist, setHist] = React.useState([]);

  React.useEffect(function () {
    const t = setInterval(function () {
      setS(function (p) {
        const jitter = function (v, lo, hi) {
          const n = v + (Math.random() * 18 - 9);
          return Math.max(lo, Math.min(hi, n));
        };
        const next = { cpu: jitter(p.cpu, 5, 95), mem: jitter(p.mem, 30, 88), net: jitter(p.net, 1, 70), gpu: jitter(p.gpu, 8, 90) };
        setHist(function (hh) { return hh.concat([next.cpu]).slice(-40); });
        return next;
      });
    }, 900);
    return function () { clearInterval(t); };
  }, []);

  return h("div", { className: "flex h-full flex-col gap-4 p-5" },
    h("div", { className: "flex items-end gap-[2px] h-20 rounded-xl border border-white/[0.07] bg-black/30 p-2" },
      hist.map(function (v, i) {
        return h("div", {
          key: i,
          className: "flex-1 rounded-sm",
          style: { height: Math.max(4, v) + "%", background: accent, opacity: 0.35 + (i / 60) }
        });
      })
    ),
    h(Bar, { label: "cpu", value: s.cpu, color: accent }),
    h(Bar, { label: "memory", value: s.mem, color: "#22d3ee" }),
    h(Bar, { label: "network", value: s.net, color: "#34d399" }),
    h(Bar, { label: "gpu", value: s.gpu, color: "#fb7185" }),
    h("p", { className: "mt-auto font-mono text-[9px] text-white/25" },
      "klork-sysmon \\u00B7 sampling every 900ms")
  );
}

export default { manifest: { id: "sys-monitor" }, Component: SysMon };
`;

/* ---------------------------- accent lab --------------------------- */

const PALETTE_SRC = `
const { React } = window.__KLORK_SDK__;
const h = React.createElement;

const SWATCHES = [
  "#8b5cf6","#22d3ee","#f59e0b","#fb7185","#34d399","#f472b6",
  "#60a5fa","#a3e635","#fb923c","#e879f9","#2dd4bf","#facc15"
];

function Palette(props) {
  const api = props.api;
  const current = api.theme.current.accent;

  return h("div", { className: "flex h-full flex-col p-5" },
    h("p", { className: "text-[11px] uppercase tracking-widest text-white/40" }, "accent lab"),
    h("p", { className: "mt-1 text-[12px] text-white/55" },
      "Repaint the whole OS through api.theme.setAccent()."),
    h("div", { className: "mt-4 grid grid-cols-6 gap-2" },
      SWATCHES.map(function (c) {
        return h("button", {
          key: c,
          onClick: function () { api.theme.setAccent(c); },
          title: c,
          className: "aspect-square rounded-xl ring-1 ring-white/20 transition-transform hover:scale-110 " +
            (c === current ? "ring-2 ring-white/80" : ""),
          style: { background: c }
        });
      })
    ),
    h("div", { className: "mt-5 rounded-xl border border-white/[0.08] bg-black/30 p-4" },
      h("p", { className: "font-mono text-[10px] text-white/35" }, "theme.current.accent"),
      h("p", { className: "mt-1 font-mono text-lg", style: { color: current } }, current)
    ),
    h("button", {
      onClick: function () { api.windows.open("settings"); },
      className: "mt-auto rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11.5px] text-white/70 hover:text-white"
    }, "open Settings \\u2192")
  );
}

export default { manifest: { id: "accent-lab" }, Component: Palette };
`;

/* ------------------------------------------------------------------ */
/*  The catalog                                                        */
/* ------------------------------------------------------------------ */

export const CATALOG: StoreListing[] = [
  {
    id: "weather-glass",
    name: "Weather Glass",
    version: "1.2.0",
    author: "klork community",
    tagline: "Minimal forecast panel",
    description:
      "A glassy weather widget with city switching and notification support. Demonstrates a remote module reading api.theme and pushing notifications.",
    category: "Utilities",
    iconName: "cloudSun",
    tile: "from-sky-400 to-indigo-500",
    defaultSize: { width: 400, height: 400 },
    weight: "18 KB",
    rating: 4.6,
    installs: "12.4k",
    verified: true,
    source: WEATHER_SRC,
  },
  {
    id: "calculator",
    name: "Calculator",
    version: "2.0.1",
    author: "klork community",
    tagline: "Keypad arithmetic",
    description:
      "A compact calculator with a sanitized expression evaluator. Proves that dynamically imported modules keep full React state.",
    category: "Utilities",
    iconName: "calculator",
    tile: "from-zinc-400 to-zinc-600",
    defaultSize: { width: 340, height: 460 },
    minSize: { width: 300, height: 400 },
    weight: "12 KB",
    rating: 4.8,
    installs: "31.7k",
    verified: true,
    source: CALC_SRC,
  },
  {
    id: "focus-timer",
    name: "Focus Timer",
    version: "1.0.5",
    author: "kalhork",
    tagline: "Pomodoro with notifications",
    description:
      "15/25/50 minute focus sessions. Fires a system notification through api.windows.notify() when the session ends.",
    category: "Productivity",
    iconName: "timer",
    tile: "from-rose-400 to-pink-600",
    defaultSize: { width: 420, height: 420 },
    weight: "14 KB",
    rating: 4.4,
    installs: "8.9k",
    verified: true,
    source: POMODORO_SRC,
  },
  {
    id: "sys-monitor",
    name: "System Monitor",
    version: "0.8.3",
    author: "klork labs",
    tagline: "Live resource graphs",
    description:
      "Animated CPU history graph plus memory, network and GPU meters. A good stress test for long-running remote components.",
    category: "Developer",
    iconName: "activity",
    tile: "from-emerald-400 to-teal-600",
    defaultSize: { width: 460, height: 420 },
    weight: "16 KB",
    rating: 4.2,
    installs: "5.1k",
    source: SYSMON_SRC,
  },
  {
    id: "accent-lab",
    name: "Accent Lab",
    version: "1.1.0",
    author: "klork community",
    tagline: "Repaint the desktop",
    description:
      "Twelve accent swatches wired straight into api.theme.setAccent() — instantly restyles every window, the dock and the menu bar.",
    category: "Fun",
    iconName: "palette",
    tile: "from-fuchsia-400 to-purple-600",
    defaultSize: { width: 420, height: 440 },
    weight: "9 KB",
    rating: 4.9,
    installs: "22.3k",
    verified: true,
    source: PALETTE_SRC,
  },
  {
    id: "lofi-radio",
    name: "Lo-Fi Radio",
    version: "0.4.0",
    author: "third-party cdn",
    tagline: "Streams from an external CDN",
    description:
      "Hosted off-site at cdn.klorkapps.dev. Installing this one exercises the real network path — if the CDN is unreachable the loader's error boundary reports it instead of crashing the OS.",
    category: "Fun",
    iconName: "music",
    tile: "from-amber-400 to-orange-600",
    defaultSize: { width: 420, height: 380 },
    weight: "34 KB",
    rating: 3.9,
    installs: "1.2k",
    entry: "https://cdn.klorkapps.dev/lofi-radio@0.4.0/index.mjs",
  },
];
