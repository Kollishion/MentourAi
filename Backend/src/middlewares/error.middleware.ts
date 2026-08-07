import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || err.status;

  if (!statusCode) {
    if (err.message === "Invalid credentials.") {
      statusCode = 401;
    } else if (
      err.message?.includes("already exists") ||
      err.message?.includes("Invalid") ||
      err.message?.includes("expired") ||
      err.message?.includes("verify")
    ) {
      statusCode = 400;
    } else {
      statusCode = 500;
      console.error(err);
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
