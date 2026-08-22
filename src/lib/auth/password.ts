import "server-only";
const ITERATIONS = 210_000;
const encoder = new TextEncoder();
function bytesToBase64(bytes: Uint8Array): string { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function base64ToBytes(value: string): Uint8Array { const raw = atob(value); return Uint8Array.from(raw, (char) => char.charCodeAt(0)); }
async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> { const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256); return new Uint8Array(bits); }
export async function hashPassword(password: string): Promise<{ hash: string; salt: string; iterations: number }> { if (password.length < 8) throw new Error("Şifre en az 8 karakter olmalıdır."); const salt = crypto.getRandomValues(new Uint8Array(16)); return { hash: bytesToBase64(await derive(password, salt, ITERATIONS)), salt: bytesToBase64(salt), iterations: ITERATIONS }; }
export async function verifyPassword(password: string, expected: string, salt: string, iterations: number): Promise<boolean> { const actual = await derive(password, base64ToBytes(salt), iterations); const target = base64ToBytes(expected); if (actual.length !== target.length) return false; let diff = 0; for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ target[i]; return diff === 0; }
