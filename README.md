# 快取設定說明

在 `app/page.tsx` 的檔案最上方加入了以下設定：

```typescript
export const dynamic = 'force-dynamic';
```

或者可以使用：

```typescript
export const revalidate = 0;
```

## 目的

這項設定的作用是告訴 Next.js 每次請求都要重新產生頁面內容，不使用舊的快取資料。這在需要即時資料的場景非常有用，例如：

- 動態資料展示
- 即時更新的儀表板
- 需要最新狀態的表單

## 注意事項

請注意使用這項設定會增加伺服器負載，因為每個請求都會觸發頁面重新產生。在不需要即時資料的情況下，建議保留 Next.js 的預設快取機制。