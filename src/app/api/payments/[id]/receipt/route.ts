import { NextRequest, NextResponse } from "next/server";
import { ReceiptService, ReceiptServiceError } from "@/services/receipt.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const origin =
      request.headers.get("origin") ||
      request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
        : request.nextUrl.origin;

    const receipt = await ReceiptService.getReceiptByPaymentId(params.id, origin);
    return NextResponse.json({ receipt });
  } catch (error) {
    if (error instanceof ReceiptServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/payments/[id]/receipt error:", error);
    return NextResponse.json(
      { error: "Failed to generate payment receipt." },
      { status: 500 }
    );
  }
}
