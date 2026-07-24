import bcrypt from "bcrypt";
import prisma from "../../config/prisma.ts";
import { sendEmail } from "../../config/mailer.ts";
import { generateOtp, generateToken, hashToken } from "../../utils/token.ts";
import type { RegisterInput, LoginInput } from "../auth/auth.validation.ts";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.ts";

const OTP_EXPIRY_MINUTES = 10;
const RESET_EXPIRY_MINUTES = 15;

export const registerUser = async (data: RegisterInput) => {
  const usernameExists = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (usernameExists) {
    throw new Error("Username already exists.");
  }

  const emailExists = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (emailExists) {
    throw new Error("Email already exists.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      token: hashToken(otp),
      userId: user.id,
      expiresAt,
    },
  });

  await sendEmail(
    user.email,
    "Verify your email",
    `<p>Your verification code is <b>${otp}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  );

  return user;
};

export const verifyEmail = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid verification request.");
  }
  if (user.emailVerified) {
    throw new Error("Email is already verified.");
  }

  const hashedOtp = hashToken(otp);

  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      token: hashedOtp,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new Error("Invalid or expired OTP.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });
};

export const resendVerificationEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("No account found with this email.");
  }
  if (user.emailVerified) {
    throw new Error("Email is already verified.");
  }
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      token: hashToken(otp),
      userId: user.id,
      expiresAt,
    },
  });

  await sendEmail(
    user.email,
    "Verify your email",
    `<p>Your verification code is <b>${otp}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  );
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const validPassword = await bcrypt.compare(data.password, user.password);
  if (!validPassword) {
    throw new Error("Invalid credentials.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("This account is not active. Contact support.");
  }

  if (!user.emailVerified) {
  throw new Error("Please verify your email before logging in.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const payload = {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  };

  const accessToken = await generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: updatedUser.id,
      expiresAt,
    },
  });

  const safeUser = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    role: updatedUser.role,
    status: updatedUser.status,
    emailVerified: updatedUser.emailVerified,
    lastLoginAt: updatedUser.lastLoginAt,
    createdAt: updatedUser.createdAt,
  };

  return { user: safeUser, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token.");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new Error("User not found.");
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = await generateAccessToken(payload);

  return accessToken;
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token: hashToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail(
    user.email,
    "Reset your password",
    `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in ${RESET_EXPIRY_MINUTES} minutes.</p>`,
  );
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashedIncoming = hashToken(token);

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedIncoming,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new Error("Invalid or expired reset token.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: record.userId } });
};

export const getProfile = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
};

export const logoutUser = async (refreshToken: string) => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};
