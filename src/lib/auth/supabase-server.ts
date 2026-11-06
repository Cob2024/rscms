import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/database/prisma";

const SESSION_COOKIE = "rscms_access_token";

/** Validate the HttpOnly access-token cookie with Supabase Auth, using only the public anon key. */
export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const admin = await prisma.adminUser.findUnique({ where: { supabaseId: data.user.id }, select: { id: true } });
  return admin ? data.user : null;
}

export { SESSION_COOKIE };
