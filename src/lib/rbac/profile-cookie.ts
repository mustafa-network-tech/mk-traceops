export function isRbacProfileCookieAllowed(): boolean {
  const value = process.env.RBAC_ALLOW_PROFILE_COOKIE?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
