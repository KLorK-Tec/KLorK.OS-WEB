import {
  ArrowUpRight,
  Database,
  FolderGit2,
  Hand,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { GithubIcon } from "../components/icons";
import { defineApp } from "../os/AppRegistry";

const PROJECTS = [
  {
    title: "AI Hand Gesture Recognition",
    repo: "KLorK-Tec/MediaAi",
    year: "2026",
    desc: "Computer-vision pipeline using spatial coordinates instead of raw pixels — cuts processing overhead and runs in real time.",
    tags: ["Python", "OpenCV", "Computer Vision"],
    href: "https://github.com/KLorK-Tec/MediaAi",
    icon: Hand,
    tile: "from-cyan-400 to-blue-600",
  },
  {
    title: "Financial Risk Assessment AI",
    repo: "KLorK-Tec/FinanceRiskAi",
    year: "2026",
    desc: "End-to-end ML classification predicting credit & loan default risk, with data processing, predictive analytics and a full Jupyter report.",
    tags: ["Python", "scikit-learn", "Jupyter"],
    href: "https://github.com/KLorK-Tec/FinanceRiskAi",
    icon: TrendingUp,
    tile: "from-emerald-400 to-teal-600",
  },
  {
    title: "Java Bank CLI",
    repo: "kalhork/bankcli",
    year: "2026",
    desc: "Command-line banking app in Java with MongoDB persistence, secure connection handlers and full fund-transfer logic.",
    tags: ["Java", "MongoDB", "CLI"],
    href: "https://hamgit.ir/kalhork/bankcli",
    icon: Landmark,
    tile: "from-amber-300 to-orange-500",
  },
  {
    title: "C# CRUD · Mixed DB Practice",
    repo: "KLorK-Tec",
    year: "2025",
    desc: "Backend CRUD series demonstrating C# business logic wired to mixed SQL / NoSQL database architectures.",
    tags: ["C#", "SQL Server", "MongoDB"],
    href: "https://github.com/KLorK-Tec",
    icon: Database,
    tile: "from-violet-400 to-purple-600",
  },
];

export default function ProjectsApp() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
        <div>
          <h2 className="font-display text-[13.5px] font-semibold text-white/90">
            Projects
          </h2>
          <p className="font-mono text-[10.5px] text-white/40">
            open-source work from my GitHub
          </p>
        </div>
        <a
          href="https://github.com/KLorK-Tec?tab=repositories"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10.5px] text-white/70 transition-colors hover:border-white/25 hover:text-white"
        >
          <GithubIcon className="h-3.5 w-3.5" />
          all repositories
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <a
              key={p.title}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${p.tile} text-white shadow-lg ring-1 ring-white/20`}
                >
                  <p.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9.5px] text-white/40">
                    {p.year}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/80" />
                </div>
              </div>

              <h3 className="mt-3 text-[13px] font-semibold text-white/90">
                {p.title}
              </h3>
              <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-white/50">
                {p.desc}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] text-white/55"
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto font-mono text-[9.5px] text-white/25">
                  {p.repo}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export const app = defineApp({
  manifest: {
    id: "projects",
    name: "Projects",
    icon: FolderGit2,
    version: "1.0.4",
    defaultSize: { width: 740, height: 540 },
    tile: "from-emerald-400 to-teal-600",
  },
  Component: ProjectsApp,
});
