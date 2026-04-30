import { prisma } from '@nishabdha/database';
import { supabaseAdmin } from '../utils/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';

type AdminRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'ORDER_MANAGER' | 'STUDIO_MANAGER';

function generateInviteCode(): string {
  return randomBytes(32).toString('hex');
}

export async function createInvite(
  email: string,
  role: AdminRole,
  invitedBy: string
): Promise<{ inviteCode: string }> {
  // Check if email already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    throw new Error('Admin with this email already exists');
  }

  // Check for pending invite
  const pendingInvite = await prisma.adminInvite.findFirst({
    where: {
      email,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingInvite) {
    throw new Error('Pending invite already exists for this email');
  }

  // Create invite record
  const invite = await prisma.adminInvite.create({
    data: {
      email,
      role,
      invitedBy,
      inviteCode: generateInviteCode(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Send Supabase invite email
  const redirectUrl = `${config.adminUrl}/accept-invite?code=${invite.inviteCode}`;

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    // Rollback invite creation
    await prisma.adminInvite.delete({ where: { id: invite.id } });
    throw new Error(`Failed to send invite: ${error.message}`);
  }

  logger.info(`Admin invite sent to ${email} by ${invitedBy}`);

  return { inviteCode: invite.inviteCode };
}

export async function validateInvite(inviteCode: string) {
  const invite = await prisma.adminInvite.findUnique({
    where: { inviteCode },
  });

  if (!invite) {
    throw new Error('Invite not found');
  }

  if (invite.isUsed) {
    throw new Error('Invite already used');
  }

  if (invite.expiresAt < new Date()) {
    throw new Error('Invite expired');
  }

  return invite;
}

export async function acceptInvite(
  inviteCode: string,
  supabaseUid: string,
  name: string
) {
  const invite = await validateInvite(inviteCode);

  // Create admin record
  const admin = await prisma.admin.create({
    data: {
      supabaseUid,
      email: invite.email,
      name,
      role: invite.role,
    },
  });

  // Mark invite as used
  await prisma.adminInvite.update({
    where: { id: invite.id },
    data: {
      isUsed: true,
      acceptedAt: new Date(),
    },
  });

  logger.info(`Admin invite accepted: ${invite.email}`);

  return admin;
}

export async function listPendingInvites() {
  return prisma.adminInvite.findMany({
    where: {
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { invitedAt: 'desc' },
  });
}
