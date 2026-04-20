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
        // Not reflected yet
      }
    } catch (e) {
      // Background check failed - intentionally silent
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
    return NextResponse.json(
      { error: "Failed to sync advance request" },
      { status: 500 }
    );
  }
}
