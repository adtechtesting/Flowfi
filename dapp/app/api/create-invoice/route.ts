import { NextResponse } from "next/server";
import { dodo } from "@/app/lib/dodo";
import prisma from "@/app/lib/db";
import { getEscrowPda, PROGRAM_ID } from "@/app/lib/solana";
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, jobTitle, jobDescription, clientWallet, freelancerWallet } = body;

    // Validate inputs
    if (!amount || !clientWallet || !freelancerWallet || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Since Dodo Payments requires a product, for MVP we assume 
    // there's a base product configured in dashboard, but here we 
    // just pass it. (Alternatively, if amount is dynamic, Dodo might need server-side custom prices)
    const productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || "prod_dummy";

    // Create Dodo Checkout Session
    const session = await dodo.checkoutSessions.create({
      productCart: [{ productId, quantity: 1 }],
      allowedPaymentMethodTypes: ["crypto", "credit", "debit"],
      returnUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/client?success=true`,
    });

    const dodoInvoiceId = session.id;

    // Calculate the Solana PDA for Escrow
    const clientPubkey = new PublicKey(clientWallet);
    const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);

    // Save to Database
    const invoice = await prisma.invoice.create({
      data: {
        dodoInvoiceId,
        dodoPaymentUrl: session.checkoutUrl,
        escrowPubkey: escrowPda.toString(),
        clientWallet,
        freelancerWallet,
        amount,
        jobTitle,
        jobDescription,
      },
    });

    return NextResponse.json({
      invoiceId: invoice.id,
      dodoInvoiceId,
      paymentUrl: session.checkoutUrl,
      escrowPubkey: escrowPda.toString(),
    });
  } catch (error: any) {
    console.error("Create Invoice Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
