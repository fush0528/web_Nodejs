# 🌐 Next.js Full Stack Tutorial

這是從零開始建立的 Next.js 全端開發教學專案。  
包含環境設定、專案初始化、GitHub 推送與基本運行說明。  

---

## 🧰 1. 開發環境需求

請先安裝以下工具：

| 工具 | 建議版本 | 說明 |
|------|-----------|------|
| [Node.js](https://nodejs.org) | ≥ 18 (LTS) | JavaScript 執行環境 |
| [npm](https://www.npmjs.com/) | ≥ 9 | Node 套件管理工具 |
| [Git](https://git-scm.com/downloads) | 最新 | 版本控制工具 |
| [VS Code](https://code.visualstudio.com/) | 最新 | 推薦的開發編輯器 |
| [Git Bash](https://gitforwindows.org/) | 最新 | 推薦的終端機（Windows 用） |

---

## 🚀 2. 建立專案步驟

### (1) 建立資料夾並初始化專案

```bash
# 建立主資料夾
mkdir nextjs-fullstack-tutorial
cd nextjs-fullstack-tutorial

## 使用 create-next-app 建立專案
npx create-next-app@latest app

✔ TypeScript: Yes
✔ ESLint: Yes
✔ Tailwind CSS: Yes
✔ src/ directory: No
✔ App Router: Yes
✔ Import alias (@/*): Yes
```
### (2) 啟動開發伺服器
cd app
npm run dev
```
cd app
npm run dev
```
打開瀏覽器進入 http://localhost:3000
，
應該能看到 Welcome to Next.js!

## 📄 3. 建立 README.md

```
echo "# Next.js Full Stack Tutorial
這是教學用專案，將示範 Next.js + Tailwind + Prisma + Auth 全端整合開發。
" > README.md

```
## 4. 初始化 Git 與推送到 GitHub
### (1) 初始化 Git
```
git init
git add .
git commit -m "chore: init Next.js project"

```

## (2) 連接 GitHub 遠端儲存庫

### 在 GitHub 新建一個空的 repository（例如：nextjs-fullstack-tutorial）
不要勾選 README。

然後在本地執行：
```
git branch -M main
git remote add origin https://github.com/<你的帳號>/nextjs-fullstack-tutorial.git
git push -u origin main

```




