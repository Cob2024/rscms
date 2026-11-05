import { describe, it, expect } from "vitest";
import { pesewasToWords } from "@/lib/formatting/words";

describe("pesewasToWords utility", () => {
  it("converts standard monthly contribution (GH₵250.00)", () => {
    expect(pesewasToWords(25000)).toBe("Two Hundred and Fifty Ghana Cedis Only");
  });

  it("converts monthly group target (GH₵1,000.00)", () => {
    expect(pesewasToWords(100000)).toBe("One Thousand Ghana Cedis Only");
  });

  it("converts compound amounts with cedis and pesewas (GH₵100.50)", () => {
    expect(pesewasToWords(10050)).toBe("One Hundred Ghana Cedis and Fifty Pesewas Only");
  });

  it("handles singular cedi (GH₵1.00)", () => {
    expect(pesewasToWords(100)).toBe("One Ghana Cedi Only");
  });

  it("handles singular pesewa (GH₵0.01)", () => {
    expect(pesewasToWords(1)).toBe("One Pesewa Only");
  });

  it("handles multiple pesewas only (GH₵0.50)", () => {
    expect(pesewasToWords(50)).toBe("Fifty Pesewas Only");
  });

  it("handles zero pesewas", () => {
    expect(pesewasToWords(0)).toBe("Zero Ghana Cedis Only");
  });

  it("handles larger amounts like GH₵12,500.00", () => {
    expect(pesewasToWords(1250000)).toBe("Twelve Thousand Five Hundred Ghana Cedis Only");
  });
});
