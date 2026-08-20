import http from "http";
import app from "./app";
import { config } from "./config";
import { socketService } from "./infrastructure/websocket/socket.service";

const server = http.createServer(app);

// Initialize Socket.IO WebSocket Service
const io = socketService.initialize(server);

export { io, server };

const PORT = config.port;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} [${config.env}]`);
  });
}
