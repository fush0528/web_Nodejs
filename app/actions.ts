"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { AuthError, ownerScope, requireUser } from "@/lib/guard";
import { taskIdSchema, taskTitleSchema } from "@/lib/validations";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * 修復紀錄：此檔案原本的實作沒有任何擁有者檢查。
 * createTask 不寫入 userId，deleteTask(id) 也只憑 id 就刪除，
 * 任何登入者都能刪掉其他人的資料（IDOR）。
 * 現在每個操作都經過 requireUser() + ownerScope()。
 */

export async function createTask(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = taskTitleSchema.safeParse(formData.get("title"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await prisma.task.create({
    data: { title: parsed.data, userId: user.id },
  });

  revalidatePath("/");
  return { ok: true };
}

/** 供 useActionState 使用的包裝，簽章需為 (prevState, formData)。 */
export async function createTaskFormAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createTask(formData);
}

export async function toggleTask(id: number, done: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const taskId = taskIdSchema.parse(id);

  // updateMany + 擁有者條件：條件不符時 count 為 0，資料不會被動到。
  const { count } = await prisma.task.updateMany({
    where: { id: taskId, ...ownerScope(user) },
    data: { done },
  });

  if (count === 0) {
    throw new AuthError("找不到資料，或你沒有權限修改", 404);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateTask(id: number, title: string): Promise<ActionResult> {
  const user = await requireUser();
  const taskId = taskIdSchema.parse(id);

  const parsed = taskTitleSchema.safeParse(title);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { count } = await prisma.task.updateMany({
    where: { id: taskId, ...ownerScope(user) },
    data: { title: parsed.data },
  });

  if (count === 0) {
    throw new AuthError("找不到資料，或你沒有權限修改", 404);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteTask(id: number): Promise<ActionResult> {
  const user = await requireUser();
  const taskId = taskIdSchema.parse(id);

  const { count } = await prisma.task.deleteMany({
    where: { id: taskId, ...ownerScope(user) },
  });

  if (count === 0) {
    throw new AuthError("找不到資料，或你沒有權限刪除", 404);
  }

  revalidatePath("/");
  return { ok: true };
}
