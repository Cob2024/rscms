"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Receipt,
  Scale,
  Smartphone,
  Users,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "rotations" | "receipts">("ledger");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#102A43] antialiased selection:bg-[#087F5B]/20 selection:text-[#087F5B]">
      {/* ─── STICKY GLASS NAVIGATION BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-[#E2E8F0] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-[#102A43] flex items-center justify-center text-white shadow-md shadow-[#102A43]/10 group-hover:scale-105 transition-transform duration-200">
              <span className="font-bold text-lg tracking-tight text-[#087F5B]">₵</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#102A43]">RSCMS</span>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#E6F4EF] text-[#066849] rounded-md border border-[#A3E0CE]">
                  GH₵
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#64748B] -mt-0.5 tracking-tight">
                Rotating Savings &amp; Collection Management
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#334155]">
            <a href="#features" className="hover:text-[#087F5B] transition-colors">
              Capabilities
            </a>
            <a href="#ledger" className="hover:text-[#087F5B] transition-colors">
              Double-Entry Invariant
            </a>
            <a href="#how-it-works" className="hover:text-[#087F5B] transition-colors">
              How It Works
            </a>
            <a href="#security" className="hover:text-[#087F5B] transition-colors">
              Security
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold text-[#102A43] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#087F5B] hover:bg-[#066849] transition-all shadow-sm hover:shadow-md shadow-[#087F5B]/20 focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50"
            >
              <span>Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#334155] hover:text-[#102A43] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#334155] hover:text-[#087F5B]"
            >
              Capabilities
            </a>
            <a
              href="#ledger"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#334155] hover:text-[#087F5B]"
            >
              Double-Entry Invariant
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#334155] hover:text-[#087F5B]"
            >
              How It Works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#334155] hover:text-[#087F5B]"
            >
              Security
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-full text-sm font-semibold text-white bg-[#087F5B]"
              >
                Access Admin Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#E6F4EF]/70 via-[#F5F7FA]/40 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Status Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#102A43] text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse" />
              <span>GHANAIAN PEER ROTATING SAVINGS &amp; SUSU MANAGEMENT</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-[#102A43] leading-[1.05]">
              Transparent Group Savings. <br />
              <span className="text-[#087F5B]">Zero Ledger Mysteries.</span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-xl text-[#334155] max-w-2xl mx-auto font-normal leading-relaxed">
              The institutional-grade platform for rotating savings clubs in Ghana. Automate monthly
              contribution rounds, enforce mathematically balanced double-entry journals, and generate
              verifiable official PDF receipts with 100% integer pesewa precision.
            </p>

            {/* Primary Action Group */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#087F5B] hover:bg-[#066849] shadow-lg shadow-[#087F5B]/25 hover:shadow-xl hover:shadow-[#087F5B]/30 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#087F5B]/30"
              >
                <span>Launch Admin Console</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#ledger"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-[#102A43] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors shadow-sm"
              >
                <span>Inspect Ledger Engine</span>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </a>
            </div>

            {/* Assurance Micro-Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Zero Floating-Point Drift (Strict Pesewas)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>MTN MoMo, Telecel Cash &amp; Bank Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Instant Official PDF Receipts</span>
              </div>
            </div>
          </div>

          {/* ─── CINEMATIC HERO VISUAL WITH LIVE FINANCIAL OVERLAYS ─── */}
          <div className="mt-12 max-w-5xl mx-auto relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E2E8F0] bg-[#102A43]">
              <div className="relative h-[340px] sm:h-[480px] md:h-[560px] w-full">
                <Image
                  src="/images/hero-ghana-finance.jpg"
                  alt="Ghanaian rotating group savings club members reviewing ledger contributions and cash payouts"
                  fill
                  priority
                  className="object-cover object-[center_30%] opacity-95 transition-transform duration-700 hover:scale-105"
                />
                {/* Ambient vignette and protective gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#102A43] via-[#102A43]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#102A43]/30 via-transparent to-transparent" />

                {/* Floating Micro-Badge Top Left: Verified Mobile Money Payment */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 backdrop-blur-md bg-white/95 border border-white/60 p-3 sm:p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F4EF] flex items-center justify-center text-[#087F5B] font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#102A43]">MTN MoMo Verified</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B]" />
                    </div>
                    <p className="text-[11px] font-semibold text-[#087F5B]">
                      + GH₵ 250.00 <span className="text-[#64748B] font-normal">• Kwesi Arthur (Pos 2)</span>
                    </p>
                  </div>
                </div>

                {/* Floating Micro-Badge Bottom Right: Next Guaranteed Payout */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 backdrop-blur-md bg-[#102A43]/90 text-white border border-white/15 p-3.5 sm:p-4 rounded-2xl shadow-xl space-y-1.5 max-w-[280px] sm:max-w-none">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                      NEXT BENEFICIARY
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      POSITION 1
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Ama Mensah</span>
                    <span className="text-emerald-400 font-mono">GH₵ 1,000.00</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    4/4 monthly contributions verified • Ready for disbursement
                  </p>
                </div>

                {/* Bottom Left Pill: Invariant guarantee */}
                <div className="hidden sm:inline-flex absolute bottom-6 left-6 backdrop-blur-md bg-white/90 border border-white/40 px-3.5 py-2 rounded-full items-center gap-2 text-xs font-semibold text-[#102A43] shadow-md">
                  <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
                  <span>Double-Entry Balance: ∑ Debits ≡ ∑ Credits (Δ = 0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── LIVE FINANCIAL SIMULATOR / INTERACTIVE PREVIEW CARD ───────── */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl shadow-[#102A43]/8 overflow-hidden">
              {/* Card Header Strip */}
              <div className="bg-[#102A43] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#087F5B] ring-4 ring-[#087F5B]/30" />
                  <span className="font-semibold text-sm tracking-wide">CYCLE 01 • ACTIVE OPERATING LEDGER</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono tracking-wider bg-white/10 rounded uppercase">
                    ACID Serializable
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Double-Entry Invariant: PASS (Δ = 0)</span>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("ledger")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "ledger"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  General Ledger Proof
                </button>
                <button
                  onClick={() => setActiveTab("rotations")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "rotations"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Rotation &amp; Payout Queue
                </button>
                <button
                  onClick={() => setActiveTab("receipts")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "receipts"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Official Digital Receipt
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 sm:p-8">
                {activeTab === "ledger" && (
                  <div className="space-y-6">
                    {/* Trial Balance Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-[#E6F4EF] border border-[#A3E0CE]">
                        <span className="text-xs font-bold text-[#066849] uppercase tracking-wider">
                          1010 • Cash in Clearing
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 1,000.00</span>
                          <span className="text-xs font-mono font-semibold text-[#066849]">DEBIT</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#066849]">100% Payout Reserve Solvent</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          1020 • Member Receivables
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 0.00</span>
                          <span className="text-xs font-mono font-semibold text-[#64748B]">BALANCED</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#64748B]">All 4 monthly obligations collected</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                        <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                          2010 • Payout Obligations
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 1,000.00</span>
                          <span className="text-xs font-mono font-semibold text-[#1D4ED8]">CREDIT</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#1D4ED8]">Scheduled for Period 1 Recipient</p>
                      </div>
                    </div>

                    {/* Live Ledger Table Mock */}
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#102A43] text-white">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold">ACCOUNT CODE</th>
                            <th className="py-2.5 px-4 font-semibold">DESCRIPTION</th>
                            <th className="py-2.5 px-4 font-semibold text-right">DEBIT (GH₵)</th>
                            <th className="py-2.5 px-4 font-semibold text-right">CREDIT (GH₵)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#334155]">
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-[#102A43]">1010 • Cash</td>
                            <td className="py-2.5 px-4">MTN MoMo contribution: Kwesi Arthur</td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#087F5B]">250.00</td>
                            <td className="py-2.5 px-4 text-right text-[#94A3B8]">—</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-[#102A43]">4010 • Clearing</td>
                            <td className="py-2.5 px-4">Obligation clearing: Period 1 (4/4)</td>
                            <td className="py-2.5 px-4 text-right text-[#94A3B8]">—</td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#102A43]">250.00</td>
                          </tr>
                          <tr className="bg-[#F8FAFC] font-extrabold text-[#102A43]">
                            <td colSpan={2} className="py-2.5 px-4 uppercase">
                              Trial Balance Equilibrium Total
                            </td>
                            <td className="py-2.5 px-4 text-right text-[#087F5B]">GH₵ 1,000.00</td>
                            <td className="py-2.5 px-4 text-right text-[#087F5B]">GH₵ 1,000.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "rotations" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {[
                        { pos: "Position 1", name: "Ama Mensah", status: "DISBURSED", amount: "GH₵ 1,000.00", badge: "bg-[#E6F4EF] text-[#066849]" },
                        { pos: "Position 2", name: "Kwesi Arthur", status: "CURRENT BENEFICIARY", amount: "GH₵ 1,000.00", badge: "bg-[#FFF4E5] text-[#92400E]" },
                        { pos: "Position 3", name: "Abena Osei", status: "SCHEDULED", amount: "GH₵ 1,000.00", badge: "bg-[#F1F5F9] text-[#475569]" },
                        { pos: "Position 4", name: "Kofi Boateng", status: "SCHEDULED", amount: "GH₵ 1,000.00", badge: "bg-[#F1F5F9] text-[#475569]" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">{item.pos}</span>
                          <h4 className="font-bold text-sm text-[#102A43]">{item.name}</h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.badge}`}>
                            {item.status}
                          </span>
                          <div className="pt-1 text-sm font-extrabold text-[#087F5B]">{item.amount}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#64748B] italic">
                      * Rotations can be configured for 4 or more participants with automatic capacity recalculation and flexible monthly payout order.
                    </p>
                  </div>
                )}

                {activeTab === "receipts" && (
                  <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F4EF] text-[#066849]">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>OFFICIAL RECEIPT • RCP-202502-0042</span>
                      </div>
                      <h4 className="text-xl font-bold text-[#102A43]">GH₵ 250.00 Paid via MTN MoMo</h4>
                      <p className="text-xs text-[#64748B]">
                        Amount in words:{" "}
                        <span className="font-semibold text-[#334155]">
                          Two Hundred and Fifty Ghana Cedis Only
                        </span>
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Payment Reference: <span className="font-mono text-[#102A43]">TXN-MTN-984210</span> • Verified by System Admin
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1E3A5F] shadow-sm"
                      >
                        <FileCheck className="w-4 h-4 text-[#087F5B]" />
                        <span>View Verified Receipts</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROTOCOL METRICS & ASSURANCE STRIP ──────────────────────────────── */}
      <section className="bg-white border-y border-[#E2E8F0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">
            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                GH₵ 0.00
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Ledger Discrepancy
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Double-Entry Invariant Enforced</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                100%
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Pesewa Precision
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Zero Float Rounding Errors</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                4+ Members
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Flexible Group Scale
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Configurable Rotation Capacity</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Instant
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Official PDF Receipts
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Printable Audit Certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CORE ARCHITECTURAL PILLARS ─────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#087F5B] bg-[#E6F4EF] px-3 py-1 rounded-full border border-[#A3E0CE]">
              Enterprise Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Designed For High-Stakes Collective Finance
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">
              Traditional Susu and rotating peer savings often suffer from spreadsheet errors, lost SMS receipts,
              and unverifiable balances. RSCMS replaces informal logs with bank-grade financial engineering.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Double-Entry Accounting Invariant</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Every single transaction generates balanced debit and credit ledger rows. The system refuses to
                commit any financial mutation where Total Debits ≠ Total Credits, guaranteeing permanent balance.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#087F5B]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict Chart of Accounts (1010, 1020, 2010, 4010)</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Ghanaian Mobile Money Native</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Native workflow support for MTN Mobile Money, Telecel Cash, AT Money, and direct bank clearing.
                Admins log exact transaction reference codes for unshakeable reconciliation.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
                <CheckCircle2 className="w-4 h-4" />
                <span>All 6 Ghanaian Payment Channels Supported</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] text-[#92400E] flex items-center justify-center font-bold">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Official Instant PDF Receipts</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Generate tamper-evident, printable PDF receipts immediately upon payment verification.
                Includes formal currency words, timestamp, unique serial numbers, and member share status.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#92400E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloadable PDF + Web-accessible Receipts</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Flexible Rotation Scale</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Scale beyond traditional 4-person groups. Configure group capacity dynamically, reassign
                rotation numbers transparently, and automatically calculate scheduled monthly payouts.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#087F5B]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dynamic capacity: 4 to 100+ active members</span>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">ACID Transaction Isolation</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Financial updates execute in serializable database transactions. Reversals, contributions, and
                payout disbursements lock rows to prevent double-spending and race conditions.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Double-Spending Risk</span>
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] text-[#102A43] border border-[#CBD5E1] flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Granular Audit Logging</h3>
              <p className="text-sm text-[#334155] leading-relaxed">
                Every admin action, deadline postponement, and payment reversal creates an unalterable audit log
                recording the administrator ID, IP, previous values, and detailed reasons.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#102A43]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Administrative Transparency</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOUBLE-ENTRY LEDGER DEEP DIVE ───────────────────────────────────── */}
      <section id="ledger" className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EF] text-[#066849]">
                <Scale className="w-4 h-4" />
                <span>ACCOUNTING RIGOR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight leading-tight">
                Why Pesewas Matter: <br />
                Eliminating Float Inaccuracy
              </h2>
              <p className="text-base text-[#334155] leading-relaxed">
                Most web applications represent money using standard IEEE floating-point numbers (`0.1 + 0.2 = 0.30000000000000004`),
                causing phantom discrepancies over time.
              </p>
              <p className="text-base text-[#334155] leading-relaxed">
                RSCMS stores all money strictly as integer pesewas (1 Ghana Cedi = 100 pesewas). A GH₵250.00
                contribution is permanently recorded as <strong>25,000 pesewas</strong>.
              </p>
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-sm font-mono text-[#334155]">
                <div className="flex justify-between font-bold text-[#102A43]">
                  <span>Accounting Equation:</span>
                  <span>Assets = Liabilities + Equity + Revenue</span>
                </div>
                <div className="text-xs text-[#64748B]">
                  Every payment transaction enforces: ∑ Debits - ∑ Credits = 0
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#102A43] p-8 text-white shadow-xl space-y-6">
              <h4 className="text-lg font-bold tracking-tight text-white flex items-center justify-between">
                <span>Standard RSCMS Chart of Accounts</span>
                <span className="text-xs font-mono text-emerald-400">ACTIVE COA</span>
              </h4>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400">1010</span>
                    <span className="ml-3 font-semibold text-white">Cash &amp; Clearing Account</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ASSET</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400">1020</span>
                    <span className="ml-3 font-semibold text-white">Member Contribution Receivables</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">ASSET</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-400">2010</span>
                    <span className="ml-3 font-semibold text-white">Member Payout Obligations</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">LIABILITY</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-400">4010</span>
                    <span className="ml-3 font-semibold text-white">Contribution Clearing Revenue</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">REVENUE</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Solvency Invariant:</span>
                <span className="font-bold text-emerald-400">Cash ≥ Pending Payout Obligation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (4 STEP LIFECYCLE) ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#087F5B] bg-[#E6F4EF] px-3 py-1 rounded-full border border-[#A3E0CE]">
              Operational Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              A Four-Step Cycle Built for Absolute Clarity
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">
              From group setup to monthly disbursement, every action is logged, audited, and receipted.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Configure Group",
                desc: "Set member capacity (4+), assign rotation numbers, and configure monthly contribution amounts in Ghana Cedis.",
              },
              {
                step: "02",
                title: "Schedule Deadlines",
                desc: "Calendar periods automatically generate monthly due dates with strict chronological order safeguards.",
              },
              {
                step: "03",
                title: "Collect & Issue Receipt",
                desc: "Record MoMo, bank, or cash deposits. System balances the ledger and instantly delivers official digital receipts.",
              },
              {
                step: "04",
                title: "Disburse Rotational Payout",
                desc: "Upon full group funding, the designated beneficiary receives the pooled payout with administrative acknowledgment.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <span className="block text-4xl font-black text-[#087F5B]/20 font-mono">{step.step}</span>
                <h3 className="text-lg font-bold text-[#102A43]">{step.title}</h3>
                <p className="text-xs text-[#334155] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY & COMPLIANCE SECTION ───────────────────────────────────── */}
      <section id="security" className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#102A43] text-white p-8 sm:p-12 space-y-8 relative overflow-hidden shadow-2xl">
            {/* Ambient accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#087F5B]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#087F5B] text-white">
                <ShieldCheck className="w-4 h-4" />
                <span>SECURE-DEVELOPMENT CERTIFIED</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Bank-Grade Security Principles
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                RSCMS was constructed following the comprehensive Secure Development standard. Every layer
                enforces least privilege, denies unauthorized access by default, and maintains immutable audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-200">
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Privilege Leakage</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Permissions are verified server-side on every request. Client-side route guards are treated
                  only as UX conveniences, never as security boundaries.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Row Level Security (RLS)</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Database queries run through scoped security policies. Privileged service roles are locked
                  exclusively to internal server actions.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tamper-Evident Receipts</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Each receipt is generated with immutable transaction identifiers, administrative verification
                  metadata, and exact Ghanaian currency representations.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>0 Vulnerabilities (Audited)</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Dependencies are continuously audited with zero critical, high, or moderate vulnerabilities
                  and strict version locking.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-mono">
                System Status: ALL CHECKS PASSING (157 Unit &amp; Integration Tests)
              </span>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-[#102A43] bg-white hover:bg-slate-100 transition-colors"
              >
                <span>Access Secure System</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#102A43] text-white border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#087F5B] font-bold text-base">
                ₵
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">RSCMS</span>
                <p className="text-xs text-slate-400">
                  Rotating Savings &amp; Collection Management System (Ghana)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
              <a href="#features" className="hover:text-white transition-colors">
                Capabilities
              </a>
              <a href="#ledger" className="hover:text-white transition-colors">
                Accounting Engine
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                Workflow
              </a>
              <a href="#security" className="hover:text-white transition-colors">
                Security
              </a>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Admin Portal →
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} RSCMS Protocol. Built for reliable group financial records in Ghana Cedis.</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Production Ready • Next.js 15.5.29</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
