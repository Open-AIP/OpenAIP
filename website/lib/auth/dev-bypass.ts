export function isTempAdminBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_TEMP_ADMIN_BYPASS === "true";
}

