import { NextResponse } from "next/server";
import { backendAuthority } from "@/app/lib/solana/server";

export async function GET() {
  return NextResponse.json({
    treasuryWallet: backendAuthority.publicKey.toString()
  });
}
