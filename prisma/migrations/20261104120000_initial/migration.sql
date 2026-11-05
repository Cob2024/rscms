-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'OVERDUE_PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REVERSED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CASH', 'MTN_MOMO', 'TELECEL_CASH', 'AT_MONEY', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('SCHEDULED', 'AUTHORIZED', 'DISBURSED', 'ACKNOWLEDGED', 'PARTIAL', 'POSTPONED');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('POSTPONE_PAYOUT', 'CARRY_FORWARD', 'PARTIAL_PAYOUT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CONTRIBUTION', 'PAYOUT', 'REVERSAL', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "supabase_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contribution_amount" INTEGER NOT NULL DEFAULT 25000,
    "member_count" INTEGER NOT NULL DEFAULT 4,
    "monthly_target" INTEGER NOT NULL DEFAULT 100000,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "rotation_position" INTEGER NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_cycles" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "contribution_amount" INTEGER NOT NULL,
    "monthly_target" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "savings_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_periods" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "close_date" TIMESTAMP(3) NOT NULL,
    "deadline_configured_by" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribution_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution_obligations" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "outstanding_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribution_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "period_id" UUID,
    "amount" INTEGER NOT NULL,
    "channel" "PaymentChannel" NOT NULL,
    "reference" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_provider_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payment_id" UUID,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_provider_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_schedules" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "rotation_position" INTEGER NOT NULL,
    "expected_amount" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "expected_amount" INTEGER NOT NULL,
    "authorized_amount" INTEGER NOT NULL,
    "actual_amount" INTEGER NOT NULL DEFAULT 0,
    "outstanding_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "PayoutStatus" NOT NULL DEFAULT 'SCHEDULED',
    "channel" "PaymentChannel",
    "reference" TEXT,
    "authorized_at" TIMESTAMP(3),
    "authorized_by" UUID,
    "disbursed_at" TIMESTAMP(3),
    "disbursed_by" UUID,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_resolutions" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "resolution_type" "ResolutionType" NOT NULL,
    "affected_member_id" UUID,
    "outstanding_amount" INTEGER NOT NULL,
    "decision_description" TEXT NOT NULL,
    "approved_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_entity_type" TEXT,
    "related_entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_supabase_id_key" ON "admin_users"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_group_id_rotation_position_key" ON "members"("group_id", "rotation_position");

-- CreateIndex
CREATE UNIQUE INDEX "savings_cycles_group_id_cycle_number_key" ON "savings_cycles"("group_id", "cycle_number");

-- CreateIndex
CREATE UNIQUE INDEX "contribution_periods_cycle_id_period_number_key" ON "contribution_periods"("cycle_id", "period_number");

-- CreateIndex
CREATE UNIQUE INDEX "contribution_obligations_period_id_member_id_key" ON "contribution_obligations"("period_id", "member_id");

-- CreateIndex
CREATE INDEX "payments_group_id_payment_date_idx" ON "payments"("group_id", "payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_group_id_reference_key" ON "payments"("group_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_payment_id_obligation_id_key" ON "payment_allocations"("payment_id", "obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_events_provider_event_id_key" ON "payment_provider_events"("provider", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payout_schedules_cycle_id_rotation_position_key" ON "payout_schedules"("cycle_id", "rotation_position");

-- CreateIndex
CREATE UNIQUE INDEX "payout_schedules_period_id_rotation_position_key" ON "payout_schedules"("period_id", "rotation_position");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_group_id_code_key" ON "ledger_accounts"("group_id", "code");

-- CreateIndex
CREATE INDEX "ledger_transactions_group_id_created_at_idx" ON "ledger_transactions"("group_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_source_type_source_id_key" ON "ledger_transactions"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_group_id_reference_key" ON "ledger_transactions"("group_id", "reference");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "savings_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_cycles" ADD CONSTRAINT "savings_cycles_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "savings_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_periods" ADD CONSTRAINT "contribution_periods_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "savings_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_periods" ADD CONSTRAINT "contribution_periods_deadline_configured_by_fkey" FOREIGN KEY ("deadline_configured_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contribution_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "savings_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contribution_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "contribution_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_provider_events" ADD CONSTRAINT "payment_provider_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_schedules" ADD CONSTRAINT "payout_schedules_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "savings_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_schedules" ADD CONSTRAINT "payout_schedules_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contribution_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_schedules" ADD CONSTRAINT "payout_schedules_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "payout_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_authorized_by_fkey" FOREIGN KEY ("authorized_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_disbursed_by_fkey" FOREIGN KEY ("disbursed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "savings_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "savings_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_resolutions" ADD CONSTRAINT "cycle_resolutions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contribution_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_resolutions" ADD CONSTRAINT "cycle_resolutions_affected_member_id_fkey" FOREIGN KEY ("affected_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_resolutions" ADD CONSTRAINT "cycle_resolutions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

