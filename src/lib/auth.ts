import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as User | null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_active) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canManageAssets(role: UserRole): boolean {
  return role === "admin" || role === "it";
}

export function canManageEmployees(role: UserRole): boolean {
  return role === "admin" || role === "hr" || role === "it";
}

export function canGenerateForms(role: UserRole): boolean {
  return role === "admin" || role === "it" || role === "hr";
}

export function canReviewVerifications(role: UserRole): boolean {
  return role === "admin" || role === "it";
}
