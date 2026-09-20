import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("[seed] 資料庫已有使用者，略過初始化。");
    return;
  }
  console.log("[seed] 資料庫是空的，建立示範帳號…");
  const password = await bcrypt.hash("password123", 12);
  const admin = await prisma.user.create({
    data: { email: "admin@example.com", name: "系統管理員", password, role: "ADMIN" },
  });
  const alice = await prisma.user.create({
    data: { email: "alice@example.com", name: "Alice", password, role: "USER" },
  });
  const bob = await prisma.user.create({
    data: { email: "bob@example.com", name: "Bob", password, role: "USER" },
  });
  await prisma.task.createMany({
    data: [
      { title: "完成期末專題報告", userId: alice.id },
      { title: "預約牙醫", userId: alice.id, done: true },
      { title: "整理 GitHub repo", userId: bob.id },
      { title: "檢查伺服器備份", userId: admin.id },
    ],
  });
  console.log("[seed] 完成：admin@example.com / password123");
}

main()
  .catch((e) => {
    console.error("[seed] 失敗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
