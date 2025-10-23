# ✅ Next.js Full Stack Tutorial (Step 3: CI + Prisma Todo)

本階段專案示範如何在 Next.js 專案中：
1. 建立 **GitHub Actions** 自動檢查（CI）
2. 整合 **Prisma + SQLite** 建立全端 Todo 系統

---

## 🚀 專案架構



## 🧰 1. 開發環境需求

---


### 資料夾配置
```bash
nextjs-fullstack-tutorial/
┣ app/
┃ ┣ actions.ts ← Server Actions：新增 / 修改 / 刪除任務
┃ ┣ page.tsx ← 首頁頁面（顯示 + 表單）
┃ ┗ layout.tsx
┣ lib/
┃ ┗ prisma.ts ← Prisma Client 設定
┣ prisma/
┃ ┗ schema.prisma ← Prisma 資料模型
┣ .github/
┃ ┗ workflows/
┃ ┗ ci.yml ← GitHub Actions 自動檢查設定
┣ .env
┣ package.json
┗ README.md
```


---

## ⚙️ 1. 加入 GitHub Actions（CI 自動檢查）

在專案根目錄建立檔案：  
📁 `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  build-and-lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Type check
        run: npm run typecheck --if-present

      - name: Lint
        run: npm run lint --if-present

      - name: Build
        run: npm run build --if-present
```
### 在 package.json 新增：


```
"scripts": {
  "typecheck": "tsc --noEmit"
}
```

這樣每次 push / PR 時，GitHub 會自動：

: 執行 TypeScript 型別檢查

: 檢查 ESLint

: 嘗試 build 專案

# 🗃️ 2. Prisma + SQLite：建立 Todo 功能
## (1) 安裝與初始化
```
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```
## (2) 編輯 prisma/schema.prisma
```

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  done      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## (3) 建立資料庫

```
npx prisma migrate dev --name init_tasks

```
# 🧠 3. Prisma 設定
## 📁 新增 lib/prisma.ts

```
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

```
# 🧩 4. Server Actions 與頁面
## 📄 app/actions.ts



```
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  await prisma.task.create({ data: { title } });
  revalidatePath("/");
}

export async function toggleTask(id: number, done: boolean) {
  await prisma.task.update({ where: { id }, data: { done } });
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  await prisma.task.deleteMany({ where: { id } }); // 不拋錯刪除
  revalidatePath("/");
}

```
## 📄 app/page.tsx

```
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  await prisma.task.create({ data: { title } });
  revalidatePath("/");
}

export async function toggleTask(id: number, done: boolean) {
  await prisma.task.update({ where: { id }, data: { done } });
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  await prisma.task.deleteMany({ where: { id } }); // 不拋錯刪除
  revalidatePath("/");
}

```
## 🧪 5. 啟動開發伺服器
```
npm run dev
```

# 打開 http://localhost:3000

