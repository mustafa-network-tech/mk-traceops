"use server";
import { createId, getDatabase, nowIso } from "@/lib/d1/database";
import { hashPassword } from "@/lib/auth/password";
import { isValidFactorySlug, normalizeFactorySlug } from "@/lib/services/factory-slug";
export type FactorySelfRegisterResult = { ok: true; needsEmailConfirm?: boolean } | { ok: false; error: string };
export async function registerFactoryApplicantAction(input: { firstName: string; lastName: string; email: string; password: string; factoryName: string; factorySlugRaw: string }): Promise<FactorySelfRegisterResult> {
  const firstName=input.firstName.trim(), lastName=input.lastName.trim(), email=input.email.trim().toLowerCase(), factoryName=input.factoryName.trim(), slug=normalizeFactorySlug(input.factorySlugRaw);
  if (!firstName || !lastName || !email || !factoryName) return { ok:false,error:"Tüm zorunlu alanları doldurun." };
  if (!isValidFactorySlug(slug)) return { ok:false,error:"Fabrika kodu 2–48 karakter olmalı; küçük harf, rakam ve tire kullanın." };
  try {
    const duplicate=await getDatabase().prepare("SELECT id FROM factories WHERE slug=? UNION SELECT id FROM factory_registration_requests WHERE requested_slug=? AND status='pending' UNION SELECT profile_id AS id FROM auth_credentials WHERE email=? UNION SELECT request_id AS id FROM pending_registration_credentials WHERE email=? LIMIT 1").bind(slug,slug,email,email).first();
    if(duplicate) return {ok:false,error:"Bu e-posta veya fabrika kodu zaten kullanılıyor."};
    const credential=await hashPassword(input.password), requestId=createId(), now=nowIso();
    await getDatabase().batch([
      getDatabase().prepare("INSERT INTO factory_registration_requests (id,requested_factory_name,requested_slug,applicant_email,applicant_name,status,created_at) VALUES (?,?,?,?,?,'pending',?)").bind(requestId,factoryName,slug,email,`${firstName} ${lastName}`,now),
      getDatabase().prepare("INSERT INTO pending_registration_credentials (request_id,email,password_hash,password_salt,iterations,created_at) VALUES (?,?,?,?,?,?)").bind(requestId,email,credential.hash,credential.salt,credential.iterations,now),
    ]); return {ok:true,needsEmailConfirm:false};
  } catch(error){return {ok:false,error:error instanceof Error?error.message:"Başvuru oluşturulamadı."};}
}
