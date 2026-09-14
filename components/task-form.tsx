"use client";

import { useActionState, useEffect, useRef } from "react";

import { createTaskFormAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createTaskFormAction, null);

  // 送出成功後清空輸入框。
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-2">
      <form ref={formRef} action={formAction} className="flex gap-3">
        <input
          name="title"
          placeholder="要做什麼？"
          maxLength={200}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        />
        <Button disabled={pending}>{pending ? "新增中…" : "新增"}</Button>
      </form>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </div>
  );
}
