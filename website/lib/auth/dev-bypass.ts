export function isTempAdminBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_TEMP_ADMIN_BYPASS === "true";
}

// NEW FUNCTION - Added for mock mode bypass (to revert, remove this entire function)
// ORIGINAL CODE:
// (file previously ended here)
export function isMockModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

