import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { registerSchema, validateRequest } from '@/lib/validation';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
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
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'credentials',
    });

    return NextResponse.json({ message: 'Account created successfully', userId: user._id }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
