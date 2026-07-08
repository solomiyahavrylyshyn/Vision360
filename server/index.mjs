// Local dev entry point: run the Express API as a standalone server.
// (In production the same app is served as a Vercel function — api/[...path].mjs.)
import { createApp } from "./app.mjs";
import { isConfigured } from "./db.mjs";

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(
    `[api] http://localhost:${PORT}  ·  db ${isConfigured() ? "configured" : "NOT configured (set DATABASE_URL in .env)"}`,
  );
});
