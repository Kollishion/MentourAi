import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import "dotenv/config";
import authRoutes from "./modules/auth/auth.routes";
import { adminRouter } from "./admin/admin.router";
import morgan from "morgan";
import express from "express";
const app = express();
app.disable("x-powered-by");

app.use(helmet({crossOriginResourcePolicy: false}));

app.use(cors({origin: process.env.CLIENT_URL ?? "http:localhost:5173", credentials: true,}));
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
app.use("/api/v1/admin", adminRouter);
app.use("/{*any}", (_, res)=>{
	res.status(404).json({
		message: "Route not found",
	});
});


export default app;
