# Task Manager｜全端待辦管理系統

> **推甄作品重點：** 以真實的帳號、資源擁有權與 API 設計為核心，而非只有前端待辦畫面。

| 展示項目 | 說明 |
|---|---|
| 身分驗證 | 註冊、登入、bcrypt 密碼雜湊、JWT session |
| Task CRUD | 新增、清單、完成切換、編輯與刪除 |
| 存取控制 | USER 只能操作自己的 Task；ADMIN 可檢視與管理全部資料 |
| 資料庫 | Prisma schema、migration、seed 與關聯式資料模型 |
| 服務介面 | Server Actions + REST API，輸入皆經 zod 驗證 |
| 工程化 | Docker Compose、TypeScript、ESLint、node:test |

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

> **注意：** `NEXTAUTH_SECRET` 要填的是**上面指令產生出來的隨機字串**，不是指令本身。
> 填成 `"openssl rand -base64 32"` 這串文字雖然不會報錯（NextAuth 只檢查非空），
> 但等於完全沒有隨機性，JWT 的簽章形同公開。

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

## Demo 操作流程

1. 用 `alice@example.com / password123` 登入，新增、編輯、完成或刪除自己的 Task。
2. 改用 `bob@example.com / password123` 登入，確認看不到 Alice 的資料。
3. 改用 `admin@example.com / password123` 登入，確認管理員可檢視所有使用者資料。
4. 使用 REST API 驗證同一套授權規則；未登入回傳 `401`，非擁有者操作回傳 `404`。

> 以上帳號只供本機 seed 展示使用，正式部署請移除或改用正式帳號。

### 其他常用指令

```bash
npx prisma studio     # 用 GUI 檢視資料庫
npm run typecheck     # TypeScript 型別檢查
npm run lint          # ESLint
npm run build         # 生產環境建置
npm test              # 驗證輸入與角色權限規則
```

## REST API

所有 `/api/tasks` 端點都需要已登入的 session，並重用 `ownerScope()`。因此 API 不會繞過網頁端的權限規則。

| Method | Endpoint | 用途 | 成功回應 |
|---|---|---|---|
| GET | `/api/tasks` | 取得可存取的 Task | 200 |
| POST | `/api/tasks` | 建立 Task | 201 |
| PATCH | `/api/tasks/:id` | 修改 `title` 或 `done` | 200 |
| DELETE | `/api/tasks/:id` | 刪除 Task | 204 |

建立 Task 的範例：

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<你的 session>" \
  -d '{"title":"完成推甄作品集"}'
```

---

## Docker

```bash
docker compose up --build
```

開啟 <http://localhost:3000>，用 `admin@example.com / password123` 登入。

### 容器啟動時做了什麼

`Dockerfile` 的 `CMD` 依序執行三件事：

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/docker-seed.cjs && npm run start"]
```

| 步驟 | 指令 | 作用 |
|---|---|---|
| 1 | `prisma migrate deploy` | 在 volume 的 SQLite 建立資料表 |
| 2 | `node scripts/docker-seed.cjs` | 首次啟動時寫入示範帳號 |
| 3 | `npm run start` | 啟動 Next.js |

第一次啟動的 log 會出現：

```text
All migrations have been successfully applied.
[seed] 資料庫是空的，建立示範帳號…
[seed] 完成：
  admin@example.com / password123  (ADMIN)
```

之後重啟會改印「資料庫已有 N 位使用者，略過初始化」——腳本是冪等的，只在 User 表為空時寫入，所以重啟不會覆蓋容器裡累積的資料。

### 為什麼容器需要另一支 seed 腳本

`prisma/seed.ts` 在容器內跑不起來，有三個原因疊在一起：

- 它是 TypeScript，需要 `tsx` 才能執行，而 `tsx` 在 `devDependencies`，runner 階段用的是 `npm ci --omit=dev`
- 定義 seed 指令的 `prisma.config.ts` 沒有被複製進 runner
- `seed.ts` 裡有 `prisma.task.deleteMany({})`，拿來當啟動指令的話每次重啟都會清空所有待辦事項

`scripts/docker-seed.cjs` 是純 CommonJS，只依賴容器裡本來就有的 `@prisma/client` 與 `bcrypt`，不需要任何額外相依，且先檢查 User 筆數再決定是否寫入。

### 本機與容器是兩個獨立的資料庫

| | 本機 `npm run dev` | Docker |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | `file:/app/data/dev.db` |
| 實體位置 | `prisma/dev.db` | volume `task-data` |

兩邊資料完全不互通。在本機註冊的帳號，容器裡登入不了，反之亦然。

### 重置容器資料

```bash
docker compose down -v    # -v 會一併刪除 volume
docker compose up --build # 重新建表並 seed
```

### 部署前

在 `docker-compose.yml` 或平台的環境變數中更換 `NEXTAUTH_SECRET`，並移除或改寫 `scripts/docker-seed.cjs` 的示範帳號。

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
| 頁面 | `app/page.tsx` 的 `redirect("/login")` | 未登入者導向登入頁 |
| 應用 | `lib/guard.ts` 的 `requireUser()` | 每個入口都確認登入身分 |
| 資料 | `ownerScope()` 併入 WHERE | 確認這筆資料屬於呼叫者 |

第一層只看「有沒有登入」，不看「這筆資料是不是你的」，所以它不能取代後面兩層。
即使有人繞過頁面直接打 API，第二、三層仍會擋下。

> **關於 `middleware.ts`：** 較理想的做法是在 middleware 攔截未登入請求，讓它連頁面都進不去。
> 但 NextAuth v4 慣用的 `export { default } from "next-auth/middleware"` 在 Next.js 16 會報
> `The file "./middleware.ts" must export a function`——Next 16 靜態檢查匯出項目，認不得 re-export。
> 目前 `middleware.ts` 保持 pass-through，導轉由 `app/page.tsx` 的 `redirect()` 負責，
> 跑在 Node runtime，與登入流程使用同一套 `getServerSession`。

## 其他安全處理

- **密碼永不明文儲存**，以 bcrypt（cost 12）雜湊；API 回應一律用 Prisma `select` 過濾掉 `password` 欄位。
- **登入失敗不區分原因**，帳號不存在時仍執行一次 bcrypt 比對，讓回應時間接近，避免以時間差或錯誤訊息枚舉有效帳號。
- **Email 重複交由資料庫的 unique constraint 判斷**（攔截 Prisma `P2002`），而不是先查詢再寫入，避免兩個併發請求同時通過檢查。
- **所有外部輸入經過 zod 驗證**後才進入資料層。

---

## 疑難排解

### Docker 可以啟動，但登入顯示「Email 或密碼不正確」

容器的資料庫是空的。`prisma migrate deploy` 只建立資料表結構，不會寫入任何資料——若 `Dockerfile` 的 `CMD` 沒有串接 seed 步驟，volume 裡的 DB 永遠沒有使用者。

確認容器內的 User 筆數：

```bash
docker compose exec app node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findMany({select:{id:true,email:true,role:true}}).then(u=>{console.log(u);process.exit(0)})"
```

印出 `[]` 就是這個原因。解法見上面的 Docker 章節。

### 本機可以登入，Docker 不行

先排除資料庫問題（上一條）。若容器內確實有使用者，再確認環境變數：

```bash
docker compose exec app printenv DATABASE_URL NEXTAUTH_URL
docker compose exec app sh -c '[ -n "$NEXTAUTH_SECRET" ] && echo "有值" || echo "沒有值"'
```

若 `docker compose exec` 回報 `service "app" is not running`，容器已停止，先 `docker compose up -d` 再 `docker compose ps` 確認。

### 登入後首頁顯示「這個操作沒有完成」，按鈕沒反應

`app/page.tsx` 在沒有 session 時直接呼叫 `requireUser()`，它是**丟出例外**而不是導轉，Next.js 於是渲染 `app/error.tsx`。兩個按鈕（`reset()` 與連到 `/`）都會重新渲染同一個頁面，因此再次觸發例外，看起來像是沒反應。

解法是在 `requireUser()` 之前先導轉：

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect("/login");
```

### 本機 dev 與 Docker 交替測試時行為詭異

兩者都跑在 `http://localhost:3000`，共用同一組 cookie，但 `NEXTAUTH_SECRET` 不同，殘留的 session cookie 解不開。用無痕視窗測試，或先清掉 localhost 的 cookie。

---

## 專案結構

```
app/
├── actions.ts                    Server Actions（含擁有者檢查）
├── error.tsx                     錯誤邊界
├── page.tsx                      待辦清單主頁（未登入時 redirect 到 /login）
├── login/page.tsx
├── register/page.tsx
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── register/route.ts
    └── tasks/
lib/
├── auth.ts                       NextAuth 設定與 jwt/session callback
├── guard.ts                      requireUser() 與 ownerScope()
├── roles.ts                      角色型別
├── validations.ts                zod schema
└── prisma.ts
types/next-auth.d.ts              擴充 session.user 的型別
prisma/
├── schema.prisma
├── migrations/
└── seed.ts                       本機用（需要 tsx）
scripts/
└── docker-seed.cjs               容器啟動時用（純 CJS、冪等）
middleware.ts                     目前為 pass-through，見上方說明
Dockerfile
docker-compose.yml
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

改用 PostgreSQL 後，`docker-compose.yml` 需增加 db service，並把 `DATABASE_URL` 指向它；
`scripts/docker-seed.cjs` 不需修改，Prisma Client 的 API 在兩種資料庫下相同。
