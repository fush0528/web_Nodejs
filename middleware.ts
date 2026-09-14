export { default } from "next-auth/middleware";

// 第一道防線：未登入者連頁面都拿不到，會被導向 /login。
// 這不能取代 Server Action 裡的 requireUser()：
// middleware 只看「有沒有登入」，不看「這筆資料是不是你的」。
export const config = {
  matcher: [
    "/",
    // W2 加入 REST API 後一併納入保護：
    // "/api/tasks/:path*",
  ],
};
