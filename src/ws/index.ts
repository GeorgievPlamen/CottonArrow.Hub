import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyJwt } from "../features/auth/jwt";
import { ActiveUsersMessage, MessageTypes, UserCtx, WSMessage } from "./types";

type WebSocketContext = { user: UserCtx; ws: WebSocket };
const connectedUsers = new Map<string, WebSocketContext>();

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols) => {
      return protocols.has("auth") ? "auth" : false;
    },
  });

  wss.on(
    "connection",
    (ws: WebSocket, req: http.IncomingHttpHeaders, userId: string) => {
      const context = connectedUsers.get(userId);
      if (!context) throw new Error("Invalid context");

      const me = context.user;

      console.log(`User: ${me.username} | With Id: ${me.id} Joined.`);

      sendActiveUsersMessage();

      ws.on("message", (data) => {
        console.log(
          `User: ${me.username} | With Id: ${me.id} Sends:\n\n ${data}\n\n----------------------------------------\\n`
        );

        try {
          const message: WSMessage = JSON.parse(data.toString("utf-8"));
          const receiver = connectedUsers.get(message.to);

          if (!receiver) {
            ws.send(`Could not find user with id: ${message.to}`);
          }

          receiver?.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(error);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        connectedUsers.delete(userId);
        sendActiveUsersMessage();
      });
    }
  );

  server.on("upgrade", (req, socket, head) => {
    try {
      const raw = req.headers["sec-websocket-protocol"];
      const offered = (Array.isArray(raw) ? raw[0] : raw) ?? "";
      const parts = offered
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (parts.length < 2 || parts[0] !== "auth")
        throw new Error("bad subprotocols");

      const token = parts[1];
      const payload = verifyJwt(token); // throws if invalid/expired
      const user: UserCtx = { id: payload.sub, username: payload.username };

      wss.handleUpgrade(req, socket, head, (ws) => {
        connectedUsers.set(user.id, {
          user: user,
          ws: ws,
        });
        wss.emit("connection", ws, req, user.id);
      });
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  return wss;
}

function sendActiveUsersMessage() {
  const activeUsers: ActiveUsersMessage = {
    activeUsersCount: connectedUsers.size,
    Users: [...connectedUsers.values()].map((x) => x.user),
    type: MessageTypes.users,
  };

  console.log("--------------------\n");
  console.log(activeUsers);
  const activeUsersJson = JSON.stringify(activeUsers);
  console.log("\n--------------------");

  for (const user of connectedUsers.values()) {
    user.ws.send(activeUsersJson);
  }
}
