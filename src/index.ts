import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyJwt } from "./features/auth/jwt";
import authRouter from "./features/auth";
import path from "node:path";

const PUBLIC_PATH = path.join(__dirname, "..", "public");

const app = express();

app.use(express.json());
app.use(express.static(PUBLIC_PATH));

app.get("/api/health", (_, res) => {
  res.status(200).send("Alive and well.");
});

app.get("/", (_, res) => {
  res.sendFile(path.join(PUBLIC_PATH, "webrtc", "index.html"));
});

app.use("/api/auth", authRouter);

const server = http.createServer(app);

const wss = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => {
    return protocols.has("auth") ? "auth" : false;
  },
});

type WebSocketContext = { user: UserCtx; ws: WebSocket };
const connectedUsers = new Map<string, WebSocketContext>();

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
        const message:
          | ActiveUsersMessage
          | OfferMessage
          | AnswerMessage
          | IceMessage = JSON.parse(data.toString("utf-8"));

        console.log("parsed message", message);

        console.log("message.type", message.type);
        switch (message.type) {
          case MessageTypes.signalIce:
          case MessageTypes.signalAnswer:
          case MessageTypes.signalOffer: {
            const receiver = connectedUsers.get(message.to);

            console.log("from", message.from);
            console.log("to", message.to);

            if (!receiver) {
              ws.send(`Could not find user with id: ${message.to}`);
            }

            receiver?.ws.send(JSON.stringify(message));
            break;
          }
        }
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

server.listen(5000, () => {
  console.log("HTTP + WS listening on http://localhost:5000");
});

export type UserCtx = { id: string; username: string };

export enum MessageTypes {
  users = "users",
  signalOffer = "signal:offer",
  signalAnswer = "signal:answer",
  signalIce = "signal:ice-candidate",
}

export interface ActiveUsersMessage {
  type: MessageTypes.users;
  activeUsersCount: number;
  Users: UserCtx[];
}

export interface OfferMessage {
  type: MessageTypes.signalOffer;
  from: string;
  to: string;
  sdp: string;
}

export interface AnswerMessage {
  type: MessageTypes.signalAnswer;
  from: string;
  to: string;
  sdp: string;
}

export interface IceMessage {
  type: MessageTypes.signalIce;
  from: string;
  to: string;
  candidate: string;
}
function sendActiveUsersMessage() {
  const activeUsers: ActiveUsersMessage = {
    activeUsersCount: connectedUsers.size,
    Users: [...connectedUsers.values()].map((x) => x.user),
    type: MessageTypes.users,
  };

  console.log("--------------------\n")
  console.log(activeUsers);
  const activeUsersJson = JSON.stringify(activeUsers);
  console.log("\n--------------------")

  for (const user of connectedUsers.values()) {
    user.ws.send(activeUsersJson);
  }
}
