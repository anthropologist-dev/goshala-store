import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { poolConfig } from "./pool-config";

const globalForDb = globalThis as unknown as { pool?: Pool };

// pg doesn't open a connection until the first query, so this is safe at build time.
const pool = globalForDb.pool ?? new Pool(poolConfig());
globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };
