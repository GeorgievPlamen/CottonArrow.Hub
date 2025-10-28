import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { generateJwt, verifyJwt } from "./auth";

const app = express();
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.status(200).send("Alive and well.");
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (password !== "passw0rd") {
    res.status(401);
    return res.json({ error: "Invalid credentials" });
  }

  const jwt = generateJwt(randomUUID(), username);

  res.status(200);
  res.json({ token: jwt });
});

app.get("/api/protected", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const auth = authHeader.split(" ");

  if (auth.length !== 2)
    return res
      .status(401)
      .json({ error: "Invalid authorization. Expected Bearer token." });
  const type = auth[0];

  if (type !== "Bearer")
    return res
      .status(401)
      .json({ error: "Invalid authorization. Expected Bearer token." });

  const token = auth[1];

  try {
    const payload = verifyJwt(token);
    res.json({ message: "You are authenticated!", payload });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

const server = http.createServer(app);

const wss = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => {
    return protocols.has("auth") ? "auth" : false;
  },
});

type UserCtx = { userId: string; username: string };
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
    const user: UserCtx = { userId: payload.sub, username: payload.username };

    wss.handleUpgrade(req, socket, head, (ws) => {
      connectedUsers.set(user.userId, {
        user: user,
        ws: ws,
      });
      wss.emit("connection", ws, req, user.userId);
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

    console.log("userId", userId);

    const welcomeMessage = `${me.username} joined`;
    console.log(welcomeMessage);

    for (const user of connectedUsers.values()) {
      user.ws.send(JSON.stringify(user.user));
    }

    ws.on("message", (data) => {
      console.log(`Received message: ${data}`);

      try {
        const message: ClientMessage = JSON.parse(data.toString("utf-8"));

        switch (message.message.type) {
          case MessageTypes.chat:
            console.log(message.message.content);
            break;
          case MessageTypes.signalOffer:
            console.log(message.message.to);
            console.log(message.message.sdp);
            break;
        }

        ws.send(`Server received: ${data}`);
      } catch (error) {
        ws.send("Server received: Invalid message");
      }
    });

    ws.on("close", () => {
      connectedUsers.delete(userId);

      for (const user of connectedUsers.values()) {
        user.ws.send(JSON.stringify(user.user));
      }

      console.log("Client disconnected");
    });
  }
);

server.listen(5000, () => {
  console.log("HTTP + WS listening on http://localhost:5000");
});

interface ClientMessage {
  message: ChatMessage | OfferMessage;
}

enum MessageTypes {
  chat = "chat",
  signalOffer = "signal:offer",
}

interface ChatMessage {
  type: MessageTypes.chat;
  content: string;
}

interface OfferMessage {
  type: MessageTypes.signalOffer;
  to: string;
  sdp: string;
}
