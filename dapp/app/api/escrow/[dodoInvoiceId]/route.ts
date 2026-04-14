import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fetchEscrow } from "@/app/lib/solana/server";
import { getEscrowPda } from "@/app/lib/solana/constants";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: Request, { params }: { params: Promise<{ dodoInvoiceId: string }> }) {
  const { dodoInvoiceId } = await params;
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
    const clientWallet = new PublicKey(invoice.clientWallet);
    const [escrowPda] = getEscrowPda(clientWallet, dodoInvoiceId);
    let onChainError = null;

    try {
      onChainEscrow = await fetchEscrow(clientWallet, dodoInvoiceId);

      if (onChainEscrow) {

        const statusKey = Object.keys(onChainEscrow.status)[0].toLowerCase();


        if (statusKey === "funded" && !onChainEscrow.advanced) {
          advanceEligible = true;
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch on-chain escrow:", e);
      onChainError = e.message || "Unknown on-chain error";
    }

    return NextResponse.json({
      invoice,
      onChainEscrow,
      onChainError,
      advanceEligible,
      escrowPubkey: escrowPda.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch escrow" }, { status: 500 });
  }
}
