import { prisma } from "@/lib/prisma";
import { ownerScope, requireUser } from "@/lib/guard";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");


  const user = await requireUser();

  // 關鍵修正：原本是 prisma.task.findMany()，沒有任何條件，
  // 所以每個登入者看到的都是全體使用者的資料。
  // 現在查詢條件由 ownerScope() 產生，一般使用者只會拿到自己的。
  const tasks = await prisma.task.findMany({
    where: ownerScope(user),
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { email: true } } },
  });

  const showOwner = user.role === "ADMIN";

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">我的待辦清單</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {user.email}
            {user.role === "ADMIN" && "（管理員檢視，顯示所有使用者的資料）"}
          </p>
        </div>
        <SignOutButton />
      </header>

      <TaskForm />

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          還沒有待辦事項，在上面新增第一筆。
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <Card className="border border-neutral-200">
                <CardContent className="p-0">
                  <TaskItem task={task} showOwner={showOwner} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
