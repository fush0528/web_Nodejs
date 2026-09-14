# Task Manager

一個以 Next.js App Router 實作的待辦清單，重點放在**身分驗證與資源層級的存取控制**：
註冊、登入、角色權限，以及「使用者只能存取屬於自己的資料」這件事在程式碼中如何被強制執行。

| | |
|---|---|
| 前端 | Next.js 16（App Router）、React 19、Tailwind CSS 4、shadcn/ui |
| 後端 | Next.js Server Actions、Route Handlers |
| 資料層 | Prisma 6 + SQLite（開發）/ PostgreSQL（部署） |
| 驗證 | NextAuth v4，Credentials Provider + JWT session |
| 輸入驗證 | zod |
| 密碼 | bcrypt，cost factor 12 |

---

## 從零開始執行

### 0. 需求

- Node.js 20 以上（`node -v` 確認）
- npm 10 以上

### 1. 取得程式碼

```bash
git clone https://github.com/fush0528/web_Nodejs.git
cd web_Nodejs
```

### 2. 安裝套件

```bash
npm install
```

如果是從舊版本升級，這一步需要補裝兩個新相依套件：

```bash
npm install zod
npm install -D tsx
```

### 3. 設定環境變數

```bash
cp .env.example .env
```

接著產生 `NEXTAUTH_SECRET` 並填進 `.env`：

```bash
openssl rand -base64 32
```

Windows PowerShell 沒有 `openssl` 的話用這個：

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

`.env` 最後應該長這樣：

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="剛才產生的字串"
NEXTAUTH_URL="http://localhost:3000"
```

> `NEXTAUTH_SECRET` 沒填的話，登入會一直失敗且不會給明確錯誤訊息。

### 4. 建立資料庫

因為 `Task.userId` 從選填改為必填，舊的資料表結構不相容，需要重建：

```bash
npx prisma migrate reset --force
npx prisma migrate dev --name add_user_role_and_required_task_owner
npx prisma generate
```

### 5. 塞入測試資料

```bash
npx tsx prisma/seed.ts
```

會建立三個帳號（密碼都是 `password123`）：

| Email | 角色 | 用途 |
|---|---|---|
| `admin@example.com` | ADMIN | 可看到所有使用者的資料 |
| `alice@example.com` | USER | 一般使用者 |
| `bob@example.com` | USER | 用來驗證兩人資料互不可見 |

### 6. 啟動

```bash
npm run dev
```

開啟 <http://localhost:3000>，未登入會自動導向 `/login`。

### 其他常用指令

```bash
npx prisma studio     # 用 GUI 檢視資料庫
npm run typecheck     # TypeScript 型別檢查
npm run lint          # ESLint
npm run build         # 生產環境建置
```

---

## 存取控制的設計

這個專案最初的版本有一個越權存取漏洞（IDOR）：`createTask` 沒有寫入 `userId`，
頁面直接以 `prisma.task.findMany()` 撈出全部資料，`deleteTask(id)` 也只憑 id 就執行刪除。
結果是登入形同裝飾，任何使用者都看得到也刪得掉其他人的資料。

修正的做法不是在每個函式前面補一行 `if`，而是把「誰能碰這筆資料」編碼進查詢條件本身：

```ts
// lib/guard.ts
export function ownerScope(user: CurrentUser) {
  return user.role === "ADMIN" ? {} : { userId: user.id };
}
```

```ts
// app/actions.ts
const { count } = await prisma.task.deleteMany({
  where: { id: taskId, ...ownerScope(user) },
});
if (count === 0) throw new AuthError("找不到資料，或你沒有權限刪除", 404);
```

這樣設計的三個理由：

1. **查詢與檢查是同一個動作。** 不會出現「先讀出來、再比對 userId」中間的時間差，也不可能漏寫檢查。
2. **權限規則集中在一處。** 要加新角色時只改 `ownerScope()`，不必翻遍所有 action。
3. **回傳 404 而非 403。** 403 等於告訴對方「這筆資料存在，只是不給你」，可以被用來探測 id。統一回 404 不洩漏資料是否存在。

防線分為三層：

| 層級 | 位置 | 負責的事 |
|---|---|---|
| 路由 | `middleware.ts` | 未登入者拿不到頁面 |
| 應用 | `lib/guard.ts` 的 `requireUser()` | 每個入口都確認登入身分 |
| 資料 | `ownerScope()` 併入 WHERE | 確認這筆資料屬於呼叫者 |

middleware 只看「有沒有登入」，不看「這筆資料是不是你的」，所以它不能取代後面兩層。

## 其他安全處理

- **密碼永不明文儲存**，以 bcrypt（cost 12）雜湊；API 回應一律用 Prisma `select` 過濾掉 `password` 欄位。
- **登入失敗不區分原因**，帳號不存在時仍執行一次 bcrypt 比對，讓回應時間接近，避免以時間差或錯誤訊息枚舉有效帳號。
- **Email 重複交由資料庫的 unique constraint 判斷**（攔截 Prisma `P2002`），而不是先查詢再寫入，避免兩個併發請求同時通過檢查。
- **所有外部輸入經過 zod 驗證**後才進入資料層。

---

## 專案結構

```
app/
├── actions.ts                    Server Actions（含擁有者檢查）
├── error.tsx                     錯誤邊界
├── page.tsx                      待辦清單主頁
├── login/page.tsx
├── register/page.tsx
└── api/
    ├── auth/[...nextauth]/route.ts
    └── register/route.ts
lib/
├── auth.ts                       NextAuth 設定與 jwt/session callback
├── guard.ts                      requireUser() 與 ownerScope()
├── roles.ts                      角色型別
├── validations.ts                zod schema
└── prisma.ts
types/next-auth.d.ts              擴充 session.user 的型別
prisma/
├── schema.prisma
└── seed.ts
middleware.ts
```

## 資料模型

```
User 1 ──── n Task

User: id, name, email(unique), password, role, createdAt
Task: id, title, done, createdAt, updatedAt, userId(FK, 必填)
```

刪除 User 時其 Task 會一併刪除（`onDelete: Cascade`）。

---

## 部署到 PostgreSQL

SQLite 不支援 enum，因此 `role` 目前以 `String` 儲存。改用 PostgreSQL 時可換成真正的 enum：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  role Role @default(USER)
  // ...
}
```

`lib/roles.ts` 的 `Role` 型別與 `toRole()` 不需更動。
