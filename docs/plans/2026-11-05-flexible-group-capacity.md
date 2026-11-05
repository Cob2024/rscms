# Flexible Group Membership & Configurable Capacity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable administrators to configure group member capacity beyond 4 members, register additional group participants with dynamic rotation positions, and support variable-length rotating savings cycles matching the group size.

**Architecture:** 
1. Add a `PATCH /api/group` endpoint and service logic to update `SavingsGroup.memberCount` and recalculate `monthlyTarget`.
2. Relax hardcoded 4-member constraints in Zod schemas (`member.ts`, `cycle.ts`) to allow positions and periods from 1 to 100.
3. Update `CycleService.createCycle` to generate $N$ periods dynamically based on the active member count.
4. Add a "Group Capacity & Membership Settings" card on `/settings` and update `MemberFormDialog` to generate dynamic rotation seats up to group capacity.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL (Supabase), Zod, Tailwind CSS, Lucide Icons, Vitest.

---

### Task 1: Add `PATCH /api/group` for Capacity and Financial Settings

**Files:**
- Modify: `src/app/api/group/route.ts`
- Test: `tests/unit/group-capacity.test.ts`

**Step 1: Write the unit test for PATCH /api/group input validation and capacity logic**
Create `tests/unit/group-capacity.test.ts` testing:
- Validates `memberCount` is an integer between 2 and 100.
- Rejects `memberCount` lower than currently registered active members.
- Recalculates `monthlyTarget = contributionAmount * memberCount`.

**Step 2: Run test to verify it fails**
Run: `npm run test:run -- tests/unit/group-capacity.test.ts`
Expected: FAIL (file or schema not found).

**Step 3: Implement PATCH handler in `src/app/api/group/route.ts`**
- Define `updateGroupInput = z.object({ name: z.string().trim().min(2).max(120).optional(), memberCount: z.number().int().min(2).max(100).optional(), contributionAmount: z.number().int().positive().optional() })`.
- Export `export async function PATCH(request: NextRequest)`.
- Enforce `requireAdmin`.
- Verify `memberCount >= activeMemberCount`.
- Update `prisma.savingsGroup` and log `AUDIT_LOG`.

**Step 4: Run test to verify it passes**
Run: `npm run test:run -- tests/unit/group-capacity.test.ts`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(api): add PATCH /api/group to support configurable group capacity"`

---

### Task 2: Relax Hardcoded 4-Member Limits in Zod Schemas

**Files:**
- Modify: `src/lib/validation/member.ts`
- Modify: `src/lib/validation/cycle.ts`
- Test: `tests/unit/validation.test.ts`

**Step 1: Write the failing test**
In `tests/unit/validation.test.ts`, add test cases:
- `createMemberSchema` accepts `rotationPosition: 5` and `rotationPosition: 10`.
- `createCycleSchema` accepts arrays of 5 or 6 chronological deadlines.

**Step 2: Run test to verify it fails**
Run: `npm run test:run -- tests/unit/validation.test.ts`
Expected: FAIL (max is 4, length is 4).

**Step 3: Update `member.ts` and `cycle.ts`**
- In `src/lib/validation/member.ts`: Change `.max(4)` to `.max(100)`.
- In `src/lib/validation/cycle.ts`:
  - Change `dueDates: z.array(...).min(2).max(100)`.
  - Change `periodConfigSchema: periodNumber.min(1).max(100)`.

**Step 4: Run test to verify it passes**
Run: `npm run test:run -- tests/unit/validation.test.ts`
Expected: PASS.

**Step 5: Commit**
`git commit -m "refactor(validation): allow dynamic rotation positions and deadlines beyond 4"`

---

### Task 3: Update `CycleService.createCycle` for Dynamic $N$-Member Cycles

**Files:**
- Modify: `src/services/cycle.service.ts`
- Test: `tests/unit/cycle-management.test.ts`

**Step 1: Write unit test for dynamic member cycle creation**
Add test in `tests/unit/cycle-management.test.ts` verifying that creating a cycle with 5 or 6 members creates 5 or 6 periods, matching obligations, and payout schedules.

**Step 2: Run test to verify it fails**
Run: `npm run test:run -- tests/unit/cycle-management.test.ts`
Expected: FAIL (`Group must have exactly 4 active members`).

**Step 3: Update `CycleService.createCycle`**
- Replace `if (members.length !== 4)` with:
  - `if (members.length < 2) throw new CycleServiceError("Group must have at least 2 active members to start a cycle.", 409);`
  - `if (members.length !== group.memberCount) throw new CycleServiceError(\`Group capacity is configured for \${group.memberCount} members, but currently has \${members.length} active members.\`, 409);`
- Check rotation positions match `1, 2, ..., N`.
- Loop `for (let i = 0; i < members.length; i++)`.
- Set `endDate = addMonths(startDate, members.length)`.
- Set `monthlyTarget = contributionAmount * members.length`.

**Step 4: Run tests to verify they pass**
Run: `npm run test:run -- tests/unit/cycle-management.test.ts`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(cycles): support dynamic N-period cycles matching configured group capacity"`

---

### Task 4: Enhance Member Registration UI for Dynamic Positions

**Files:**
- Modify: `src/components/members/member-form-dialog.tsx`
- Modify: `src/app/(dashboard)/members/page.tsx`

**Step 1: Update `MemberFormDialog`**
- Accept `maxCapacity?: number` prop (defaults to 10).
- Dynamically build available rotation seats `1` through `maxCapacity`.
- Update select label: `Rotation Position (1 – ${maxCapacity})`.

**Step 2: Update `src/app/(dashboard)/members/page.tsx`**
- Fetch group capacity from `/api/group`.
- Update "Rotation Seats" KPI card to show `{members.length} / {capacity}`.
- Disable "Register Member" button only when `members.length >= capacity`.
- Show contextual banner when group is at capacity with a quick link to Settings: *"Group has reached capacity ({capacity}/{capacity}). Increase capacity in Settings to add more members."*

**Step 3: Verify with linter and typecheck**
Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

**Step 4: Commit**
`git commit -m "feat(members): support dynamic group capacity and rotation seat assignment"`

---

### Task 5: Add Group Capacity Configuration Section in Settings

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

**Step 1: Add "Group Capacity & Membership Limit" form card**
- Card displays:
  - Current Capacity (e.g. 4, 5, 6, 8, 10, etc.)
  - Registered Active Members (e.g. 4 members)
  - Number input / selector for new capacity (min: current active members count, max: 50).
  - Monthly Contribution input.
  - Calculated Monthly Collection Pool ($N \times \text{Contribution}$).
  - Submit button: "Update Group Capacity".
- When submitted:
  - Sends `PATCH /api/group` with `{ memberCount, contributionAmount }`.
  - Refreshes settings and displays success toast/notice.

**Step 2: Update "Create Cycle" Form on Settings**
- Dynamically render `members.length` deadline inputs (Period 1 to Period $N$) instead of hardcoded 4 inputs.

**Step 3: Verify with linter and typecheck**
Run: `npm run typecheck && npm run lint`
Expected: 0 errors.

**Step 4: Commit**
`git commit -m "feat(settings): add group capacity management and dynamic cycle period generation"`

---

### Task 6: Full Integration Test & Production Verification

**Step 1: Run all unit tests**
Run: `npm run test:run`
Expected: 100% passing.

**Step 2: Production Build**
Run: `npm run build`
Expected: Clean build across all routes.

**Step 3: Deploy to Production**
Run: `git push origin main`
Expected: Vercel builds and deploys successfully.

