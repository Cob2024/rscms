-- Monetary amounts are pesewas and must be positive where an amount represents an obligation or posting.
ALTER TABLE "savings_cycles" ADD CONSTRAINT "savings_cycles_amounts_positive" CHECK ("contribution_amount" > 0 AND "monthly_target" > 0);
ALTER TABLE "contribution_periods" ADD CONSTRAINT "contribution_periods_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_amount_positive" CHECK ("amount" > 0 AND "paid_amount" >= 0 AND "outstanding_amount" >= 0);
ALTER TABLE "contribution_obligations" ADD CONSTRAINT "contribution_obligations_balance_consistent" CHECK ("paid_amount" + "outstanding_amount" = "amount");
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_amounts_valid" CHECK ("expected_amount" > 0 AND "authorized_amount" > 0 AND "actual_amount" >= 0 AND "outstanding_amount" >= 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_positive" CHECK ("amount" > 0);

-- Keep the deployment single-group and prevent concurrent active cycles.
CREATE UNIQUE INDEX "savings_groups_one_active_idx" ON "savings_groups" ("is_active") WHERE "is_active" = true;
CREATE UNIQUE INDEX "savings_cycles_one_active_per_group_idx" ON "savings_cycles" ("group_id") WHERE "status" = 'ACTIVE';

-- Enforce double-entry balance at transaction commit, after all entries have been posted.
CREATE FUNCTION enforce_ledger_transaction_balance() RETURNS trigger AS $$
DECLARE
  target_id UUID;
  debit_total BIGINT;
  credit_total BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'ledger_transactions' THEN
    target_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    target_id := OLD.transaction_id;
  ELSE
    target_id := NEW.transaction_id;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0)
  INTO debit_total, credit_total
  FROM ledger_entries
  WHERE transaction_id = target_id;

  IF debit_total = 0 OR debit_total <> credit_total THEN
    RAISE EXCEPTION 'Ledger transaction % is not balanced (debits %, credits %)', target_id, debit_total, credit_total;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER ledger_transactions_must_balance
AFTER INSERT ON ledger_transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_transaction_balance();

CREATE CONSTRAINT TRIGGER ledger_entries_must_balance
AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_transaction_balance();

-- Keep financial and audit history append-only.
CREATE FUNCTION prevent_financial_history_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Financial and audit history cannot be changed or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_prevent_delete BEFORE DELETE ON payments FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
CREATE TRIGGER payment_allocations_prevent_update_delete BEFORE UPDATE OR DELETE ON payment_allocations FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
CREATE TRIGGER payouts_prevent_delete BEFORE DELETE ON payouts FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
CREATE TRIGGER ledger_transactions_prevent_update_delete BEFORE UPDATE OR DELETE ON ledger_transactions FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
CREATE TRIGGER ledger_entries_prevent_update_delete BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
CREATE TRIGGER audit_logs_prevent_update_delete BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_financial_history_mutation();
