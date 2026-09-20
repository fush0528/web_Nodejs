import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api";
import { ownerScope } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { taskIdSchema, taskPatchSchema } from "@/lib/validations";

type Context = { params: Promise<{ id: string }> };

function invalidId() {
  return NextResponse.json({ error: "Task ID 格式錯誤" }, { status: 400 });
}

/** 更新 title 或 done；未擁有的資源一律回傳 404，避免洩漏資料存在性。 */
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const id = taskIdSchema.safeParse((await params).id);
  if (!id.success) return invalidId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { count } = await prisma.task.updateMany({
    where: { id: id.data, ...ownerScope(user) },
    data: parsed.data,
  });
  if (count === 0) {
    return NextResponse.json({ error: "找不到資料，或你沒有權限修改" }, { status: 404 });
  }
  const task = await prisma.task.findUnique({ where: { id: id.data } });
  return NextResponse.json({ data: task });
}

/** 刪除 Task。 */
export async function DELETE(_request: Request, { params }: Context) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const id = taskIdSchema.safeParse((await params).id);
  if (!id.success) return invalidId();
  const { count } = await prisma.task.deleteMany({
    where: { id: id.data, ...ownerScope(user) },
  });
  if (count === 0) {
    return NextResponse.json({ error: "找不到資料，或你沒有權限刪除" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
