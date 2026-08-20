import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export interface ISocketService {
  emitToUser(userId: number | string, event: string, payload: any): void;
  isUserOnline(userId: number): boolean;
  getOnlineCount(): number;
}

class SocketService implements ISocketService {
  private io: SocketServer | null = null;
  private onlineUsers = new Set<number>();

  public initialize(server: HttpServer): SocketServer {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket: Socket & { userId?: number }) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on("join", (userId: number | string) => {
        const parsedId = typeof userId === "string" ? parseInt(userId, 10) : userId;
        if (!isNaN(parsedId)) {
          socket.userId = parsedId;
          this.onlineUsers.add(parsedId);
          console.log(`User ${parsedId} online. Total online: ${this.onlineUsers.size}`);
        }
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
        if (socket.userId) {
          this.onlineUsers.delete(socket.userId);
          console.log(`User ${socket.userId} went offline. Total online: ${this.onlineUsers.size}`);
        }
      });
    });

    return this.io;
  }

  public emitToUser(userId: number | string, event: string, payload: any): void {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, payload);
    }
  }

  public isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  public getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  public getIO(): SocketServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
