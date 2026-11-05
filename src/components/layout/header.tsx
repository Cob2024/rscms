"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/auth/supabase-browser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  useEffect(() => {
    // Synchronize session cookie immediately on mount
    void supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        void fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: session.access_token }),
        }).catch(() => {});
      }
    });

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (
        (event === "TOKEN_REFRESHED" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION") &&
        session?.access_token
      ) {
        window.setTimeout(() => {
          void fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: session.access_token }),
          }).catch(() => {});
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await supabaseBrowser.auth.signOut();
    } catch (e) {
      console.warn("Supabase client signout error:", e);
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Server logout error:", e);
    }
    router.push("/login");
    router.refresh();
  }

  const initials = user.email
    ? user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6 shadow-xs">
      {/* Left spacer for mobile menu button */}
      <div className="w-10 md:hidden" />

      {/* Page title area */}
      <div className="hidden md:flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#087F5B]" />
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Rotating Savings Management</span>
      </div>

      {/* Right side - user menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-slate-100">
              <Avatar className="h-9 w-9 border border-[#A3E0CE]">
                <AvatarFallback className="bg-[#E6F4EF] text-[#066849] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-[#E2E8F0] shadow-md">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-[#102A43]">Administrator</p>
                <p className="text-xs text-[#64748B]">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E2E8F0]" />
            <DropdownMenuItem className="text-[#102A43] hover:bg-slate-50 cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4 text-[#64748B]" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E2E8F0]" />
            <DropdownMenuItem onClick={handleLogout} className="text-[#B42318] hover:bg-[#FEECEB] cursor-pointer font-medium">
              <LogOut className="mr-2 h-4 w-4 text-[#B42318]" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
