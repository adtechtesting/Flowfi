import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fetchEscrow } from "@/app/lib/solana/server";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientWallet = searchParams.get("clientWallet");
    const freelancerWallet = searchParams.get("freelancerWallet");

    const where = clientWallet
      ? { clientWallet }
      : freelancerWallet
        ? { freelancerWallet }
        : null;

    if (!where) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const serializeBigInts = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (obj.toString && obj.words) return obj.toString();
      if (typeof obj === "object") {
        if (Array.isArray(obj)) return obj.map(serializeBigInts);
        const newObj: any = {};
        for (const [key, val] of Object.entries(obj)) {
          newObj[key] = serializeBigInts(val);
        }
        return newObj;
      }
      return obj;
    };

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const onChain = await fetchEscrow(new PublicKey(inv.clientWallet), inv.dodoInvoiceId);
        return { ...inv, onChain: serializeBigInts(onChain) };
      })
    );

    return NextResponse.json({ jobs: enriched });

  } catch (error: any) {
    console.error("GET invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
