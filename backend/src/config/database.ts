import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log("PostgreSQL connected");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("PostgreSQL disconnected");
}
