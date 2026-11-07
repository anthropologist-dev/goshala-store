// Edge-safe subset of auth (no next/headers), used by middleware.
import { jwtVerify } from "jose";
export const SESSION_COOKIE = "ssg_admin";
export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-secret-change-me"));
    return payload;
  } catch {
    return null;
  }
}
