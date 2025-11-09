# 🧠 Week 5 - Next.js + Prisma + Auth.js 登入系統整合

本週目標：  
在前幾週完成的 Next.js + Prisma 專案上，加入 **使用者登入驗證系統 (NextAuth)**，  
並完成資料庫欄位同步、登入頁面與 Task 關聯設定。

---

## 📦 專案結構

app/
┣ api/
┃ ┣ auth/[...nextauth]/route.ts
┃ ┗ tasks/route.ts
┣ login/page.tsx
┣ lib/prisma.ts
┣ page.tsx
┣ actions.ts
┗ layout.tsx
prisma/
┣ schema.prisma
┗ dev.db
.env
package.json

yaml
複製程式碼

---

## 🚀 Step 1. 安裝登入相關套件

```bash
npm install next-auth @auth/prisma-adapter bcrypt
🧩 Step 2. 更新 Prisma Schema
在 prisma/schema.prisma 中，加入 User 與 Task 的關聯欄位：
```
```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String?
  email     String   @unique
  password  String
  tasks     Task[]
  createdAt DateTime @default(now())
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  done      Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
}
```
🧰 Step 3. 重新建資料庫
當 schema 更新後，一定要重新建立資料表！

```
npx prisma migrate reset --force
npx prisma migrate dev --name init_schema
```
檢查是否成功：
```
npx prisma studio
```
應看到左側有兩個資料表：User、Task

🔑 Step 4. 新增 Auth.js 登入路由
建立 app/api/auth/[...nextauth]/route.ts

```
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 查找使用者
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        // 密碼驗證
        const valid = await bcrypt.compare(credentials.password, user.password);
        return valid ? user : null;
      },
    }),
  ],
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```
🪪 Step 5. 新增登入頁面
在 app/login/page.tsx 建立：

```
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    });
  };

  return (
    <div className="flex flex-col items-center mt-24">
      <h1 className="text-2xl font-bold mb-6">登入系統</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-64">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          登入
        </button>
      </form>
    </div>
  );
}
```
⚙️ Step 6. 執行開發伺服器
```
npm run dev
```
前往：

👉 http://localhost:3000/login
測試登入介面是否正常顯示。