import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../jwt";

export default function authorize(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const payload = authHeader.split(" ");

  if (payload.length !== 2)
    return res
      .status(401)
      .json({ error: "Invalid authorization. Expected Bearer token." });

  const type = payload[0];

  if (type !== "Bearer")
    return res
      .status(401)
      .json({ error: "Invalid authorization. Expected Bearer token." });

  try {
    const token = payload[1];
    const userClaims = verifyJwt(token);
    res.locals.userClaims = userClaims;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
