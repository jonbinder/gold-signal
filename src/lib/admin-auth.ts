import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "gs_admin_session";

function secretValue(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function sessionValue(secret: string): string {
  return createHash("sha256").update(`goldsignal-admin:${secret}`).digest("hex");
}

export function isAdminEnabled(): boolean {
  return secretValue().length > 0;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = secretValue();
  if (!secret) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === sessionValue(secret);
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  const secret = secretValue();
  if (!secret || password !== secret) return false;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
