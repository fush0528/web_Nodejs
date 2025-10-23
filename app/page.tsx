
"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma";
import { createTask, toggleTask, deleteTask } from "./actions";

interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>

      <form action={createTask} className="flex gap-2">
        <input
          name="title"
          placeholder="Add a task..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between border rounded px-3 py-2"
          >
            <form
              action={toggleTask.bind(null, task.id, !task.done)}
              className="flex items-center gap-2"
            >
              {/* 避免空 onChange 觸發 ESLint，可直接移除 onChange */}
              <input type="checkbox" defaultChecked={task.done} />
              <span className={task.done ? "line-through text-gray-500" : ""}>
                {task.title}
              </span>
              <button className="text-sm underline" type="submit">
                Toggle
              </button>
            </form>

            <form
              action={deleteTask.bind(null, task.id)}
            >
              <button className="text-sm text-red-600 underline" type="submit">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
