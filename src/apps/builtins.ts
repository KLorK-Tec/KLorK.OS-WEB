/* ================================================================== */
/*  Built-in apps — registered into the AppRegistry at startup.        */
/*                                                                     */
/*  Every entry is a KlorkAppModule ({ manifest, Component }).         */
/*  Registration order defines the dock / start-menu / desktop order.  */
/* ================================================================== */

import { AppRegistry } from "../os/AppRegistry";

import { app as AboutApp } from "./AboutApp";
import { app as MusicApp } from "./MusicApp";
import { app as FileExplorerApp } from "./file-explorer";
import { app as TerminalApp } from "./terminal";
import { app as AppStoreApp } from "./app-store";
import { app as PreviewApp } from "./preview";
import { app as ProjectsApp } from "./ProjectsApp";
import { app as BrowserApp } from "./BrowserApp";
import { app as NotesApp } from "./NotesApp";
import { app as HelloApp } from "./hello";
import { app as SettingsApp } from "./SettingsApp";

AppRegistry.registerAll([
  AboutApp,
  MusicApp,
  FileExplorerApp,
  TerminalApp,
  AppStoreApp,
  PreviewApp,
  ProjectsApp,
  BrowserApp,
  NotesApp,
  HelloApp,
  SettingsApp,
]);
