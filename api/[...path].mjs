// Vercel serverless entry for the API. This catch-all maps every /api/* request
// to the shared Express app, which routes internally on the full path.
// Requires DATABASE_URL in the Vercel project's Environment Variables; without
// it the data routes return 503 and the frontend falls back to localStorage.
import { createApp } from "../server/app.mjs";

export default createApp();
