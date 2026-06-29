import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { User, UserRole } from "@/types";

export async function requireApiAuth(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.is_active) {
    return NextResponse.json({ error: "Account inactive" }, { status: 403 });
  }
  return user;
}

export async function requireApiRole(roles: UserRole[]): Promise<User | NextResponse> {
  const result = await requireApiAuth();
  if (result instanceof NextResponse) return result;
  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
