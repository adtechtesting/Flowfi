import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { releaseFunds } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: Request) {
  try {
    // 1. Find all invoices that are FUNDED (or ADVANCED) and have passed their release date
    const now = new Date();
    const expiredInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["ESCROW_FUNDED", "ADVANCED"] },
        scheduledReleaseAt: {
          lte: now,
          not: null,
        },
      },
    });

    if (expiredInvoices.length === 0) {
      return NextResponse.json({ message: "No expired escrows to release." });
    }

    const results = [];

    // 2. Process each expired invoice
    for (const invoice of expiredInvoices) {
      try {
        console.log(`Auto-releasing invoice: ${invoice.dodoInvoiceId}`);
        
        // Trigger on-chain release using backend authority
        const txSig = await releaseFunds(
          new PublicKey(invoice.clientWallet),
          new PublicKey(invoice.freelancerWallet),
          invoice.dodoInvoiceId
        );

        // Update database
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "RELEASED" },
        });

        results.push({ id: invoice.dodoInvoiceId, success: true, txSig });
      } catch (err: any) {
        console.error(`Failed to auto-release ${invoice.dodoInvoiceId}:`, err.message);
        results.push({ id: invoice.dodoInvoiceId, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${expiredInvoices.length} invoices.`,
      results,
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
