import express from "express";
import { randomUUID } from "node:crypto";
import { generateJwt } from "./jwt";
import authorize from "../../middleware/authorize";

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

authRouter.get("/protected", authorize, (_, res) => {
  const user = res.locals.userClaims;

  res.json({ message: "You are authenticated!", user });
});

export default authRouter;
