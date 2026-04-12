
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fundEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: Request) {

    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    try {
        const { dodoInvoiceId } = await req.json();

        if (!dodoInvoiceId) {
            return NextResponse.json({ error: "dodoInvoiceId required" }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { dodoInvoiceId },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.webhookProcessed) {
            return NextResponse.json({ error: "Already funded", idempotent: true });
        }


        const clientPubkey = new PublicKey(invoice.clientWallet);
        const txSig = await fundEscrow(clientPubkey, invoice.dodoInvoiceId);


        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                status: "ESCROW_FUNDED",
                webhookProcessed: true,
                txSignature: txSig,
            },
        });

        return NextResponse.json({
            success: true,
            txSig,
            message: "Escrow funded via mock webhook",
        });

    } catch (error: any) {
        console.error("Mock webhook error:", error);
        return NextResponse.json(
            { error: error.message || "Mock webhook failed" },
            { status: 500 }
        );
    }
}