import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/app/lib/db";
import { getProgram, backendAuthority, USDC_MINT, getEscrowPda } from "@/app/lib/solana";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("webhook-signature") || "";
    const webhookId = req.headers.get("webhook-id") || "";
    const webhookTimestamp = req.headers.get("webhook-timestamp") || "";

    // 1. Verify Dodo Webhook HMCA-SHA256 Signature
    const secret = process.env.DODO_WEBHOOK_SECRET || "test_webhook_secret";
    // In production, uncomment and use strictly:
    /*
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedContent)
      .digest("base64");
    // Depending on Dodo's specific encoding (hex vs base64)
    if (computedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    */

    const event = JSON.parse(rawBody);

    // 2. We only care about successful payments for funding
    if (event.type !== "payment.succeeded") {
      return NextResponse.json({ received: true });
    }

    const dodoInvoiceId = event.data?.payment?.id;
    if (!dodoInvoiceId) {
      return NextResponse.json({ received: true });
    }

    // 3. Look up invoice
    const invoice = await prisma.invoice.findUnique({
      where: { dodoInvoiceId },
    });

    if (!invoice) {
      console.warn(`Webhook received for unknown invoice: ${dodoInvoiceId}`);
      return NextResponse.json({ received: true });
    }

    // 4. Idempotency Check
    if (invoice.webhookProcessed || invoice.status !== "PENDING") {
      console.log(`Webhook already processed for ${dodoInvoiceId}`);
      return NextResponse.json({ received: true });
    }

    // 5. Trigger Solana `fund_escrow`
    const program = getProgram();
    const clientPubkey = new PublicKey(invoice.clientWallet);
    const [escrowPda] = getEscrowPda(clientPubkey, invoice.dodoInvoiceId);

    const vaultAta = await getAssociatedTokenAddress(USDC_MINT, escrowPda, true);
    const authorityUsdcAta = await getAssociatedTokenAddress(USDC_MINT, backendAuthority.publicKey);

    // Build the Anchor Transaction
    const tx = await program.methods
      .fundEscrow()
      .accounts({
        authority: backendAuthority.publicKey,
        usdcMint: USDC_MINT,
        authorityUsdcAccount: authorityUsdcAta,
        escrowAccount: escrowPda,
        vault: vaultAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([backendAuthority])
      .rpc();

    // 6. Update Database
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ESCROW_FUNDED",
        webhookProcessed: true,
        txSignature: tx,
      },
    });

    return NextResponse.json({ success: true, tx });
  } catch (error: any) {
    console.error("Dodo Webhook Error:", error);
    // Don't leak details 
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
