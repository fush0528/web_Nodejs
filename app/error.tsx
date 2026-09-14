"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4 rounded-lg border p-6 text-center">
      <h1 className="text-xl font-bold">這個操作沒有完成</h1>
      <p className="text-sm text-neutral-600">
        資料可能已被刪除，或你沒有權限修改它。
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>再試一次</Button>
        <Button variant="outline" asChild>
          <Link href="/">回到清單</Link>
        </Button>
      </div>
    </main>
  );
}
