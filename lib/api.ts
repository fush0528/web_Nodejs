import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/guard";

/** 將授權邏輯轉為 API 一致的 JSON 錯誤格式。 */
export async function requireApiUser() {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
