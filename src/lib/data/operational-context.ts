import { getRbacSession } from "@/lib/rbac/session-server";

/** Paneldeki fabrika kullanıcısının `profiles.factory_id` değeri; platform_admin için null. */
export async function getOperationalFactoryId(): Promise<string | null> {
  const ctx = await getRbacSession();
  return ctx?.user.factoryId ?? null;
}

/**
 * Excel aktarımı gibi yazma işlemleri için zorunlu fabrika bağlamı.
 */
export async function requireOperationalFactoryId(): Promise<string> {
  const id = await getOperationalFactoryId();
  if (!id) {
    throw new Error(
      "Fabrika bağlamı yok. Bu işlem yalnızca fabrika kullanıcısı ile yapılabilir.",
    );
  }
  return id;
}
