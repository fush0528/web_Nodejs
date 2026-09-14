import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { toRole } from "@/lib/roles";
import { credentialsSchema } from "@/lib/validations";

export const authOptions: NextAuthOptions = {
  // 註：這裡刻意不使用 PrismaAdapter。
  // Credentials Provider 搭配 JWT session 時 adapter 不會被呼叫，
  // 而 adapter 另外需要 Account / Session / VerificationToken 三張表，
  // 這個專案並未使用 OAuth，因此移除以免留下無效相依。
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        // 帳號不存在時仍執行一次 hash 比對，讓「帳號不存在」與
        // 「密碼錯誤」的回應時間接近，避免以時間差枚舉帳號。
        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: toRole(user.role),
        };
      },
    }),
  ],

  callbacks: {
    // 登入當下 user 有值，把 id 與 role 寫進 token；
    // 之後每次請求 token 會被重新解出，直接沿用。
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = toRole(user.role);
      }

      // session 被主動更新時重新讀一次 DB，
      // 這樣管理員調整權限後不必等 token 過期。
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { role: true, name: true },
        });
        if (fresh) {
          token.role = toRole(fresh.role);
          token.name = fresh.name;
        }
      }

      return token;
    },

    // 把 token 的內容放回 session，前端與 Server Action 才拿得到 user.id。
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = toRole(token.role);
      }
      return session;
    },
  },
};

// 一段固定的 bcrypt hash，只用於上面的等時比對，不對應任何帳號。
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.ThisIsADummyHashForTiming00";
