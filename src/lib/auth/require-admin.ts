import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { SESSION_COOKIE } from "@/lib/auth/supabase-server";

export interface AuthenticatedAdmin {
  id: string;
  supabaseId: string;
  email: string;
  fullName: string | null;
  role: "admin";
}

/**
 * Resolve and verify an administrator on every API request.
 * Checks both the Authorization header (Bearer token) and the HttpOnly session cookie.
 * Validates the token with Supabase and guarantees an active admin_users record exists.
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedAdmin | null> {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.cookies.get(SESSION_COOKIE)?.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  try {
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { supabaseId: data.user.id },
      select: { id: true, supabaseId: true, email: true, fullName: true },
    });

    if (!admin) return null;

    return {
      id: admin.id,
      supabaseId: admin.supabaseId,
      email: admin.email,
      fullName: admin.fullName,
      role: "admin",
    };
  } catch (err) {
    console.error("Authentication error in requireAdmin:", err);
    return null;
  }
}
