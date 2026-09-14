import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/roles";

// 擴充 next-auth 內建型別，讓 session.user.id / role 在編譯期就存在。
// 少了這個檔案，Server Action 裡的 session.user.id 會是型別錯誤。
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
