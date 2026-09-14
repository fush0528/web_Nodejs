"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "註冊失敗，請稍後再試");
        return;
      }

      // 註冊成功後直接登入，省去再輸入一次帳密。
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("帳號已建立，請手動登入");
        router.push("/login");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4 rounded-lg border p-6">
      <h1 className="text-2xl font-bold">建立帳號</h1>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="名稱（可留空）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border p-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />
        <input
          type="password"
          placeholder="密碼（至少 8 個字元）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full rounded border p-2"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={pending} className="w-full">
        {pending ? "建立中…" : "建立帳號"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        已經有帳號了？{" "}
        <Link href="/login" className="underline">
          登入
        </Link>
      </p>
    </main>
  );
}
