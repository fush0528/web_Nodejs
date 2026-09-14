import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "請填寫名稱")
    .max(50, "名稱最多 50 個字")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email 格式不正確"),
  password: z
    .string()
    .min(8, "密碼至少 8 個字元")
    .max(72, "密碼最多 72 個字元"), // bcrypt 只處理前 72 bytes，超過的部分會被忽略
});

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "請輸入待辦事項內容")
  .max(200, "內容最多 200 個字");

export const taskIdSchema = z.coerce.number().int().positive();

export type RegisterInput = z.infer<typeof registerSchema>;
