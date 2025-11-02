export const dynamic = 'force-dynamic'; // 或改用：export const revalidate = 0


import type { Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTask, toggleTask, deleteTask } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default async function Home() {
  const tasks: Task[] = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-extrabold text-neutral-800 mb-4">
        🌿 My Task List
      </h1>

      <form
        action={createTask}
        className="flex gap-3 bg-neutral-50 p-4 rounded-lg shadow-sm"
      >
        <input
          name="title"
          placeholder="Add a new task..."
          className="flex-1 border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        />
        <Button className="bg-neutral-900 hover:bg-neutral-700 text-white font-semibold">
          Add
        </Button>
      </form>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className="hover:shadow-md transition-all border border-neutral-200"
          >
            <CardContent className="flex items-center justify-between p-4">
              <form
                action={async () => {
                  "use server";
                  await toggleTask(task.id, !task.done);
                }}
                className="flex items-center gap-3"
              >
                <Checkbox
                  defaultChecked={task.done}
                  className="border-neutral-400 data-[state=checked]:bg-neutral-800"
                />
                <span
                  className={`text-lg font-medium ${
                    task.done
                      ? "line-through text-neutral-400"
                      : "text-neutral-800"
                  }`}
                >
                  {task.title}
                </span>
              </form>

              <form
                action={async () => {
                  "use server";
                  await deleteTask(task.id);
                }}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-semibold hover:bg-red-600"
                >
                  Delete
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
