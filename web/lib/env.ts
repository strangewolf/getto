export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24;
