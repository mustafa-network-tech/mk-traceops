import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Database = D1Database;

export function getDatabase(): Database {
  return getCloudflareContext().env.DB;
}

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
