/**
 * Auth utility functions untuk role-based access control
 */

export type UserRole = 'admin' | 'owner' | 'controller' | 'user';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'view_reports'],
  owner: ['read', 'write', 'view_reports'],
  controller: ['read', 'write'],
  user: ['read'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  owner: 'Owner/Manager',
  controller: 'Controller',
  user: 'User',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access to all system features and user management',
  owner: 'Can manage own resources and view reports',
  controller: 'Can read and modify assigned resources',
  user: 'Read-only access to resources',
};

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get dashboard path based on user role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/owner/ftth';
    case 'controller':
      return '/controller'; // Dashboard controller
    case 'user':
    default:
      return '/'; // or '/user' if you have a user landing page
  }
}

/**
 * Check if role is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if role is owner or admin
 */
export function isOwnerOrAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}