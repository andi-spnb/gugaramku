'use client';

import { useSession } from 'next-auth/react';

export type UserRole = 'OWNER' | 'ADMIN_CABANG' | 'KASIR';

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  cabangId: string | null;
  cabangNama: string | null;
  cabangKode: string | null;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const user: CurrentUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role as UserRole,
        cabangId: session.user.cabangId,
        cabangNama: session.user.cabangNama,
        cabangKode: session.user.cabangKode,
      }
    : null;

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

// Helper untuk cek role
export function useHasRole(allowedRoles: UserRole | UserRole[]) {
  const { user } = useCurrentUser();
  
  if (!user) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
}

// Helper untuk cek apakah owner
export function useIsOwner() {
  return useHasRole('OWNER');
}

// Helper untuk cek apakah admin atau owner
export function useIsAdmin() {
  return useHasRole(['OWNER', 'ADMIN_CABANG']);
}
