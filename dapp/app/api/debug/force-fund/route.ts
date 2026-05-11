import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fundEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "PENDING") {
      return NextResponse.json({ error: "Job is already funded or cancelled" }, { status: 400 });
    }

    const txSig = await fundEscrow(new PublicKey(invoice.clientWallet), invoice.dodoInvoiceId);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "ESCROW_FUNDED", webhookProcessed: true, txSignature: txSig },
    });

    return NextResponse.json({ success: true, txSig });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to force fund" }, { status: 500 });
  }
}
