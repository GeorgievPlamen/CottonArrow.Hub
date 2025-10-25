import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export interface JwtPayload {
  sub: string;
  username: string;
}

export function generateJwt(userId: string, username: string) {
  const payload: JwtPayload = {
    sub: userId,
    username,
  };

  // expires in 15 minutes (customize this!)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
