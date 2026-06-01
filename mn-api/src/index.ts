import express from "express";
import user_route from "./interface/routes/user.route";
import otp_route from "./interface/routes/otp.route";
import interest_route from "./interface/routes/interest.route";
import chat_route from "./interface/routes/chat.route";
import notification_route from "./interface/routes/notification.route";
import cors from "cors";
import path from "path";

import http from "http";
import { Server as SocketServer } from "socket.io";

const app = express();
const server = new http.Server(app);

// Initialize Socket.io Server
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins their personal room for private messages/notifications
  socket.on("join", (userId: number | string) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined personal room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export { io };

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log("Incoming Request Body:", req.body);
  next();
});

// Serve local media uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.use("/user/interest", interest_route);
app.use("/user/chat", chat_route);
app.use("/user/notifications", notification_route);
app.use("/user", user_route);
app.use("/otp", otp_route);

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
