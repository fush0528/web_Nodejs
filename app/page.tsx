import { prisma } from "@/lib/prisma";
import { ownerScope, requireUser } from "@/lib/guard";
import { toggleTask, deleteTask } from "./actions";
import { TaskForm } from "@/components/task-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
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
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  {/*
                    原本這裡用 Radix 的 Checkbox 包在 form 裡，
                    但 Radix 會把 root 渲染成 type="button"，不會觸發送出，
                    所以勾選其實沒有任何作用。改為真正的 submit 按鈕。
                  */}
                  <form
                    action={async () => {
                      "use server";
                      await toggleTask(task.id, !task.done);
                    }}
                    className="min-w-0 flex-1"
                  >
                    <button
                      type="submit"
                      aria-pressed={task.done}
                      className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
                    >
                      <span
                        aria-hidden
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          task.done
                            ? "border-neutral-800 bg-neutral-800 text-white"
                            : "border-neutral-400"
                        }`}
                      >
                        {task.done && "✓"}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate ${
                            task.done
                              ? "text-neutral-400 line-through"
                              : "text-neutral-800"
                          }`}
                        >
                          {task.title}
                        </span>
                        {showOwner && (
                          <span className="block text-xs text-neutral-500">
                            {task.user.email}
                          </span>
                        )}
                      </span>
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await deleteTask(task.id);
                    }}
                  >
                    <Button variant="destructive" size="sm">
                      刪除
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
