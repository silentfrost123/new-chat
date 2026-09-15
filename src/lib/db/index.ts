import initSqlJs, { type Database as SqlJsDatabase, type Statement } from "sql.js";
import { drizzle, type SQLJsDatabase as DrizzleDb } from "drizzle-orm/sql-js";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "data", "vellum.db");

type GlobalDb = {
  sql: SqlJsDatabase;
  db: DrizzleDb<typeof schema>;
};

const g = globalThis as unknown as { __vellumDb?: GlobalDb; __vellumInit?: Promise<GlobalDb> };

function persist(sql: SqlJsDatabase) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(sql.export()));
  } catch (err) {
    console.error("[vellum] db persist error", err);
  }
}

function patchForPersist(sql: SqlJsDatabase) {
  const origPrepare = sql.prepare.bind(sql);
  sql.prepare = ((query: string) => {
    const stmt = origPrepare(query) as Statement;
    const origStep = stmt.step.bind(stmt);
    const origRun = stmt.run.bind(stmt);

    stmt.step = (() => {
      const result = origStep();
      // After a write statement finishes stepping
      return result;
    }) as typeof stmt.step;

    stmt.run = ((params?: BindParams) => {
      const result = origRun(params as never);
      const q = query.trim().toUpperCase();
      if (
        q.startsWith("INSERT") ||
        q.startsWith("UPDATE") ||
        q.startsWith("DELETE") ||
        q.startsWith("CREATE") ||
        q.startsWith("DROP") ||
        q.startsWith("ALTER")
      ) {
        persist(sql);
      }
      return result;
    }) as typeof stmt.run;

    // free is fine
    return stmt;
  }) as typeof sql.prepare;

  const origRun = sql.run.bind(sql);
  sql.run = ((query: string, params?: BindParams) => {
    const result = origRun(query, params as never);
    const q = query.trim().toUpperCase();
    if (
      q.startsWith("INSERT") ||
      q.startsWith("UPDATE") ||
      q.startsWith("DELETE") ||
      q.startsWith("CREATE") ||
      q.startsWith("DROP") ||
      q.startsWith("ALTER")
    ) {
      persist(sql);
    }
    return result;
  }) as typeof sql.run;

  const origExec = sql.exec.bind(sql);
  sql.exec = ((query: string) => {
    const result = origExec(query);
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(query)) {
      persist(sql);
    }
    return result;
  }) as typeof sql.exec;
}

type BindParams = unknown;

export async function initDatabase(): Promise<DrizzleDb<typeof schema>> {
  if (g.__vellumDb) return g.__vellumDb.db;

  if (!g.__vellumInit) {
    g.__vellumInit = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file: string) =>
          path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
      });

      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const sql: SqlJsDatabase = fs.existsSync(dbPath)
        ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
        : new SQL.Database();

      patchForPersist(sql);

      const db = drizzle(sql, { schema });
      g.__vellumDb = { sql, db };
      return g.__vellumDb;
    })();
  }

  const result = await g.__vellumInit;
  return result.db;
}

export function saveDb() {
  if (g.__vellumDb) persist(g.__vellumDb.sql);
}

/**
 * Sync DB accessor. Requires initDatabase() to have completed
 * (via instrumentation.ts or await ensureDb() in the route).
 */
export const db: DrizzleDb<typeof schema> = new Proxy({} as DrizzleDb<typeof schema>, {
  get(_t, prop, receiver) {
    if (!g.__vellumDb) {
      throw new Error(
        "Database not ready. Ensure instrumentation has run or call await initDatabase() first."
      );
    }
    const value = Reflect.get(g.__vellumDb.db as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...a: unknown[]) => unknown).bind(g.__vellumDb.db);
    }
    return value;
  },
});

export async function ensureDb() {
  return initDatabase();
}

export { schema };
