
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { applyStoredBrandTheme } from "./app/utils/brandTheme";
  import "./styles/index.css";

  // Before the first paint, so the saved brand colours also cover the screens
  // that render outside the main layout (sign-in, not-found, client-facing).
  applyStoredBrandTheme();

  createRoot(document.getElementById("root")!).render(<App />);
  