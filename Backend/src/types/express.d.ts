import { Role, AccountStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
        email: string;
        role: Role;
        status: AccountStatus;
      };
    }
  }
}

export {};
