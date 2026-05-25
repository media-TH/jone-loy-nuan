import "server-only";

import { createClient } from "@/utils/supabase/server";

export type AppRole = "user" | "admin" | "system";

function getRoleFromUser(user: { app_metadata?: Record<string, unknown> | null; user_metadata?: Record<string, unknown> | null }): AppRole {
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  const candidate = (typeof appRole === "string" ? appRole : typeof userRole === "string" ? userRole : "user").toLowerCase();

  if (candidate === "admin") return "admin";
  if (candidate === "system") return "system";
  return "user";
}

export async function requireRole(allowed: AppRole[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) throw new Error("Unauthorized");

  const role = getRoleFromUser(data.user);
  if (!allowed.includes(role)) throw new Error("Forbidden");

  return { user: data.user, role };
}

export async function requireAdminOrSystem() {
  return requireRole(["admin", "system"]);
}
