"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  await prisma.task.create({ data: { title } });
  revalidatePath("/");
}

export async function toggleTask(id: number, done: boolean) {
  await prisma.task.update({ where: { id }, data: { done } });
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
}
