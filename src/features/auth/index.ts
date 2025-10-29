import express from "express";
import { randomUUID } from "node:crypto";
import { generateJwt, verifyJwt } from "./jwt";

const authRouter = express.Router();

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (password !== "passw0rd") {
    res.status(401);
    return res.json({ error: "Invalid credentials" });
  }

  const jwt = generateJwt(randomUUID(), username);

  res.status(200);
  res.json({ token: jwt });
});

authRouter.get("/protected", (req, res) => {
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

export default authRouter;