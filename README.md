# RSCMS

Rotating Savings and Contribution Management System for one four-member savings group. The application uses Next.js App Router, PostgreSQL, Prisma, Supabase Auth and integer pesewas for stored money values.

## Local setup

1. Install Node.js 20 or later and PostgreSQL, then run `npm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Create the administrator in Supabase Auth. Add that Auth user's UUID to `admin_users` in PostgreSQL:

   ```sql
   INSERT INTO admin_users (supabase_id, email, full_name, created_at, updated_at)
   VALUES ('SUPABASE_AUTH_USER_UUID', 'admin@example.com', 'Group Administrator', now(), now());
   ```

4. Create the initial database migration with `npm run prisma:migrate -- --name init`.
5. Start the app with `npm run dev`.

The application only grants administrator access to Supabase users that have a matching `admin_users` row. The Supabase service-role key is not used for browser sessions or API authentication. Never put it in a `NEXT_PUBLIC_` variable.

## Initial group workflow

1. Sign in with the provisioned administrator account.
2. Create the group in **Settings**.
3. Add four members with rotation positions 1 through 4.
4. Create a cycle and provide an explicit deadline for each of its four contribution periods.
5. Record payments with a receipt or evidence note. Recorded payments remain pending until verified.
6. Review contributions, ledger entries and payout decisions from their respective sections.

All stored contribution and payout amounts are integer pesewas. GHS input strings are parsed into pesewas without floating-point multiplication. Verified payments and payouts post balanced ledger entries in database transactions.

## Configuration and payment integration

The initial implementation supports manually recorded payments. No payment provider has been selected, so automatic payment initiation and webhook verification are not configured. Do not add provider secrets until one has been selected.

`SUPABASE_SERVICE_ROLE_KEY` is reserved for future server-only administrative integrations and must remain private. The app's current session validation uses the public anon key and Supabase access-token validation.

## Current implementation scope

Implemented flows include administrator session validation, group setup, member creation, four-period cycle generation, verified-allocation contribution status, evidence-backed manual payment recording and verification, balanced payment and payout ledger postings, controlled payout authorization, disbursement and receipt acknowledgement, audit history, and CSV reports.

The current release does not yet include cycle renewal automation, payment reversals, provider webhooks, deadline editing, member editing/status changes, PDF/XLSX exports, reconciliation tooling, or production rate limiting and monitoring. These remain required before production use.
