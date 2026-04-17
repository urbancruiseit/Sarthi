import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import registerRoutes from "./routes/index.js";

dotenv.config();
const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../public");

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:3000",
      "https://trinetra.urbancruise.org",
      "https://saarthi.urbancruise.org",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

registerRoutes(app);

app.get("/health", (req, res) => {
  res.send("🚀 Server started successfully");
});

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api\/|socket\.io\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚀 Server started successfully (frontend build not found)");
  });
}

app.use(errorMiddleware);

export { app };
