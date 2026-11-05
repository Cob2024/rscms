/**
 * Utility to convert integer pesewas into official Ghana Cedis words for financial receipts.
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function numberToWordsUnderThousand(num: number): string {
  if (num === 0) return "";
  let result = "";
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + " Hundred";
    num %= 100;
    if (num > 0) result += " and ";
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)];
    if (num % 10 > 0) result += " " + ONES[num % 10];
  } else if (num > 0) {
    result += ONES[num];
  }
  return result.trim();
}

export function integerToWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Negative " + integerToWords(Math.abs(num));

  const parts: string[] = [];

  const millions = Math.floor(num / 1_000_000);
  num %= 1_000_000;
  if (millions > 0) {
    parts.push(numberToWordsUnderThousand(millions) + " Million");
  }

  const thousands = Math.floor(num / 1_000);
  num %= 1_000;
  if (thousands > 0) {
    parts.push(numberToWordsUnderThousand(thousands) + " Thousand");
  }

  if (num > 0) {
    parts.push(numberToWordsUnderThousand(num));
  }

  return parts.join(" ");
}

/**
 * Converts amount in pesewas to words.
 * Example: 25000 -> "Two Hundred and Fifty Ghana Cedis Only"
 * Example: 10050 -> "One Hundred Ghana Cedis and Fifty Pesewas Only"
 */
export function pesewasToWords(pesewas: number): string {
  if (pesewas === 0) return "Zero Ghana Cedis Only";

  const totalPesewas = Math.round(pesewas);
  const cedis = Math.floor(totalPesewas / 100);
  const remainderPesewas = totalPesewas % 100;

  const parts: string[] = [];

  if (cedis > 0) {
    const cediWord = cedis === 1 ? "Ghana Cedi" : "Ghana Cedis";
    parts.push(`${integerToWords(cedis)} ${cediWord}`);
  }

  if (remainderPesewas > 0) {
    const pesewaWord = remainderPesewas === 1 ? "Pesewa" : "Pesewas";
    parts.push(`${integerToWords(remainderPesewas)} ${pesewaWord}`);
  }

  return parts.join(" and ") + " Only";
}
