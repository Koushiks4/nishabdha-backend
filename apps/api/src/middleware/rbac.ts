import { Request, Response, NextFunction } from 'express';
import type { AdminRole } from '@nishabdha/database';

export function requireRole(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    return next();
  };
}

// Role hierarchy helpers
export function isSuperAdmin(admin: { role: AdminRole }): boolean {
  return admin.role === 'SUPER_ADMIN';
}

export function canManageProducts(admin: { role: AdminRole }): boolean {
  return ['SUPER_ADMIN', 'CONTENT_MANAGER'].includes(admin.role);
}

export function canManageOrders(admin: { role: AdminRole }): boolean {
  return ['SUPER_ADMIN', 'ORDER_MANAGER'].includes(admin.role);
}

export function canManageStudio(admin: { role: AdminRole }): boolean {
  return ['SUPER_ADMIN', 'STUDIO_MANAGER'].includes(admin.role);
}
