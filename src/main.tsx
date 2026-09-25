import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { installGlobalSDK } from "./os/sdkGlobal";

// publish the runtime SDK before any dynamically imported app evaluates
installGlobalSDK();

import "./apps/builtins"; // install built-in apps into the AppRegistry
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
