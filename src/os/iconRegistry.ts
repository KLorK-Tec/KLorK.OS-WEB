/* ================================================================== */
/*  Icon registry — maps serializable icon names to Lucide components  */
/*                                                                     */
/*  Store listings persist to localStorage as JSON, so they can't      */
/*  carry a component reference. They carry `iconName` instead and     */
/*  the OS resolves it back to a real icon here.                       */
/* ================================================================== */

import {
  Activity,
  Box,
  Calculator,
  CloudSun,
  Gamepad2,
  Hash,
  Music4,
  Package,
  Palette,
  Timer,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  activity: Activity,
  box: Box,
  calculator: Calculator,
  cloudSun: CloudSun,
  gamepad: Gamepad2,
  hash: Hash,
  music: Music4,
  package: Package,
  palette: Palette,
  timer: Timer,
};

export const resolveIcon = (name?: string): LucideIcon =>
  (name && ICON_REGISTRY[name]) || Package;
