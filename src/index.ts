import express from "express";
import http from "node:http";
import authRouter from "./features/auth";
import path from "node:path";
import { setupWebSocket } from "./ws";

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

setupWebSocket(server);

server.listen(5000, () => {
  console.log("HTTP + WS listening on http://localhost:5000");
});
