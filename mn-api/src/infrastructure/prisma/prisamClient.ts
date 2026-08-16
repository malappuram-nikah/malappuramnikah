import { config } from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Ensure .env is loaded before PrismaClient reads DATABASE_URL
config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

export default prisma;
