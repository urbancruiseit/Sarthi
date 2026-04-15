import http from "http";
import { app } from "./app.js";
import { connectMySQL } from "./config/mySqlDB.js";
import { initSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

// Database connect
connectMySQL();

// Create HTTP server
const server = http.createServer(app);

// Initialize socket
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
