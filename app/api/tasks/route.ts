import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api";
import { ownerScope } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { taskTitleSchema } from "@/lib/validations";

const taskSelect = {
  id: true,
  title: true,
  done: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: { select: { email: true } },
} as const;

/** 取得自己擁有的 Task；管理員可取得全部 Task。 */
export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const tasks = await prisma.task.findMany({
    where: ownerScope(user),
    select: taskSelect,
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ data: tasks });
}

/** 建立 Task，擁有者一律由登入 session 決定。 */
export async function POST(request: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const parsed = taskTitleSchema.safeParse(
    typeof body === "object" && body !== null ? (body as { title?: unknown }).title : undefined,
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: { title: parsed.data, userId: user.id },
    select: taskSelect,
  });
  return NextResponse.json({ data: task }, { status: 201 });
}
