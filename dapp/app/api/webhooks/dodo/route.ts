

import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/app/lib/db";
import { fundEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

function verifyDodoSignature(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const secretBytes = Buffer.from(
      secret.startsWith("whsec_") ? secret.slice(6) : secret,
      "base64"
    );
    const expected = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    const signatures = signatureHeader.split(" ").map(s => s.replace(/^v\d+,/, ""));
    return signatures.some(sig => {
      try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)); }
      catch { return false; }
    });
  } catch { return false; }
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  const isMock = !webhookSecret || webhookSecret === "mock";

  if (!isMock) {
    const sig = req.headers.get("webhook-signature") ?? "";
    const webhookId = req.headers.get("webhook-id") ?? "";
    const timestamp = req.headers.get("webhook-timestamp") ?? "";

    if (!sig || !webhookId || !timestamp) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
      return NextResponse.json({ error: "Request expired" }, { status: 401 });
    }

    if (!verifyDodoSignature(rawBody, webhookId, timestamp, sig, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: any;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }


  const eventType = event.type ?? event.event_type ?? "";
  if (!["payment.succeeded", "checkout.completed", "payment.completed"].includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  const dodoInvoiceId =
    event.data?.metadata?.dodoInvoiceId ??
    event.data?.payload?.metadata?.dodoInvoiceId ??
    event.data?.checkout_session_id ??
    event.data?.session_id ??
    null;

  if (!dodoInvoiceId) {
    return NextResponse.json({ received: true });
  }

  const invoice = await prisma.invoice.findUnique({ where: { dodoInvoiceId } });
  if (!invoice) {
    return NextResponse.json({ received: true });
  }


  if (invoice.webhookProcessed || invoice.status !== "PENDING") {
    return NextResponse.json({ received: true, idempotent: true });
  }


  let txSig: string;
  try {
    txSig = await fundEscrow(new PublicKey(invoice.clientWallet), invoice.dodoInvoiceId);
  } catch (e: any) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Automated funding failed" }, { status: 500 });
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "ESCROW_FUNDED", webhookProcessed: true, txSignature: txSig },
  });

  return NextResponse.json({ success: true, txSig });
}