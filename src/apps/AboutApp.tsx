import { GithubIcon } from "../components/icons";
import { defineApp } from "../os/AppRegistry";
import {
  ExternalLink,
  Globe,
  GraduationCap,
  MapPin,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

const chips = [
  { icon: MapPin, label: "Tehran, IR" },
  { icon: GraduationCap, label: "B.Sc Computer Science" },
  { icon: Trophy, label: "Kaggle competitor" },
  { icon: Sparkles, label: "AI/ML · Data Science · Backend" },
];

export default function AboutApp() {
  return (
    <div className="h-full overflow-y-auto">
      {/* hero band */}
      <div className="relative border-b border-white/[0.06] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-400/10 px-6 pt-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 font-display text-xl font-bold text-white shadow-lg shadow-fuchsia-500/25 ring-1 ring-white/30">
            KK
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg font-semibold tracking-tight text-white">
                Kooshan Kalhor
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                open to work
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-white/55">
              AI / ML Developer — computer vision, ML models & solid backends
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-lg text-[12.5px] leading-relaxed text-white/65">
          Computer Science student at Islamic Azad University building
          AI-powered tools, machine learning models and backend systems — from a
          CV pipeline that cuts CPU overhead to a secure Java banking CLI backed
          by MongoDB.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {chips.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-white/70"
            >
              <Icon className="h-3 w-3 text-white/45" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* profile.json */}
      <div className="px-6 py-5">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/40">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
            <span className="font-mono text-[10.5px] tracking-wider text-white/40">
              profile.json
            </span>
            <span className="font-mono text-[10px] text-white/25">readonly</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-white/75">
{`{
  `}<span className="text-fuchsia-300">"name"</span>{`:     "Kooshan",
  `}<span className="text-fuchsia-300">"location"</span>{`: "Tehran, IR",
  `}<span className="text-fuchsia-300">"degree"</span>{`:   "B.Sc CS",
  `}<span className="text-fuchsia-300">"focus"</span>{`:    ["AI", "ML", "backend"],
  `}<span className="text-fuchsia-300">"status"</span>{`:   "open_to_work"
}`}
          </pre>
        </div>

        {/* links */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href="https://github.com/KLorK-Tec"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <GithubIcon className="h-4 w-4 text-white/70" />
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium text-white/85">GitHub</p>
              <p className="truncate font-mono text-[10px] text-white/40">
                KLorK-Tec
              </p>
            </div>
            <ExternalLink className="ml-auto h-3 w-3 text-white/30 transition-colors group-hover:text-white/70" />
          </a>
          <a
            href="https://klork-tec.github.io/PortfolioKK/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Globe className="h-4 w-4 text-white/70" />
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium text-white/85">
                Portfolio
              </p>
              <p className="truncate font-mono text-[10px] text-white/40">
                klork-tec.github.io
              </p>
            </div>
            <ExternalLink className="ml-auto h-3 w-3 text-white/30 transition-colors group-hover:text-white/70" />
          </a>
        </div>
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "about",
    name: "About Me",
    icon: User,
    version: "2.1.0",
    defaultSize: { width: 660, height: 540 },
    tile: "from-violet-500 to-fuchsia-600",
  },
  Component: AboutApp,
});
