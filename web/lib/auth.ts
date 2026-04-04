import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { ACCESS_TOKEN_EXPIRE_MINUTES, getJwtSecret } from "@/lib/env";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

function secretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function createAccessToken(subject: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRE_MINUTES}m`)
    .sign(secretKey());
}

export async function decodeToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, secretKey());
  if (typeof payload.sub !== "string") throw new Error("Invalid token");
  return { sub: payload.sub };
}
