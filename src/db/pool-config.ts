import type { PoolConfig } from "pg";

/**
 * Builds pg Pool options from DATABASE_URL.
 *
 * - Supabase, Neon and Render external URLs need TLS. pg lets `sslmode` in the URL override the `ssl`
 *   option, so we strip it and set TLS explicitly (these providers use their own CA).
 * - On serverless hosts (Netlify) each function instance keeps at most one connection; use Supabase's
 *   transaction pooler (port 6543) there.
 */
export function poolConfig(url = process.env.DATABASE_URL): PoolConfig {
  if (!url) return {}; // e.g. during `next build`; pg only connects on the first query
  const u = new URL(url);
  const host = u.hostname;
  const local = ["localhost", "127.0.0.1", "::1"].includes(host) || !host.includes(".");
  const wantsTls = u.searchParams.has("sslmode") ? u.searchParams.get("sslmode") !== "disable" : !local;
  u.searchParams.delete("sslmode");
  const serverless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
  return {
    connectionString: u.toString(),
    ssl: wantsTls ? { rejectUnauthorized: false } : undefined,
    max: serverless ? 1 : 5,
    idleTimeoutMillis: serverless ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  };
}
