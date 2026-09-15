/**
 * Synchronous-friendly DB bootstrap used by server modules.
 * Loads sql.js once, persists to data/vellum.db after writes.
 */
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { drizzle, type SQLJsDatabase as DrizzleDb } from "drizzle-orm/sql-js";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "data", "vellum.db");

type G = typeof globalThis & {
  __vellum?: {
    sql: SqlJsDatabase;
    db: DrizzleDb<typeof schema>;
    ready: boolean;
  };
};

function persist(sql: SqlJsDatabase) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(sql.export()));
  } catch (e) {
    console.error("DB persist failed", e);
  }
}

let initPromise: Promise<DrizzleDb<typeof schema>> | null = null;

export async function getDb(): Promise<DrizzleDb<typeof schema>> {
  const g = globalThis as G;
  if (g.__vellum?.ready) return g.__vellum.db;

  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
      });

      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const sql: SqlJsDatabase = fs.existsSync(dbPath)
        ? new SQL.Database(fs.readFileSync(dbPath))
        : new SQL.Database();

      // Patch run to persist mutations
      const origRun = sql.run.bind(sql);
      sql.run = ((query: string, params?: Binding) => {
        const r = origRun(query, params as never);
        const t = query.trim().slice(0, 6).toUpperCase();
        if (["INSERT", "UPDATE", "DELETE", "CREATE", "DROP T", "ALTER "].some((x) => t.startsWith(x.slice(0, 6)))) {
          persist(sql);
        }
        return r;
      }) as typeof sql.run;

      // Also hook exec
      const origExec = sql.exec.bind(sql);
      sql.exec = ((query: string) => {
        const r = origExec(query);
        const t = query.trim().slice(0, 6).toUpperCase();
        if (["INSERT", "UPDATE", "DELETE", "CREATE", "DROP T", "ALTER "].some((x) =>
          query.toUpperCase().includes(x.trim())
        )) {
          persist(sql);
        }
        return r;
      }) as typeof sql.exec;

      const db = drizzle(sql, { schema });
      g.__vellum = { sql, db, ready: true };
      return db;
    })();
  }

  return initPromise;
}

type Binding = unknown;

/** Persist immediately (call after batch writes if needed) */
export async function flushDb() {
  const g = globalThis as G;
  if (g.__vellum?.sql) persist(g.__vellum.sql);
}

export { schema };
