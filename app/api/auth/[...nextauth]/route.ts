import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 沒輸入帳密就直接失敗
        if (!credentials?.email || !credentials?.password) return null;

        // 找對應的使用者
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        // 比對密碼（bcrypt）
        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!valid) return null;

        // 回傳給 next-auth 的 user 物件（至少要有 id）
        return {
          id: String(user.id),
          name: user.name ?? null,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
