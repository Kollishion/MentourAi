import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import "dotenv/config";
import authRoutes from "./modules/auth/auth.routes";
import aiRoutes from "./modules/ai/ai.routes";
import { adminRouter } from "./admin/admin.router";
import morgan from "morgan";
import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.ts";

const app = express();
app.disable("x-powered-by");

app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(compression());

app.use(cookieParser());

app.get("/health", (_, res) => {
	res.status(200).json({
		success: true,
		message: "Server is healthy",
		timeStamp: new Date().toISOString()
	});
});

app.use(morgan('dev'));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/admin", adminRouter);

app.use("/{*any}", (_, res) => {
	res.status(404).json({
		message: "Route not found",
	});
});

app.use(errorMiddleware);

export default app;
