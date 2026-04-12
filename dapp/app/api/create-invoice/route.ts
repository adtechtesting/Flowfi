import { NextResponse } from "next/server";
import { dodo } from "@/app/lib/dodo";
import prisma from "@/app/lib/db";
import { backendAuthority } from "@/app/lib/solana/server";
import { getEscrowPda } from "@/app/lib/solana/constants";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, jobTitle, jobDescription, clientWallet, freelancerWallet } = body;

    if (!amount || !clientWallet || !freelancerWallet || !jobTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      new PublicKey(clientWallet);
      new PublicKey(freelancerWallet);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/client?success=true`;

    let dodoInvoiceId: string;
    let dodoPaymentUrl: string;

    if (dodo) {

      const productId = process.env.DODO_PRODUCT_ID;
      if (!productId) {
        return NextResponse.json(
          { error: "DODO_PRODUCT_ID not set" },
          { status: 500 }
        );
      }
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: returnUrl,
      });
      dodoInvoiceId = session.session_id;
      dodoPaymentUrl = session.checkout_url || "";
    } else {

      dodoInvoiceId = "mock_" + Date.now().toString();
      dodoPaymentUrl = `${returnUrl}&mock=true&invoiceId=${dodoInvoiceId}`;
    }

    const clientPubkey = new PublicKey(clientWallet);
    const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);

    const invoice = await prisma.invoice.create({
      data: {
        dodoInvoiceId,
        dodoPaymentUrl,
        escrowPubkey: escrowPda.toString(),
        clientWallet,
        freelancerWallet,
        amount,
        jobTitle,
        jobDescription: jobDescription || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      invoiceId: invoice.id,
      dodoInvoiceId,
      paymentUrl: dodoPaymentUrl,
      escrowPubkey: escrowPda.toString(),
      authorityPubkey: backendAuthority.publicKey.toString(),
      mockMode: !dodo,
    });

  } catch (error: any) {
    console.error("Create Invoice Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}