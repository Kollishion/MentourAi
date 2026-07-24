import Router from "express";
import * as authController from "./auth.controller.ts";
import { authenticate } from "../../middlewares/authenticate.middleware.ts";
const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/verify-email", authController.verifyEmailHandler);
authRouter.post("/resend-verification", authController.resendVerification);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/forgot-password", authController.forgotPasswordHandler);
authRouter.post("/reset-password", authController.resetPasswordHandler);
authRouter.get("/profile", authenticate, authController.profile);
authRouter.post("/logout", authController.logout);

export default authRouter;
