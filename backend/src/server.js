import http from "http";
import { app } from "./app.js";
import { connectMySQL } from "./config/mySqlDB.js";
import { initSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

connectMySQL().catch?.((err) => console.error("[connectMySQL] failed:", err));

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
