import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "USER" },
      select: { id: true, email: true, name: true, role: true },
    });

    // 回傳內容經過 select 過濾，password 不可能外洩。
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    // P2002 = unique constraint 衝突，代表 email 已被註冊。
    // 交給資料庫判斷而不是先查再寫，可避免兩個請求同時通過檢查。
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "這個 Email 已經註冊過了" },
        { status: 409 },
      );
    }

    console.error("register failed", error);
    return NextResponse.json({ error: "註冊失敗，請稍後再試" }, { status: 500 });
  }
}
