import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { createInvite, acceptInvite, listPendingInvites } from '../services/adminInvite';
import { requireAdminAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router: ExpressRouter = Router();

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'ORDER_MANAGER', 'STUDIO_MANAGER']),
});

const acceptInviteSchema = z.object({
  inviteCode: z.string(),
  supabaseUid: z.string(),
  name: z.string().min(1),
});

// POST /api/admin/invite - Only SUPER_ADMIN can create invites
router.post('/invite',
  requireAdminAuth,
  requireRole(['SUPER_ADMIN']),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, role } = createInviteSchema.parse(req.body);

      const invitedBy = req.admin!.email;

      const result = await createInvite(email, role, invitedBy);

      res.json({
        success: true,
        data: {
          inviteCode: result.inviteCode,
          email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/accept-invite
router.post('/accept-invite', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { inviteCode, supabaseUid, name } = acceptInviteSchema.parse(req.body);

    const admin = await acceptInvite(inviteCode, supabaseUid, name);

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/invites - Only SUPER_ADMIN can list invites
router.get('/invites',
  requireAdminAuth,
  requireRole(['SUPER_ADMIN']),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invites = await listPendingInvites();

      res.json({
        success: true,
        data: { invites },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/me
router.get('/me', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      admin: {
        id: req.admin!.id,
        email: req.admin!.email,
        name: req.admin!.name,
        role: req.admin!.role,
      },
    },
  });
});

export default router as import("express").Router;
