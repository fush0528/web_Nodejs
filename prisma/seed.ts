import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  const password = await bcrypt.hash("password123", BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "系統管理員",
      password,
      role: "ADMIN",
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice", password, role: "USER" },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob", password, role: "USER" },
  });

  // 每個人各自有資料，才能用來驗證彼此看不到對方的內容。
  await prisma.task.deleteMany({});
  await prisma.task.createMany({
    data: [
      { title: "完成期末專題報告", userId: alice.id },
      { title: "預約牙醫", userId: alice.id, done: true },
      { title: "整理 GitHub repo", userId: bob.id },
      { title: "檢查伺服器備份", userId: admin.id },
    ],
  });

  console.log("Seed 完成");
  console.log("  admin@example.com / password123  (ADMIN)");
  console.log("  alice@example.com / password123  (USER)");
  console.log("  bob@example.com   / password123  (USER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
