import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/roles";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 | 404,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type CurrentUser = {
  id: number;
  email: string;
  role: Role;
};

/**
 * 取得目前登入者；未登入則丟出 401。
 * 所有會碰到資料的入口都必須先經過這個函式。
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthError("需要登入", 401);
  }

  return {
    id: Number(session.user.id),
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/**
 * 產生查詢用的擁有者條件。
 *
 * 這是整個授權設計的關鍵：把「誰能碰這筆資料」直接編碼進 WHERE 條件，
 * 而不是先查出資料、再在應用層比對 userId。
 * 好處是查詢與檢查是同一個動作，不會出現先讀後判斷之間的時間差，
 * 也不可能忘記寫那行 if。
 */
export function ownerScope(user: CurrentUser) {
  return user.role === "ADMIN" ? {} : { userId: user.id };
}
