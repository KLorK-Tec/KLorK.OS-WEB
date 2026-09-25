/* ================================================================== */
/*  Klork.os — Virtual File System                                     */
/*                                                                     */
/*  A mock read-mostly VFS held in a Zustand store. Apps resolve       */
/*  nodes by absolute path ("/Projects/MediaAi.md"). FileExplorer      */
/*  navigates it; preview-app renders whatever `previewPath` points    */
/*  at; Terminal walks it with ls / cd / cat.                          */
/* ================================================================== */

import { create } from "zustand";

export type FileKind = "md" | "txt" | "json" | "pdf" | "url" | "image";

export interface VFSFile {
  type: "file";
  name: string;
  kind: FileKind;
  size: string;
  modified: string;
  /** text payload for md / txt / json / pdf-ish documents */
  content?: string;
  /** external link for .url shortcuts */
  href?: string;
  /** asset path for images */
  src?: string;
}

export interface VFSFolder {
  type: "folder";
  name: string;
  children: VFSNode[];
}

export type VFSNode = VFSFile | VFSFolder;

/* ------------------------------------------------------------------ */
/*  The tree                                                           */
/* ------------------------------------------------------------------ */

const file = (f: Omit<VFSFile, "type">): VFSFile => ({ type: "file", ...f });

export const VFS_ROOT: VFSFolder = {
  type: "folder",
  name: "/",
  children: [
    {
      type: "folder",
      name: "Projects",
      children: [
        file({
          name: "MediaAi.md",
          kind: "md",
          size: "3.1 KB",
          modified: "2026-01-14",
          content: `# AI Hand Gesture Recognition

**Stack:** Python · OpenCV · MediaPipe

A computer-vision pipeline that classifies hand gestures from
**spatial landmark coordinates** instead of raw pixel data.

## Why it matters
- Cuts image-processing overhead dramatically
- Runs in real time on commodity CPUs
- Landmark vectors are lighting & background invariant

## Notes
- 21 landmarks per hand, normalized to wrist origin
- Lightweight classifier on top of the coordinate vector

repo: github.com/KLorK-Tec/MediaAi`,
        }),
        file({
          name: "FinanceRiskAi.md",
          kind: "md",
          size: "4.4 KB",
          modified: "2026-01-06",
          content: `# Financial Risk Assessment AI

**Stack:** Python · scikit-learn · pandas · Jupyter

End-to-end ML classification predicting **credit and loan
default risk**, from raw data to a written report.

## Pipeline
- Cleaning, encoding and feature engineering
- Class-imbalance handling
- Model selection + hyperparameter search
- Evaluation: ROC-AUC, precision / recall tradeoffs

## Deliverable
A comprehensive Jupyter report covering data processing and
predictive analytics.

repo: github.com/KLorK-Tec/FinanceRiskAi`,
        }),
        file({
          name: "bank-cli.md",
          kind: "md",
          size: "2.6 KB",
          modified: "2025-11-22",
          content: `# Java Bank CLI

**Stack:** Java · MongoDB

A structured command-line banking application with persistent
storage and full fund-transfer logic.

## Features
- Secure connection handlers
- Account CRUD + transaction ledger
- Transfer validation and rollback on failure

repo: hamgit.ir/kalhork/bankcli`,
        }),
        file({
          name: "portfolio.url",
          kind: "url",
          size: "1 KB",
          modified: "2026-02-02",
          href: "https://klork-tec.github.io/PortfolioKK/",
        }),
      ],
    },
    {
      type: "folder",
      name: "About",
      children: [
        file({
          name: "README.md",
          kind: "md",
          size: "1.8 KB",
          modified: "2026-02-10",
          content: `# Kooshan Kalhor

Computer Science student at Islamic Azad University
(Central Tehran Branch) — building AI-powered tools,
machine learning models and solid backend systems.

## Currently
- Active Kaggle competitor
- Seeking internships / junior roles in AI/ML,
  Data Science or Backend Engineering

## Interests
- Artificial intelligence & machine learning
- Database architecture
- Complex algorithmic problems`,
        }),
        file({
          name: "resume.pdf",
          kind: "pdf",
          size: "182 KB",
          modified: "2026-02-08",
          content: `KOOSHAN KALHOR
AI/ML Developer — Tehran, IR

EDUCATION
  B.Sc Computer Science
  Islamic Azad University, Central Tehran Branch

SKILLS
  Languages   Python, TypeScript, Java, C#, SQL
  ML / AI     scikit-learn, OpenCV, pandas, Jupyter
  Backend     Node, MongoDB, SQL Server, REST
  Tools       Git, Linux, Kaggle

PROJECTS
  MediaAi           real-time gesture recognition (CV)
  FinanceRiskAi     credit default risk classification
  bank-cli          Java + MongoDB banking CLI

LANGUAGES
  Persian (native) · English (upper-intermediate)

STATUS
  Military service: exempted
  Open to work: yes`,
        }),
        file({
          name: "skills.json",
          kind: "json",
          size: "0.9 KB",
          modified: "2026-01-30",
          content: `{
  "languages": ["Python", "TypeScript", "Java", "C#", "SQL"],
  "ml": ["scikit-learn", "OpenCV", "pandas", "Jupyter"],
  "backend": ["Node", "MongoDB", "SQL Server", "REST"],
  "tools": ["Git", "Linux", "Kaggle"],
  "english": "upper-intermediate",
  "status": "open_to_work"
}`,
        }),
      ],
    },
    {
      type: "folder",
      name: "Contact",
      children: [
        file({
          name: "email.txt",
          kind: "txt",
          size: "0.2 KB",
          modified: "2026-02-01",
          content: `Reach me through the channels listed on my portfolio
contact section — that's the fastest route.

  portfolio : klork-tec.github.io/PortfolioKK
  github    : github.com/KLorK-Tec

Open to internships and junior roles in AI/ML,
Data Science and Backend Engineering.`,
        }),
        file({
          name: "github.url",
          kind: "url",
          size: "1 KB",
          modified: "2026-02-01",
          href: "https://github.com/KLorK-Tec",
        }),
        file({
          name: "links.md",
          kind: "md",
          size: "0.6 KB",
          modified: "2026-02-01",
          content: `# Links

- **Portfolio** — klork-tec.github.io/PortfolioKK
- **GitHub** — github.com/KLorK-Tec
- **Bank CLI** — hamgit.ir/kalhork/bankcli

Based in Tehran, IR.`,
        }),
      ],
    },
    {
      type: "folder",
      name: "Pictures",
      children: [
        file({
          name: "aurora.jpg",
          kind: "image",
          size: "1.4 MB",
          modified: "2026-02-11",
          src: "/wallpapers/aurora.jpg",
        }),
        file({
          name: "peaks.jpg",
          kind: "image",
          size: "1.1 MB",
          modified: "2026-02-11",
          src: "/wallpapers/peaks.jpg",
        }),
        file({
          name: "nebula.jpg",
          kind: "image",
          size: "1.6 MB",
          modified: "2026-02-11",
          src: "/wallpapers/nebula.jpg",
        }),
        file({
          name: "dunes.jpg",
          kind: "image",
          size: "1.2 MB",
          modified: "2026-02-11",
          src: "/wallpapers/dunes.jpg",
        }),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Path helpers                                                       */
/* ------------------------------------------------------------------ */

export const normalizePath = (path: string): string => {
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return "/" + parts.join("/");
};

export const joinPath = (base: string, name: string): string =>
  normalizePath(`${base}/${name}`);

export const parentPath = (path: string): string => {
  const p = normalizePath(path);
  if (p === "/") return "/";
  return normalizePath(p.slice(0, p.lastIndexOf("/")) || "/");
};

export const basename = (path: string): string =>
  normalizePath(path).split("/").filter(Boolean).pop() ?? "/";

/** walk the tree to an absolute path */
export const resolvePath = (path: string): VFSNode | undefined => {
  const segs = normalizePath(path).split("/").filter(Boolean);
  let node: VFSNode = VFS_ROOT;
  for (const seg of segs) {
    if (node.type !== "folder") return undefined;
    const next: VFSNode | undefined = node.children.find(
      (c: VFSNode) => c.name === seg
    );
    if (!next) return undefined;
    node = next;
  }
  return node;
};

/** directory listing, folders first then files (alphabetical) */
export const listDir = (path: string): VFSNode[] => {
  const node = resolvePath(path);
  if (!node || node.type !== "folder") return [];
  return [...node.children].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

export const isFolder = (n: VFSNode): n is VFSFolder => n.type === "folder";

/* ------------------------------------------------------------------ */
/*  Store — shared selection / preview target                          */
/* ------------------------------------------------------------------ */

interface VFSState {
  /** absolute path currently loaded in preview-app */
  previewPath: string | null;
  /** last directory FileExplorer was browsing (restored on reopen) */
  lastDir: string;
  openPreview: (path: string) => void;
  setLastDir: (path: string) => void;
}

export const useVFSStore = create<VFSState>()((set) => ({
  previewPath: null,
  lastDir: "/",
  openPreview: (path) => set({ previewPath: normalizePath(path) }),
  setLastDir: (path) => set({ lastDir: normalizePath(path) }),
}));
