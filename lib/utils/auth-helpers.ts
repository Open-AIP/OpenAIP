/**
 * Authentication and authorization helper utilities
 */

/**
 * Generate the role-specific path for navigation and redirects
 * @param baseURL - The base URL from environment
 * @param role - The user role (citizen, barangay, city)
 * @returns The role-specific path
 */
export function getRolePath(baseURL: string, role: string): string {
  return `${baseURL}${role === 'citizen' ? '' : '/' + role}`;
}

/**
 * Get the display name for a role
 * @param role - The user role
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: string): string {
  if (role === 'citizen') return 'Citizen';
  return `${role.charAt(0).toUpperCase()}${role.slice(1)} Official`;
}

/**
 * Get the placeholder email for a role
 * @param role - The user role
 * @returns Email placeholder string
 */
export function getRoleEmailPlaceholder(role: string): string {
  return role + `${role === 'citizen' ? '' : '-official'}@email.com`;
}
