"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  ArrowUpDown,
  FileText,
  ClipboardList,
  Settings,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Contributions", href: "/contributions", icon: Wallet },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Payouts", href: "/payouts", icon: ArrowUpDown },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Audit Logs", href: "/audit-logs", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden bg-[#102A43] text-white hover:bg-[#1B3A5A] hover:text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#102A43]/70 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1B3A5A] bg-[#102A43] text-white transition-transform md:static md:translate-x-0 shadow-lg md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-[#1B3A5A] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#087F5B] text-white shadow-xs">
            <span className="text-base font-bold tracking-tight">R</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">RSCMS</h2>
            <p className="text-[11px] leading-tight text-slate-300 font-medium">
              Savings Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/40",
                  isActive
                    ? "bg-[#087F5B] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1B3A5A] p-4 bg-[#0D2237]">
          <p className="text-xs font-semibold text-slate-300">
            RSCMS Enterprise
          </p>
          <p className="text-[11px] text-slate-400">
            Ghana Cedis (GHS) · v0.1.0
          </p>
        </div>
      </aside>
    </>
  );
}
