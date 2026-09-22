import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { applyTheme, getStoredTheme } from "@/lib/theme";
import App from "@/App";
import "@/styles.css";

applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
