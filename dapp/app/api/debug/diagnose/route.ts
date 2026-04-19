import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { fetchEscrow } from "@/app/lib/solana/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { getEscrowPda, getVaultAta } from "@/app/lib/solana/constants";

export async function GET() {
  const results = [];
  try {
    const jobs = await prisma.invoice.findMany({
      where: { status: { in: ["ESCROW_FUNDED", "PENDING"] } },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    for (const job of jobs) {
      let jobResult: any = { id: job.id, title: job.jobTitle, dbStatus: job.status, dodoId: job.dodoInvoiceId };
      try {
        const clientWallet = new PublicKey(job.clientWallet);
        const [escrowPda] = getEscrowPda(clientWallet, job.dodoInvoiceId);
        jobResult.escrowPda = escrowPda.toString();

        const onChainData = await fetchEscrow(clientWallet, job.dodoInvoiceId);
        if (!onChainData) {
          jobResult.onChain = "NOT FOUND";
          results.push(jobResult);
          continue;
        }

        const statusKey = Object.keys(onChainData.status)[0];
        jobResult.onChainStatus = statusKey;
        jobResult.advanced = onChainData.advanced;
        jobResult.amount = onChainData.amount.toString();

        const vaultTokenAddress = await getVaultAta(escrowPda);
        jobResult.vaultAta = vaultTokenAddress.toString();
        try {
          const vaultBal = await connection.getTokenAccountBalance(vaultTokenAddress);
          jobResult.vaultBalance = vaultBal.value.uiAmount;
        } catch (e) {
          jobResult.vaultBalance = "NOT INITIALIZED or ERRROR";
        }
      } catch (e: any) {
        jobResult.error = e.message;
      }
      results.push(jobResult);
    }
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
