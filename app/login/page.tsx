"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="max-w-sm mx-auto mt-20 p-6 border rounded-lg space-y-4">
      <h1 className="text-2xl font-bold text-center">Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded p-2"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded p-2"
      />

      <button
        onClick={() => signIn("credentials", { email, password, callbackUrl: "/" })}
        className="w-full bg-black text-white p-2 rounded"
      >
        Sign In
      </button>
    </main>
  );
}
