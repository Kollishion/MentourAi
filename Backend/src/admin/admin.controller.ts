import type { Request, Response, NextFunction } from "express";
import { getAllUsers, updateUserRole, updateUserStatus } from "./auth.service";

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const user = await updateUserRole(userId as string, role);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const changeUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; 
    const user = await updateUserStatus(userId as string, status);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
