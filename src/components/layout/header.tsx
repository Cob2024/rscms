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
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        window.setTimeout(() => {
          void fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: session.access_token }) });
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
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left spacer for mobile menu button */}
      <div className="w-10 md:hidden" />

      {/* Page title area - will be dynamic later */}
      <div className="hidden md:block" />

      {/* Right side - user menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
