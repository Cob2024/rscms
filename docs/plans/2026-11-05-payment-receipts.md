# Payment Receipt Generation & Dispatch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow administrators to immediately generate, preview, print/PDF, and dispatch official payment receipts to group members via WhatsApp, SMS, and shareable web links after recording or verifying a contribution payment.

**Architecture:** 
1. Core currency-to-words utility (`src/lib/formatting/words.ts`) and receipt generation service (`src/services/receipt.service.ts`) producing standardized, immutable receipt payloads.
2. API route `GET /api/payments/[id]/receipt` to fetch receipt data with member, group, period, allocation, and general ledger verification metadata.
3. Standalone, mobile-friendly digital receipt page (`src/app/receipts/[id]/page.tsx`) with `@media print` layout suitable for member self-service and PDF downloads.
4. UI integration: `ReceiptDialog` component with live preview, 1-click WhatsApp dispatch to the member's phone number, clipboard copy for SMS, print/PDF, plus automatic post-payment receipt prompt in `RecordPaymentDialog` and quick receipt action buttons in the Payments table.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, Tailwind CSS, Lucide icons, Vitest.

---

### Task 1: Currency-to-Words Utility & Unit Tests

**Files:**
- Create: `src/lib/formatting/words.ts`
- Create: `tests/unit/currency-words.test.ts`

**Step 1: Write the failing test**
Create `tests/unit/currency-words.test.ts` testing integer pesewas conversion to Ghana Cedis words (e.g., 25000 pesewas -> "Two Hundred and Fifty Ghana Cedis Only", 10050 pesewas -> "One Hundred Ghana Cedis and Fifty Pesewas Only", zero -> "Zero Ghana Cedis Only").

**Step 2: Run test to verify it fails**
Run: `npm run test:run tests/unit/currency-words.test.ts`
Expected: FAIL ("cannot find module")

**Step 3: Write minimal implementation**
Implement `pesewasToWords(pesewas: number): string` in `src/lib/formatting/words.ts`.

**Step 4: Run test to verify it passes**
Run: `npm run test:run tests/unit/currency-words.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/lib/formatting/words.ts tests/unit/currency-words.test.ts`
`git commit -m "feat(formatting): add pesewasToWords currency formatting utility"`

---

### Task 2: Receipt Service & Data Serialization

**Files:**
- Create: `src/services/receipt.service.ts`
- Test: `tests/unit/receipt-generation.test.ts`

**Step 1: Write the failing test**
Create `tests/unit/receipt-generation.test.ts` asserting that `ReceiptService.formatReceiptData` generates receipt numbers, formatted amounts in words, WhatsApp message payloads, and remaining obligation breakdowns.

**Step 2: Run test to verify it fails**
Run: `npm run test:run tests/unit/receipt-generation.test.ts`
Expected: FAIL

**Step 3: Write implementation**
Implement `ReceiptService` with:
- `getReceiptByPaymentId(paymentId: string)`: fetches payment, member, group, obligation, verifier from Prisma.
- `formatReceipt(paymentRecord)`: builds `ReceiptPayload` with `receiptNumber`, `formattedAmount`, `amountInWords`, `whatsAppUrl`, `smsUrl`, `summary`.

**Step 4: Run test to verify it passes**
Run: `npm run test:run tests/unit/receipt-generation.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/services/receipt.service.ts tests/unit/receipt-generation.test.ts`
`git commit -m "feat(receipts): implement ReceiptService and receipt payload formatting"`

---

### Task 3: Receipt API Route (`GET /api/payments/[id]/receipt`)

**Files:**
- Create: `src/app/api/payments/[id]/receipt/route.ts`

**Step 1: Write route implementation**
Create Next.js Route Handler supporting `GET` with authentication verification, fetching the receipt using `ReceiptService.getReceiptByPaymentId(params.id)`.

**Step 2: Verify with typecheck**
Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**
`git add src/app/api/payments/[id]/receipt/route.ts`
`git commit -m "feat(api): add GET /api/payments/[id]/receipt endpoint"`

---

### Task 4: Digital Receipt Modal Component (`ReceiptDialog`)

**Files:**
- Create: `src/components/payments/receipt-dialog.tsx`

**Step 1: Build the Component**
Create `ReceiptDialog` presenting:
- Official receipt layout (Header, RSCMS emblem, Group Name, Receipt #, Date).
- Member & payment information: Member Full Name, Phone, Rotation Position, Channel, MoMo Ref, Cycle & Period.
- Financial statement breakdown: Obligation target, amount paid, remaining balance, cleared/settled status badge.
- Action toolbar:
  - **Print / Download PDF** (`window.print()`).
  - **Send via WhatsApp** (`window.open(receipt.whatsAppUrl, '_blank')`).
  - **Copy Receipt Text** (writes formatted message to clipboard).
  - **Share Link** (copies `/receipts/${paymentId}`).
- Print stylesheet overrides (`@media print`) so printing only outputs the clean receipt card.

**Step 2: Verify with typecheck and lint**
Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 3: Commit**
`git add src/components/payments/receipt-dialog.tsx`
`git commit -m "feat(ui): add ReceiptDialog component with WhatsApp dispatch and printing"`

---

### Task 5: Post-Payment Prompt & Table Integration

**Files:**
- Modify: `src/components/payments/record-payment-dialog.tsx`
- Modify: `src/app/(dashboard)/payments/page.tsx`

**Step 1: Update `RecordPaymentDialog`**
Upon successful payment submission:
- Pass the created/verified payment ID back to parent callback `onSuccess(createdPaymentId?: string)`.
- Allow automatically opening the `ReceiptDialog` so admin can send the receipt in one seamless step.

**Step 2: Update `PaymentsPage` (`src/app/(dashboard)/payments/page.tsx`)**
- Add state `receiptPaymentId: string | null`.
- Add a dedicated **Receipt** icon button (`Receipt`) in the Actions column of each payment row.
- Add "View Official Receipt" in the Payment Details modal.
- Render `<ReceiptDialog isOpen={Boolean(receiptPaymentId)} paymentId={receiptPaymentId} onClose={() => setReceiptPaymentId(null)} />`.

**Step 3: Run typecheck and lint**
Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 4: Commit**
`git add src/components/payments/record-payment-dialog.tsx src/app/(dashboard)/payments/page.tsx`
`git commit -m "feat(payments): integrate receipt actions into payment table and post-payment flow"`

---

### Task 6: Public / Member Shareable Digital Receipt Page (`/receipts/[id]`)

**Files:**
- Create: `src/app/receipts/[id]/page.tsx`

**Step 1: Implement the standalone receipt view**
Create `/receipts/[id]` which:
- Fetches receipt from `/api/payments/[id]/receipt` (or directly via `ReceiptService`).
- Displays a clean, responsive, bank-grade digital receipt.
- Provides a "Print Receipt" button and "Save as PDF" button.
- Clean design view without dashboard sidebar navigation so members can view it on mobile devices via WhatsApp link.

**Step 2: Run typecheck and build**
Run: `npm run typecheck && npm run test:run`
Expected: PASS

**Step 3: Commit**
`git add src/app/receipts/[id]/page.tsx`
`git commit -m "feat(receipts): add public member receipt view page"`

---

### Task 7: Full Verification & Production Deployment

**Step 1: Run all test suites**
Run: `npm run test:run`

**Step 2: Run TypeScript and ESLint**
Run: `npm run typecheck && npm run lint`

**Step 3: Run Production Build**
Run: `npm run build`

**Step 4: Push to Main & Deploy**
Run: `git push origin main`
Verify deployment on `https://rscms.vercel.app`.

