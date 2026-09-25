import { AnimatePresence } from "framer-motion";
import Boot from "./components/Boot";
import Desktop from "./components/Desktop";
import { useViewportSync } from "./os/useMediaQuery";
import { useOSStore } from "./store/useOSStore";

export default function App() {
  const booted = useOSStore((s) => s.booted);
  const accent = useOSStore((s) => s.accent);

  /** keeps store.isMobile + viewport in sync with the real viewport */
  useViewportSync();

  return (
    <div
      className="h-full"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* one shell — Desktop swaps to the mobile paradigm internally */}
      <Desktop />

      <AnimatePresence>{!booted && <Boot />}</AnimatePresence>
    </div>
  );
}
