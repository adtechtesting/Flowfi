import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fetchEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const { dodoInvoiceId, txSignature } = await req.json();

    if (!dodoInvoiceId || !txSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { dodoInvoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }


    try {
      const clientWallet = new PublicKey(invoice.clientWallet);
      const onChainEscrow = await fetchEscrow(clientWallet, dodoInvoiceId);

      if (!onChainEscrow || !onChainEscrow.advanced) {
        console.warn(`Advance not reflected on chain yet for: ${dodoInvoiceId}`);

      }
    } catch (e) {
      console.error("Could not fetch on-chain state for advance check", e);
    }


    const updatedInvoice = await prisma.invoice.update({
      where: { dodoInvoiceId },
      data: {
        status: "ADVANCED",
        advanceTxSig: txSignature
      },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error("Advance Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync advance request" },
      { status: 500 }
    );
  }
}
