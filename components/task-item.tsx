"use client";

import { useState, useTransition } from "react";

import { deleteTask, toggleTask, updateTask } from "@/app/actions";
import { Button } from "@/components/ui/button";

type TaskItemProps = {
  task: { id: number; title: string; done: boolean; user: { email: string } };
  showOwner: boolean;
};

export function TaskItem({ task, showOwner }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateTask(task.id, title);
      if (!result.ok) return setError(result.error);
      setError(null);
      setEditing(false);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
            />
            <Button size="sm" disabled={pending}>儲存</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              取消
            </Button>
          </form>
        ) : (
          <button
            type="button"
            aria-pressed={task.done}
            onClick={() => startTransition(async () => {
              await toggleTask(task.id, !task.done);
            })}
            disabled={pending}
            className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                task.done ? "border-neutral-800 bg-neutral-800 text-white" : "border-neutral-400"
              }`}
            >
              {task.done && "✓"}
            </span>
            <span className="min-w-0">
              <span className={`block truncate ${task.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                {task.title}
              </span>
              {showOwner && <span className="block text-xs text-neutral-500">{task.user.email}</span>}
            </span>
          </button>
        )}
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      {!editing && (
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>編輯</Button>
          <Button variant="destructive" size="sm" onClick={() => startTransition(async () => {
            await deleteTask(task.id);
          })} disabled={pending}>
            刪除
          </Button>
        </div>
      )}
    </div>
  );
}
