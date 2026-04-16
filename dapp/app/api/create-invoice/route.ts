
import { NextResponse } from "next/server";
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

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";


    const dodoInvoiceId = "inv_" + Date.now().toString().slice(-10);
    const returnUrl = `${baseUrl}/client?success=true&invoiceId=${dodoInvoiceId}`;

    let dodoPaymentUrl: string;

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
    const dodoProductId = process.env.DODO_PRODUCT_ID;
    const isMock = !dodoApiKey || dodoApiKey === "mock";

    if (!isMock && dodoProductId) {
      const DodoPayments = (await import("dodopayments")).default;
      const dodo = new DodoPayments({
        bearerToken: dodoApiKey,
        environment: "test_mode",
      });

      const session = await dodo.checkoutSessions.create({
        product_cart: [{
          product_id: dodoProductId,
          quantity: 1,
          amount: Number(amount)
        }],
        return_url: returnUrl,
        metadata: {
          dodoInvoiceId,
          clientWallet,
          freelancerWallet,
          amountCents: String(amount),
        },
      });

      dodoPaymentUrl = session.checkout_url ?? returnUrl;
    } else {
      dodoPaymentUrl = `${returnUrl}&mock=true`;
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
      mock: isMock,
    });

  } catch (error: any) {
    console.error("create-invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}