import { z } from "zod";

export const periodConfigSchema = z.object({
  periodNumber: z.number().int().min(1).max(4),
  startDate: z.string().datetime({ message: "Period start date must be a valid ISO datetime" }),
  dueDate: z.string().datetime({ message: "Contribution deadline must be a valid ISO datetime" }),
  closeDate: z.string().datetime({ message: "Period close date must be a valid ISO datetime" }),
  amountPesewas: z.number().int().positive().optional(),
});

export const createCycleSchema = z
  .object({
    startDate: z.string().datetime({ message: "Cycle start date must be a valid ISO datetime" }),
    contributionAmountPesewas: z
      .number()
      .int()
      .positive("Contribution amount must be a positive integer in pesewas")
      .default(25000), // Default: GH₵250 in pesewas
    monthlyTargetPesewas: z
      .number()
      .int()
      .positive("Monthly target must be a positive integer in pesewas")
      .default(100000), // Default: GH₵1,000 in pesewas
    dueDates: z
      .array(z.string().datetime({ message: "Each deadline must be a valid ISO datetime" }))
      .length(4, "Exactly 4 contribution deadlines must be configured"),
  })
  .refine(
    (data) => {
      const dates = data.dueDates.map((d) => new Date(d).getTime());
      // Deadlines must be strictly chronological: Period 1 < Period 2 < Period 3 < Period 4
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] <= dates[i - 1]) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Contribution deadlines must follow chronological order (Period 1 < Period 2 < Period 3 < Period 4)",
      path: ["dueDates"],
    }
  );

export const updateDeadlineSchema = z.object({
  newDueDate: z.string().datetime({ message: "New deadline must be a valid ISO datetime" }),
  reason: z.string().trim().min(3, "Please provide an administrative reason for the deadline adjustment"),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>;

