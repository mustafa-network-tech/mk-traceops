import { randomBytes, randomUUID, pbkdf2Sync } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const ITERATIONS = 210_000;

export function createPasswordCredential(password) {
  if (password.length < 12) throw new Error("Şifre en az 12 karakter olmalıdır.");
  const salt = randomBytes(16);
  return {
    hash: pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("base64"),
    salt: salt.toString("base64"),
    iterations: ITERATIONS,
  };
}

function sqlValue(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function createAdminSql({ id, email, firstName, lastName, credential, now }) {
  return `PRAGMA foreign_keys = ON;
INSERT INTO profiles (id,factory_id,email,first_name,last_name,phone,role,status,created_at,updated_at)
VALUES (${sqlValue(id)},NULL,${sqlValue(email)},${sqlValue(firstName)},${sqlValue(lastName)},NULL,'platform_admin','active',${sqlValue(now)},${sqlValue(now)});
INSERT INTO auth_credentials (profile_id,email,password_hash,password_salt,iterations,created_at,updated_at)
VALUES (${sqlValue(id)},${sqlValue(email)},${sqlValue(credential.hash)},${sqlValue(credential.salt)},${credential.iterations},${sqlValue(now)},${sqlValue(now)});
`;
}

async function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Şifre girişi için interaktif bir terminal gereklidir.");
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let value = "";
  return new Promise((resolve, reject) => {
    const cleanup = () => { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", onData); };
    const onData = (buffer) => {
      for (const char of buffer.toString("utf8")) {
        if (char === "\u0003") { cleanup(); process.stdout.write("\n"); reject(new Error("İşlem iptal edildi.")); return; }
        if (char === "\r" || char === "\n") { cleanup(); process.stdout.write("\n"); resolve(value); return; }
        if (char === "\u007f" || char === "\b") { value = value.slice(0, -1); continue; }
        if (char >= " ") value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const target = process.argv.includes("--remote") ? "--remote" : process.argv.includes("--local") ? "--local" : null;
  if (!target) throw new Error("Hedef zorunlu: --local veya --remote kullanın.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await rl.question("Admin e-posta: ")).trim().toLowerCase();
  const firstName = (await rl.question("Ad: ")).trim();
  const lastName = (await rl.question("Soyad: ")).trim();
  rl.close();
  if (!/^\S+@\S+\.\S+$/.test(email) || !firstName || !lastName) throw new Error("Geçerli e-posta, ad ve soyad zorunludur.");
  const password = await readHidden("Şifre (en az 12 karakter): ");
  const confirmation = await readHidden("Şifre tekrar: ");
  if (password !== confirmation) throw new Error("Şifreler eşleşmiyor.");

  const now = new Date().toISOString();
  const sql = createAdminSql({ id: randomUUID(), email, firstName, lastName, credential: createPasswordCredential(password), now });
  const tempRoot = mkdtempSync(path.join(tmpdir(), "mk-traceops-admin-"));
  const sqlFile = path.join(tempRoot, "bootstrap.sql");
  try {
    writeFileSync(sqlFile, sql, { encoding: "utf8", mode: 0o600 });
    const wrangler = path.resolve("node_modules/wrangler/bin/wrangler.js");
    const result = spawnSync(process.execPath, [wrangler, "d1", "execute", "DB", target, `--file=${sqlFile}`], { cwd: process.cwd(), stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Wrangler ${result.status ?? "bilinmeyen"} koduyla sonlandı.`);
    process.stdout.write(`Platform admin oluşturuldu: ${email} (${target.slice(2)})\n`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => { process.stderr.write(`Hata: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
