import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';
import { registerSchema, validateRequest } from '@/lib/validation';
import { rateLimit } from '@/lib/services/rateLimitService';
import { sendRegistrationVerificationEmail } from '@/lib/services/emailService';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const rateLimitResult = await rateLimit(request, 5, 900000);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists but is unverified, allow re-registration (update name/password + resend verification)
      if (!existingUser.emailVerified && existingUser.authProvider === 'credentials') {
        // Update name and password with new values
        existingUser.name = name;
        existingUser.password = await bcrypt.hash(password, 12);
        await existingUser.save();

        // Invalidate any previous verification tokens for this email
        await EmailVerification.updateMany(
          { userId: email, type: 'registration', used: false },
          { $set: { used: true } }
        );

        // Generate a new verification token
        const token = crypto.randomBytes(32).toString('hex');
        await EmailVerification.create({
          userId: email,
          type: 'registration',
          currentEmail: email,
          newEmail: email,
          token,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        });

        // Send verification email
        const emailResult = await sendRegistrationVerificationEmail({ to: email, token });

        if (emailResult.sent) {
          return NextResponse.json({
            message: 'Verification email sent! Please check your inbox to activate your account.',
            verificationSent: true,
          });
        }

        // Email failed — provide fallback for dev
        return NextResponse.json({
          message: 'Account exists but is unverified. Verification email could not be sent.',
          verificationSent: false,
          ...(process.env.NODE_ENV === 'development' && emailResult.verifyUrl
            ? { verifyUrl: emailResult.verifyUrl }
            : {}),
        });
      }

      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password and create user (unverified)
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'credentials',
      emailVerified: false,
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    await EmailVerification.create({
      userId: email,
      type: 'registration',
      currentEmail: email,
      newEmail: email,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    // Send verification email
    const emailResult = await sendRegistrationVerificationEmail({ to: email, token });

    if (emailResult.sent) {
      return NextResponse.json(
        {
          message: 'Account created! Please check your email to verify your account.',
          verificationSent: true,
        },
        { status: 201 }
      );
    }

    // Email failed — still created account, provide fallback
    logger.warn({ email }, 'Registration verification email failed to send');
    return NextResponse.json(
      {
        message:
          'Account created, but verification email could not be sent. Please use the resend verification option on the login page.',
        verificationSent: false,
        ...(process.env.NODE_ENV === 'development' && emailResult.verifyUrl
          ? { verifyUrl: emailResult.verifyUrl }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
