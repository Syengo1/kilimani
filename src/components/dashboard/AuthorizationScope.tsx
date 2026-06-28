'use client';

import { ReactNode } from 'react';
import { AppRole } from '@/app/(admin)/dashboard/layout';
import { ShieldAlert } from 'lucide-react';

interface AuthorizationScopeProps {
  allowedRoles: AppRole[];
  userRole: AppRole;
  children: ReactNode;
  fallback?: ReactNode | 'alert';
}

export function AuthorizationScope({ allowedRoles, userRole, children, fallback = null }: AuthorizationScopeProps) {
  const isAuthorized = allowedRoles.includes(userRole);

  if (!isAuthorized) {
    if (fallback === 'alert') {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-destructive/20 bg-destructive/5 rounded-2xl">
          <ShieldAlert className="text-destructive mb-2" size={24} />
          <h4 className="text-sm font-bold text-destructive">Clearance Required</h4>
          <p className="text-xs text-destructive/70 mt-1">You do not have access to this module.</p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}