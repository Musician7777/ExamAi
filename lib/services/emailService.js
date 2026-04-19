import { Resend } from 'resend';
import logger from '@/lib/logger';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'ExamAI <onboarding@resend.dev>';
const APP_NAME = 'ExamAI';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Send a password reset email.
 * In production (RESEND_API_KEY set), sends a real email via Resend.
 * In development, returns the reset URL for display in the UI.
 */
export async function sendPasswordResetEmail({ to, token }) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  if (!resend) {
    logger.warn('[emailService] RESEND_API_KEY not set — returning reset URL for dev display');
    return { sent: false, resetUrl, error: null };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${APP_NAME} — Reset your password`,
      html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 24px; font-weight: 700; margin: 0;">${APP_NAME}</h1>
                        <p style="color: #6b7280; margin-top: 4px;">Password Reset Request</p>
                    </div>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
                        <p style="margin: 0 0 16px;">You requested a password reset for your ${APP_NAME} account.</p>
                        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Click the button below to set a new password. This link expires in 1 hour.</p>
                        <a href="${resetUrl}"
                           style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Reset Password
                        </a>
                        <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">
                            If the button doesn't work, copy this link:<br/>
                            <span style="word-break: break-all; color: #6366f1;">${resetUrl}</span>
                        </p>
                    </div>
                    <p style="text-align: center; font-size: 13px; color: #9ca3af; margin-top: 24px;">
                        If you didn't request this, you can safely ignore this email.<br/>
                        Your password won't be changed until you click the link above.
                    </p>
                </div>
            `,
    });

    if (error) {
      logger.error({ err: error }, '[emailService] Resend error');
      return { sent: false, resetUrl: null, error: error.message };
    }

    logger.info({ to }, '[emailService] Password reset email sent');
    return { sent: true, resetUrl: null, error: null };
  } catch (err) {
    logger.error({ err }, '[emailService] Failed to send email');
    return { sent: false, resetUrl: null, error: err.message };
  }
}

/**
 * Send a verification or notification email (for future use).
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    logger.warn('[emailService] RESEND_API_KEY not set — email not sent');
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ err: error }, '[emailService] Resend error');
      return { sent: false, error: error.message };
    }

    return { sent: true, error: null };
  } catch (err) {
    logger.error({ err }, '[emailService] Failed to send email');
    return { sent: false, error: err.message };
  }
}
