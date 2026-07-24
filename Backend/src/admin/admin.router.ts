import { Router } from "express";
import { changeUserRole, changeUserStatus, listUsers } from "./admin.controller";
import { authorize } from "../middlewares/authorize.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";
export const adminRouter = Router();

adminRouter.get("/users", authenticate, authorize("ADMIN"), listUsers);
adminRouter.patch("/users/:userId/role", authenticate, authorize("ADMIN"), changeUserRole);
adminRouter.patch("/users/:userId/status", authenticate, authorize("ADMIN"), changeUserStatus);
