import "server-only";
import type { Database } from "../database";
import { verifyPassword } from "@/lib/auth/password";
export class AuthRepository {
  constructor(private readonly db: Database) {}
  async authenticate(email: string, password: string): Promise<string | null> { const row = await this.db.prepare(`SELECT c.profile_id,c.password_hash,c.password_salt,c.iterations FROM auth_credentials c JOIN profiles p ON p.id=c.profile_id WHERE c.email=? AND p.status='active'`).bind(email.trim().toLowerCase()).first<{ profile_id: string; password_hash: string; password_salt: string; iterations: number }>(); if (!row) return null; return await verifyPassword(password, row.password_hash, row.password_salt, row.iterations) ? row.profile_id : null; }
}
