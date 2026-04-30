import { supabaseAdmin } from '../utils/supabase';
import { logger } from '../utils/logger';

/**
 * Email OTP Service using Supabase Auth
 *
 * This service uses Supabase's built-in email OTP functionality.
 * The OTP is sent via email and managed entirely by Supabase.
 */

export async function sendEmailOTP(email: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Don't set emailRedirectTo - this tells Supabase to send OTP instead of magic link
      },
    });

    if (error) {
      logger.error(`Failed to send email OTP to ${email}:`, error);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }

    logger.info(`Email OTP sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending email OTP to ${email}:`, error);
    throw error;
  }
}

export async function verifyEmailOTP(email: string, token: string): Promise<{ userId: string; email: string }> {
  try {
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      logger.error(`Failed to verify email OTP for ${email}:`, error);
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Verification succeeded but no user data returned');
    }

    logger.info(`Email OTP verified for ${email}`);

    return {
      userId: data.user.id,
      email: data.user.email!,
    };
  } catch (error) {
    logger.error(`Error verifying email OTP for ${email}:`, error);
    throw error;
  }
}

/**
 * Cleanup: Delete Supabase user if customer creation fails
 * This ensures we don't have orphaned Supabase users
 */
export async function cleanupSupabaseUser(userId: string): Promise<void> {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    logger.info(`Cleaned up Supabase user: ${userId}`);
  } catch (error) {
    logger.error(`Failed to cleanup Supabase user ${userId}:`, error);
  }
}
