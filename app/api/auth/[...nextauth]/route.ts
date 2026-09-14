import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// App Router 的 route.ts 只允許 export HTTP 方法，
// 因此 authOptions 定義在 lib/auth.ts，這裡只留 handler。
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
