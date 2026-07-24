import prisma from "../config/prisma.ts";
import type { Role, AccountStatus } from "@prisma/client";

export const getAllUsers = async () => {
  return prisma.user.findMany({
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
    orderBy: { createdAt: "desc" },
  });
};

export const updateUserRole = async (userId: string, role: Role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, username: true, email: true, role: true },
  });
};

export const updateUserStatus = async (userId: string, status: AccountStatus) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, username: true, email: true, status: true },
  });

  if (status !== "ACTIVE") {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  return user;
};
