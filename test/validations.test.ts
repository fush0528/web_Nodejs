import assert from "node:assert/strict";
import test from "node:test";

import { toRole } from "../lib/roles";
import { registerSchema, taskPatchSchema, taskTitleSchema } from "../lib/validations";

test("註冊資料會正規化 Email 並拒絕短密碼", () => {
  const valid = registerSchema.parse({ email: " TEST@EXAMPLE.COM ", password: "password123" });
  assert.equal(valid.email, "test@example.com");
  assert.equal(registerSchema.safeParse({ email: "a@b.com", password: "123" }).success, false);
});

test("Task 標題不可為空白，更新至少包含一個欄位", () => {
  assert.equal(taskTitleSchema.safeParse("   ").success, false);
  assert.equal(taskPatchSchema.safeParse({}).success, false);
  assert.deepEqual(taskPatchSchema.parse({ done: true }), { done: true });
});

test("未知角色一律降為最低權限", () => {
  assert.equal(toRole("ADMIN"), "ADMIN");
  assert.equal(toRole("OWNER"), "USER");
});
