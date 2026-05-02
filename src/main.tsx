import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNative } from "./lib/native";
import { applyTheme, getStoredTheme } from "./hooks/use-theme";

// Apply persisted theme before React mounts to avoid a flash
applyTheme(getStoredTheme());

initNative();

createRoot(document.getElementById("root")!).render(<App />);
