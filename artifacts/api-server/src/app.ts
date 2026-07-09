import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// Increase body size limit to handle base64-encoded PDF/image uploads (~5MB file → ~7MB base64)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api", router);

// Serve static frontend files from public/
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// SPA fallback: only for non-API GET/HEAD requests — return index.html
// API misses should still get a JSON 404, not index.html
app.use((req, res) => {
  if ((req.method === "GET" || req.method === "HEAD") && !req.path.startsWith("/api")) {
    res.sendFile(path.join(publicDir, "index.html"));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

export default app;
