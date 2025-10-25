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

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket, req) => {
  console.log("Client connected", req.socket.remoteAddress);
  console.log("Client connected", req);

  ws.on("message", (data) => {
    console.log(`Received message: ${data}`);
    const message: WsMessage = JSON.parse(data.toString("utf-8"));
    console.log(`Received message: ${message.message}`);
    console.log(`Received message: ${message.username}`);
    ws.send(`Server received: ${data}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(5000, () => {
  console.log("HTTP + WS listening on http://localhost:5000");
});

interface WsMessage {
  username: string;
  message: string;
}
