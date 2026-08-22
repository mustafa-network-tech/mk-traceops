"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/d1/database";
import { AuthRepository } from "@/lib/d1/repositories/auth";
import { RBAC_PROFILE_COOKIE,RBAC_USER_COOKIE } from "@/lib/rbac/session-server";
export async function signInAction(email:string,password:string):Promise<{ok:true}|{ok:false;error:string}>{const id=await new AuthRepository(getDatabase()).authenticate(email,password);if(!id)return{ok:false,error:"E-posta veya şifre hatalı."};const jar=await cookies();jar.set(RBAC_PROFILE_COOKIE,id,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*12});jar.delete(RBAC_USER_COOKIE);return{ok:true};}
export async function signOutAction():Promise<void>{const jar=await cookies();jar.delete(RBAC_PROFILE_COOKIE);jar.delete(RBAC_USER_COOKIE);redirect("/");}
