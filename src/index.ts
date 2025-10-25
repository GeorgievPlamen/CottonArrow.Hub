import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send("Alive and well.");
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
