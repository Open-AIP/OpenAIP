/**
 * Authentication and authorization helper utilities (UI-layer).
 */

export function getRolePath(baseURL: string, role: string): string {
  return `${baseURL}${role === "citizen" ? "" : "/" + role}`;
}

export function getRoleDisplayName(role: string): string {
  if (role === "citizen") return "Citizen";
  else if (role === 'admin') return 'Admin';
  return `${role.charAt(0).toUpperCase()}${role.slice(1)} Official`;
}

export function getRoleEmailPlaceholder(role: string): string {
  return role + `${role === 'citizen' || role === 'admin' ? '' : '-official'}@email.com`;
}