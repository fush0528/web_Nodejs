export const ROLES = ["USER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** 讀到非預期的值時退回權限最低的角色，避免誤放行。 */
export function toRole(value: unknown): Role {
  return isRole(value) ? value : "USER";
}
