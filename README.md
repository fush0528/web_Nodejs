# 🎨 Step 4 - UI 美化：整合 shadcn/ui 與 Tailwind 強化版 Todo

本階段將在既有的 Next.js + Prisma 專案中，  
加入 **shadcn/ui** 元件庫，讓介面更現代化、可擴充，  
並學習如何客製化顏色、字體與按鈕樣式。

---

## 🧩 本階段重點

| 目標 | 技術 |
|------|------|
| 安裝 `shadcn` CLI | 初始化 UI 元件管理環境 |
| 加入基本元件 | Button / Card / Checkbox |
| 改寫頁面介面 | 讓 Todo 清單更乾淨、具層次感 |
| 自訂樣式 | 加入 hover、粗體、陰影與配色 |

---

## ⚙️ Step 4-1：安裝 shadcn CLI

在專案根目錄執行：

```bash
npx shadcn@latest init
components.json
lib/utils.ts
```
# Step 4-2：加入 UI 元件
執行以下三行命令：
```
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add checkbox
```

產生的檔案結構如下：
```
components/
 ┗ ui/
    ┣ button.tsx
    ┣ card.tsx
    ┗ checkbox.tsx

```



# 🎨 Step 4-3：改寫介面（app/page.tsx）
以下是美化後的 Todo 頁面：


![alt text](image-1.png)

## 🧠 改進重點

| 區塊      | 強化項目                                  |
|:-----------|:-------------------------------------------|
| **標題**   | 字體更大、顏色更深、加粗                 |
| **表單**   | 背景淺灰、陰影、圓角                    |
| **按鈕**   | 黑底白字、`hover` 時轉深灰               |
| **卡片**   | `hover` 浮起效果、柔和邊框               |
| **Checkbox** | 打勾時黑色背景                         |
| **任務文字** | 已完成 → 灰色刪除線；未完成 → 深灰粗體 |
