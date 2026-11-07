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
  Smartphone,
  Users,
  ChevronDown,
  Menu,
  X,
  Calendar,
  CreditCard,
  FileText,
  UserCheck,
  Building2,
  Clock,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "contributions" | "rotations" | "receipts">("summary");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is RSCMS?",
      answer:
        "RSCMS (Rotating Savings & Collection Management System) is an institutional-grade digital management platform designed specifically for rotating savings clubs and Susu groups in Ghana. It replaces informal paper ledgers and unstructured chat logs with a structured platform for tracking member contributions, scheduling rotational payouts, and issuing verified digital receipts.",
    },
    {
      question: "How does rotating savings work on the platform?",
      answer:
        "In a rotating savings group, every member commits to contributing a predetermined amount (e.g., GH₵ 250.00) in each cycle period. Each period, the total pooled contributions (e.g., GH₵ 1,000.00 for a 4-person group) are disbursed to one designated beneficiary member according to the group's established rotation order, until every member has taken their turn.",
    },
    {
      question: "Can administrators customize contribution deadlines?",
      answer:
        "Yes. While default period dates are established when a cycle is initiated, group administrators have full flexibility to configure custom contribution deadlines for any period to accommodate member paydays, holidays, or agreed-upon schedule extensions.",
    },
    {
      question: "What happens when a member misses a contribution?",
      answer:
        "RSCMS clearly tracks pending, partial, and overdue obligations on the administrator dashboard. Administrators can record partial payments when made, monitor outstanding balances in real time, and—if necessary—exercise administrative options such as postponing a payout or carrying forward an obligation until the member's account is resolved.",
    },
    {
      question: "How are beneficiary payouts managed?",
      answer:
        "Payouts strictly follow the group's configured beneficiary rotation. Once contributions for the period are collected and verified, the administrator authorizes the payout disbursement, records the disbursement details (including payment channel and reference), and records the recipient's formal acknowledgment.",
    },
    {
      question: "Can members view their contribution history?",
      answer:
        "Yes. Every verified payment generates an official, tamper-evident digital receipt featuring a unique serial number, full contribution breakdown, payment channel, and administrative verification details that members can view online or download as a PDF.",
    },
    {
      question: "When can another savings cycle begin?",
      answer:
        "To maintain absolute financial integrity, a new savings cycle begins only after the previous cycle has completed its full rotation and been administratively closed and reconciled. This ensures no unresolved obligations carry over without formal review.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#102A43] antialiased selection:bg-[#087F5B]/20 selection:text-[#087F5B]">
      {/* ─── STICKY GLASS NAVIGATION BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[#E2E8F0] transition-all">
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
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#334155]">
            <a href="#features" className="hover:text-[#087F5B] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#087F5B] transition-colors">
              How It Works
            </a>
            <a href="#transparency" className="hover:text-[#087F5B] transition-colors">
              Transparency
            </a>
            <a href="#security" className="hover:text-[#087F5B] transition-colors">
              Security
            </a>
            <a href="#faq" className="hover:text-[#087F5B] transition-colors">
              FAQ
            </a>
            <a href="#contact" className="hover:text-[#087F5B] transition-colors">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold text-[#102A43] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30"
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
            className="lg:hidden p-2 text-[#334155] hover:text-[#102A43] focus:outline-none rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-6 pt-3 pb-6 space-y-3 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              How It Works
            </a>
            <a
              href="#transparency"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              Transparency
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              Security
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#334155] hover:text-[#087F5B]"
            >
              Contact
            </a>
            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-full text-sm font-semibold text-white bg-[#087F5B] hover:bg-[#066849]"
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#E6F4EF]/60 via-[#F5F7FA]/40 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Status Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#102A43] text-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse" />
              <span>COMMUNITY SAVINGS &amp; SUSU MANAGEMENT</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-[#102A43] leading-[1.08]">
              Group Savings, <br />
              <span className="text-[#087F5B]">Made Simple.</span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-xl text-[#334155] max-w-2xl mx-auto font-normal leading-relaxed">
              Manage group contributions, track payments and organize rotational payouts with a transparent
              savings management platform built for modern savings groups.
            </p>

            {/* Primary Action Group */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#087F5B] hover:bg-[#066849] shadow-lg shadow-[#087F5B]/25 hover:shadow-xl hover:shadow-[#087F5B]/30 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#087F5B]/30"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-[#102A43] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors shadow-sm"
              >
                <span>Explore Features</span>
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              </a>
            </div>

            {/* Verified Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Organized Contributions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Transparent Payment Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Structured Payout Management</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                <span>Downloadable Financial Records</span>
              </div>
            </div>
          </div>

          {/* ─── CINEMATIC HERO VISUAL WITH AUTHENTIC GHANAIAN GROUP ─── */}
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#102A43]/25 via-transparent to-transparent" />

                {/* Floating Micro-Badge Top Left: Payment Verified */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 backdrop-blur-md bg-white/95 border border-white/60 p-3 sm:p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F4EF] flex items-center justify-center text-[#087F5B] font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#102A43]">Payment Recorded</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B]" />
                    </div>
                    <p className="text-[11px] font-semibold text-[#087F5B]">
                      + GH₵ 250.00 <span className="text-[#64748B] font-normal">• Kwesi Arthur (Position 2)</span>
                    </p>
                  </div>
                </div>

                {/* Floating Micro-Badge Bottom Right: Next Scheduled Payout */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 backdrop-blur-md bg-[#102A43]/90 text-white border border-white/15 p-3.5 sm:p-4 rounded-2xl shadow-xl space-y-1.5 max-w-[280px] sm:max-w-none">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
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
                    4/4 member contributions received • Ready for disbursement
                  </p>
                </div>

                {/* Bottom Left Pill: Accurate Record Protection */}
                <div className="hidden sm:inline-flex absolute bottom-6 left-6 backdrop-blur-md bg-white/90 border border-white/40 px-3.5 py-2 rounded-full items-center gap-2 text-xs font-semibold text-[#102A43] shadow-md">
                  <ShieldCheck className="w-4 h-4 text-[#087F5B]" />
                  <span>Verified Financial Records • Accurate Pesewa Accounting</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── REALISTIC PRODUCT PREVIEW CARD ────────────────────────────── */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-xl overflow-hidden">
              {/* Card Header Strip */}
              <div className="bg-[#102A43] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#087F5B] ring-4 ring-[#087F5B]/30" />
                  <span className="font-semibold text-sm tracking-wide">SAVINGS CYCLE OVERVIEW • ACTIVE ROTATION</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium tracking-wider bg-white/10 rounded uppercase">
                    Cycle 1
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cycle Status: Fully Reconciled &amp; On Track</span>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "summary"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Financial Summary
                </button>
                <button
                  onClick={() => setActiveTab("contributions")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "contributions"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Member Contributions
                </button>
                <button
                  onClick={() => setActiveTab("rotations")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "rotations"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Rotation Schedule
                </button>
                <button
                  onClick={() => setActiveTab("receipts")}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                    activeTab === "receipts"
                      ? "bg-white text-[#102A43] border-t-2 border-x border-[#E2E8F0] border-t-[#087F5B] -mb-px"
                      : "text-[#64748B] hover:text-[#102A43]"
                  }`}
                >
                  Digital Receipt
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 sm:p-8">
                {activeTab === "summary" && (
                  <div className="space-y-6">
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-[#E6F4EF] border border-[#A3E0CE]">
                        <span className="text-xs font-bold text-[#066849] uppercase tracking-wider">
                          Collected This Period
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 1,000.00</span>
                          <span className="text-xs font-semibold text-[#066849]">100% RECEIVED</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#066849]">4 of 4 members contributed</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          Outstanding Balances
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 0.00</span>
                          <span className="text-xs font-semibold text-[#64748B]">RESOLVED</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#64748B]">Zero overdue payments</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                        <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                          Scheduled Period Payout
                        </span>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-2xl font-extrabold text-[#102A43]">GH₵ 1,000.00</span>
                          <span className="text-xs font-semibold text-[#1D4ED8]">READY</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#1D4ED8]">Disbursable to Beneficiary 1</p>
                      </div>
                    </div>

                    {/* Progress Breakdown */}
                    <div className="rounded-2xl border border-[#E2E8F0] p-4 bg-[#F8FAFC] space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                        <span>Cycle 1 Overall Progress (Period 1 of 4)</span>
                        <span className="text-[#087F5B]">25% Completed</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#087F5B] h-2.5 rounded-full" style={{ width: "25%" }} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>Each member contributes GH₵ 250.00 per month</span>
                        <span>Total pooled pool: GH₵ 4,000.00 across 4 rounds</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "contributions" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#102A43] text-white">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold">MEMBER</th>
                            <th className="py-2.5 px-4 font-semibold">ROTATION ORDER</th>
                            <th className="py-2.5 px-4 font-semibold">PAYMENT METHOD</th>
                            <th className="py-2.5 px-4 font-semibold">STATUS</th>
                            <th className="py-2.5 px-4 font-semibold text-right">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#334155]">
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#102A43]">Ama Mensah</td>
                            <td className="py-3 px-4 text-[#64748B]">Position 1</td>
                            <td className="py-3 px-4">MTN Mobile Money</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EF] text-[#066849]">
                                VERIFIED
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#087F5B]">GH₵ 250.00</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#102A43]">Kwesi Arthur</td>
                            <td className="py-3 px-4 text-[#64748B]">Position 2</td>
                            <td className="py-3 px-4">Telecel Cash</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EF] text-[#066849]">
                                VERIFIED
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#087F5B]">GH₵ 250.00</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#102A43]">Abena Osei</td>
                            <td className="py-3 px-4 text-[#64748B]">Position 3</td>
                            <td className="py-3 px-4">Bank Transfer</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EF] text-[#066849]">
                                VERIFIED
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#087F5B]">GH₵ 250.00</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-[#102A43]">Kofi Boateng</td>
                            <td className="py-3 px-4 text-[#64748B]">Position 4</td>
                            <td className="py-3 px-4">Cash Deposit</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EF] text-[#066849]">
                                VERIFIED
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#087F5B]">GH₵ 250.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      * Administrators record payments made through supported channels (Cash, Mobile Money, Bank Transfer) with transaction reference numbers.
                    </p>
                  </div>
                )}

                {activeTab === "rotations" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          pos: "Turn 1 • Month 1",
                          name: "Ama Mensah",
                          status: "READY FOR PAYOUT",
                          amount: "GH₵ 1,000.00",
                          badge: "bg-[#E6F4EF] text-[#066849]",
                          detail: "All 4 contributions recorded",
                        },
                        {
                          pos: "Turn 2 • Month 2",
                          name: "Kwesi Arthur",
                          status: "NEXT IN LINE",
                          amount: "GH₵ 1,000.00",
                          badge: "bg-[#FFF4E5] text-[#92400E]",
                          detail: "Scheduled for Month 2",
                        },
                        {
                          pos: "Turn 3 • Month 3",
                          name: "Abena Osei",
                          status: "SCHEDULED",
                          amount: "GH₵ 1,000.00",
                          badge: "bg-[#F1F5F9] text-[#475569]",
                          detail: "Scheduled for Month 3",
                        },
                        {
                          pos: "Turn 4 • Month 4",
                          name: "Kofi Boateng",
                          status: "SCHEDULED",
                          amount: "GH₵ 1,000.00",
                          badge: "bg-[#F1F5F9] text-[#475569]",
                          detail: "Scheduled for Month 4",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                            {item.pos}
                          </span>
                          <h4 className="font-bold text-sm text-[#102A43]">{item.name}</h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.badge}`}>
                            {item.status}
                          </span>
                          <div className="pt-1 text-sm font-extrabold text-[#087F5B]">{item.amount}</div>
                          <p className="text-[11px] text-[#64748B]">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      * The rotational payout schedule is transparently visible to all members, ensuring complete predictability.
                    </p>
                  </div>
                )}

                {activeTab === "receipts" && (
                  <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6F4EF] text-[#066849]">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>OFFICIAL DIGITAL RECEIPT • VERIFIED</span>
                      </div>
                      <h4 className="text-xl font-bold text-[#102A43]">GH₵ 250.00 Contribution Received</h4>
                      <p className="text-xs text-[#64748B]">
                        Member: <span className="font-semibold text-[#334155]">Kwesi Arthur</span> • Period 1 of 4
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Amount in words:{" "}
                        <span className="font-semibold text-[#334155]">
                          Two Hundred and Fifty Ghana Cedis Only
                        </span>
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Recorded Method: <span className="font-medium text-[#102A43]">Mobile Money</span> • Reference:{" "}
                        <span className="font-mono text-[#102A43]">TXN-MM-984210</span>
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1E3A5F] transition-colors shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-[#087F5B]" />
                        <span>Generate &amp; Download PDF</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST INDICATORS & KEY BENEFITS STRIP ───────────────────────────── */}
      <section className="bg-white border-y border-[#E2E8F0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">
            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                100%
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Accurate Financial Records
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Exact Ghana Cedi and pesewa calculations</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                6 Channels
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Payment Method Tracking
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Cash, Mobile Money &amp; Bank Transfer logs</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Flexible
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Custom Deadlines
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Configurable contribution schedules</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Official
              </span>
              <span className="block mt-1 text-xs font-semibold text-[#087F5B] uppercase tracking-wider">
                Digital PDF Receipts
              </span>
              <p className="mt-1 text-xs text-[#64748B]">Instant verification for every payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CORE FEATURES (6 VISUALLY CONSISTENT CARDS) ────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#087F5B] bg-[#E6F4EF] px-3.5 py-1 rounded-full border border-[#A3E0CE]">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Everything Your Savings Group Needs to Succeed
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">
              Designed specifically to solve the real challenges of group savings: eliminating disputed payments,
              tracking deadlines, and keeping every member on the same page.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Group &amp; Member Management</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Easily configure group capacity, register active members with verified phone numbers, and assign
                  transparent rotation payout positions with clear membership statuses.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#087F5B]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configurable group sizes &amp; contact directories</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Contribution Management</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Set standard contribution amounts per cycle period, customize due dates to fit member paydays, and
                  instantly identify who has paid, who paid partially, and who is pending.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Custom deadlines &amp; automatic status tracking</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] text-[#92400E] flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Payment Tracking</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Record payments received across Cash, MTN Mobile Money, Telecel Cash, AT Money, and Bank Transfers.
                  Log transaction reference numbers and admin verification for clean records.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#92400E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supports 6 Ghanaian payment methods with reference tracking</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Rotation &amp; Payout Management</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Organize scheduled payouts according to the group rotation. Authorize disbursements once period
                  contributions are pooled, and record beneficiary acknowledgments with complete date stamps.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#087F5B]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fair rotation queues &amp; disbursement confirmation</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Financial Reports &amp; Digital Receipts</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Instantly issue official digital receipts for every member payment. Generate cycle summary reports and
                  download PDF documentation featuring exact figures and formal currency words.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloadable PDF receipts &amp; period statements</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] text-[#102A43] border border-[#CBD5E1] flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#102A43]">Administrative Oversight</h3>
                <p className="text-sm text-[#334155] leading-relaxed">
                  Maintain an orderly financial history. Review outstanding contributions, handle payment adjustments,
                  and ensure the cycle is fully completed and reconciled before initiating the next round.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-[#102A43]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reconciled cycle closing &amp; comprehensive activity history</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (SIMPLE 4-STEP PROCESS) ────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#087F5B] bg-[#E6F4EF] px-3.5 py-1 rounded-full border border-[#A3E0CE]">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              How RSCMS Works for Your Savings Group
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">
              From group setup to final payout reconciliation, RSCMS provides a structured, stress-free workflow.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Create & Configure Group",
                desc: "Set up your savings club, determine the number of members, and specify the contribution amount in Ghana Cedis.",
              },
              {
                step: "02",
                title: "Add Members & Deadlines",
                desc: "Add member details, assign transparent rotation turns, and establish customizable contribution deadlines for each period.",
              },
              {
                step: "03",
                title: "Record & Track Contributions",
                desc: "Log member payments made via cash, mobile money, or bank transfer, and instantly generate official digital receipts.",
              },
              {
                step: "04",
                title: "Disburse Payouts & Reconcile",
                desc: "Disburse the collected payout to the scheduled beneficiary, obtain acknowledgment, and close the cycle cleanly.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <span className="block text-4xl font-black text-[#087F5B]/25 font-mono">{step.step}</span>
                <h3 className="text-lg font-bold text-[#102A43]">{step.title}</h3>
                <p className="text-xs text-[#334155] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSPARENCY & ACCOUNTABILITY ───────────────────────────────────── */}
      <section id="transparency" className="py-20 md:py-28 bg-[#F5F7FA] border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#E6F4EF] text-[#066849]">
                <Sparkles className="w-4 h-4" />
                <span>TRANSPARENCY &amp; ACCOUNTABILITY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight leading-tight">
                Clear Records That Every Member Can Trust
              </h2>
              <p className="text-base text-[#334155] leading-relaxed">
                Trust is the foundation of every successful savings group. RSCMS replaces informal WhatsApp lists and paper
                notebooks with verified, objective financial records that protect both administrators and members.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A43]">Organized Contribution Tracking</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Know exactly who has paid, who has paid partially, and who has an outstanding obligation for every period.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A43]">Predictable Rotational Payout Schedules</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Every member knows their exact turn in advance. No confusion, no favoritism, and no last-minute changes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A43]">Official Printable Receipts</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Every verified payment generates a receipt with a serial number, full member names, and words representation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A43]">Orderly Cycle Closure</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      A cycle only repeats once all funds and payouts are fully balanced, ensuring clean transitions between rounds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#102A43] p-8 text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Savings Group Governance</h4>
                  <p className="text-xs text-slate-300">Key principles enforced across RSCMS</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                  Reliable
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Consistent Financial Records</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Calculations are maintained with exact precision in Ghana Cedis and pesewas, eliminating rounding discrepancies.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clear Administrative History</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Payment verifications, adjustments, and payout authorizations are recorded with administrator details and timestamps.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Non-Custodial Transparency</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    RSCMS serves as your record management platform. Groups retain direct control and ownership of their financial funds.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <span>Explore the Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECURITY & PRIVACY SECTION ──────────────────────────────────────── */}
      <section id="security" className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#102A43] text-white p-8 sm:p-12 space-y-8 relative overflow-hidden shadow-2xl">
            {/* Ambient accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#087F5B]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#087F5B] text-white">
                <ShieldCheck className="w-4 h-4" />
                <span>SECURITY &amp; PRIVACY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Built with Data Protection at Its Core
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                We know that financial data demands confidentiality and integrity. RSCMS incorporates strong security
                practices to protect member information, prevent unauthorized access, and preserve accurate records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-200">
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Authorized Administrator Access</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Only authenticated group administrators can access dashboard controls, record member payments, and
                  authorize rotational payouts.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted Communications</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  All traffic between your browser and RSCMS is transmitted over encrypted HTTPS connections to safeguard
                  passwords and member data.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Transparent Activity History</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Key administrative actions—including payment approvals, reversals, and deadline adjustments—are recorded in
                  an immutable activity history.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Member Data Privacy</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Member information is handled in accordance with transparent privacy standards and used solely for group
                  savings record-keeping.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <Link href="/privacy" className="hover:text-white underline underline-offset-4">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-white underline underline-offset-4">
                  Terms &amp; Conditions
                </Link>
              </div>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-[#102A43] bg-white hover:bg-slate-100 transition-colors"
              >
                <span>Access Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (ACCORDION) ─────────────────────────── */}
      <section id="faq" className="py-20 md:py-28 bg-[#F5F7FA] border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#087F5B] bg-[#E6F4EF] px-3.5 py-1 rounded-full border border-[#A3E0CE]">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-base text-[#334155] leading-relaxed">
              Learn how RSCMS supports savings group administrators and members every step of the way.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden transition-shadow shadow-sm hover:shadow"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none focus:bg-[#F8FAFC]"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-base text-[#102A43]">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#64748B] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#087F5B]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm text-[#334155] leading-relaxed border-t border-[#F1F5F9]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#102A43] text-white relative overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-[#087F5B]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODERN GROUP SAVINGS PLATFORM</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Bring Clarity and Confidence to Your Group Savings.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate scattered notebooks, payment disputes, and calculation uncertainties. Provide your savings group
            with the transparent management and verifiable digital records they deserve.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white bg-[#087F5B] hover:bg-[#066849] shadow-lg shadow-[#087F5B]/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span>Access Admin Portal</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/15"
            >
              <span>Explore Features</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#0B1D2F] text-white border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand Info */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#087F5B] font-bold text-lg">
                  ₵
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-tight text-white">RSCMS</span>
                  <p className="text-xs text-slate-400">
                    Rotating Savings &amp; Collection Management System
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                A non-custodial financial management and record-keeping platform designed for rotating savings groups,
                Susu clubs, and community peer finances across Ghana.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-[#087F5B]" />
                <span>support@rscms.local</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#transparency" className="hover:text-white transition-colors">
                    Transparency &amp; Accountability
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-white transition-colors">
                    Security &amp; Privacy
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Admin Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal &amp; Access</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Admin Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} RSCMS. Designed for reliable community group savings in Ghana.</p>
            <p className="text-slate-400">Non-Custodial Financial Record Management</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
