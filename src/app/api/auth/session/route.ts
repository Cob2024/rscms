import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/database/prisma";
import { SESSION_COOKIE } from "@/lib/auth/supabase-server";

export async function POST(request: NextRequest) {
  const token = (await request.json().catch(() => null))?.accessToken;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof token !== "string" || !url || !anonKey) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const supabase = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const admin = await prisma.adminUser.findUnique({ where: { supabaseId: data.user.id }, select: { id: true } });
  if (!admin) return NextResponse.json({ error: "Administrator access is not configured." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    maxAge: 3600,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
