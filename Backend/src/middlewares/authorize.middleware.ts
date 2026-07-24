import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions.",
      });
    }
    next();
  };
};
