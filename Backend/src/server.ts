// Option A: Bun auto-loads .env from cwd (no import needed)
// Option B: Explicit path fallback for non-Bun runtimes
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../.env") }); // Points to backend/.env

import app from "./app";
import { connectDB } from "./config/db";
import type prisma from "./config/prisma";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
