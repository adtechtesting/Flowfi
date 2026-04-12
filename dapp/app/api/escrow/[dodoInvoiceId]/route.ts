import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fetchEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: Request, { params }: { params: { dodoInvoiceId: string } }) {
  const { dodoInvoiceId } = params;
  if (!dodoInvoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { dodoInvoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }


    let onChainEscrow = null;
    let advanceEligible = false;

    try {
      const clientWallet = new PublicKey(invoice.clientWallet);
      onChainEscrow = await fetchEscrow(clientWallet, dodoInvoiceId);


      if (onChainEscrow && Object.keys(onChainEscrow.status)[0] === "funded" && !onChainEscrow.advanced) {
        advanceEligible = true;
      }
    } catch (e) {
      console.error("Failed to fetch on-chain escrow:", e);
    }

    return NextResponse.json({
      invoice,
      onChainEscrow,
      advanceEligible
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch escrow" }, { status: 500 });
  }
}
