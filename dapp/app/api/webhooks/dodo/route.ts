

import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/app/lib/db";
import { fundEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";


function verifyDodoSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  signature: string,
  secret: string
): boolean {
  
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", Buffer.from(secret, "base64"))
    .update(signedContent)
    .digest("base64");

 
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}


export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    const isMockMode = !webhookSecret || webhookSecret === "mock";

  
    if (!isMockMode) {
      const signature = req.headers.get("webhook-signature") ?? "";
      const webhookId = req.headers.get("webhook-id") ?? "";
      const webhookTimestamp = req.headers.get("webhook-timestamp") ?? "";

      if (!signature || !webhookId || !webhookTimestamp) {
        return NextResponse.json({ error: "Missing webhook headers" }, { status: 401 });
      }

      const valid = verifyDodoSignature(
        rawBody, webhookId, webhookTimestamp, signature, webhookSecret!
      );

      if (!valid) {
        console.error("Webhook signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("WEBHOOK RUNNING IN MOCK MODE — signature verification skipped");
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

  
    const eventType = event.type ?? event.event_type;
    if (eventType !== "payment.succeeded" && eventType !== "checkout.completed") {
      return NextResponse.json({ received: true, skipped: eventType });
    }

 
    const dodoInvoiceId =
      event.data?.checkout_session_id ??
      event.data?.session_id ??
      event.data?.payment?.checkout_session_id;

    if (!dodoInvoiceId) {
      console.warn("Webhook missing dodoInvoiceId:", JSON.stringify(event.data));
      return NextResponse.json({ received: true });
    }

    
    const invoice = await prisma.invoice.findUnique({
      where: { dodoInvoiceId },
    });

    if (!invoice) {
      console.warn(`Webhook for unknown invoice: ${dodoInvoiceId}`);
      return NextResponse.json({ received: true });
    }

    
    if (invoice.webhookProcessed || invoice.status !== "PENDING") {
      console.log(`Already processed: ${dodoInvoiceId}`);
      return NextResponse.json({ received: true, idempotent: true });
    }


    const clientPubkey = new PublicKey(invoice.clientWallet);
    const txSig = await fundEscrow(clientPubkey, invoice.dodoInvoiceId);

    console.log(`Escrow funded: ${txSig} for invoice ${dodoInvoiceId}`);


    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ESCROW_FUNDED",
        webhookProcessed: true,
        txSignature: txSig,
      },
    });

    return NextResponse.json({ success: true, txSig });

  } catch (error: any) {
    console.error("Webhook handler error:", error);
   
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
