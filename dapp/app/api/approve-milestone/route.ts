import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { releaseFunds } from "@/app/lib/solana/server";
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

    let releaseSig = "";
    try {
      releaseSig = await releaseFunds(
        new PublicKey(invoice.clientWallet),
        new PublicKey(invoice.freelancerWallet),
        invoice.dodoInvoiceId
      );
      console.log("Final funds released:", releaseSig);
    } catch (e: any) {
      console.error("Release funds failed:", e);
      return NextResponse.json({
        error: "Client approved milestone, but automatic release failed. Admin intervention required.",
        details: e.message
      }, { status: 500 });
    }


    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "RELEASED" },
    });

    return NextResponse.json({ success: true, releaseTxSig: releaseSig });
  } catch (error: any) {
    console.error("Approve milestone error:", error);
    return NextResponse.json({ error: error.message || "Failed to process approval" }, { status: 500 });
  }
}
