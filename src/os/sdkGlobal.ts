/* ================================================================== */
/*  Global SDK shim                                                    */
/*                                                                     */
/*  Dynamically imported ES modules run outside the bundler, so bare   */
/*  specifiers like "react" can't be resolved by the browser. Klork    */
/*  publishes its runtime on `window.__KLORK_SDK__` — remote apps      */
/*  grab React from there:                                             */
/*                                                                     */
/*      const { React } = window.__KLORK_SDK__;                        */
/*      const h = React.createElement;                                 */
/* ================================================================== */

import * as React from "react";
import type { KlorkGlobalSDK } from "../types/os";

declare global {
  interface Window {
    __KLORK_SDK__: KlorkGlobalSDK;
  }
}

export const KLORK_SDK_VERSION = "1.0.0";

export function installGlobalSDK(): void {
  if (typeof window === "undefined") return;
  window.__KLORK_SDK__ = {
    React,
    version: KLORK_SDK_VERSION,
  };
}
