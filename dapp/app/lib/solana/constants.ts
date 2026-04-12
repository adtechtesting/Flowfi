import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import IDL from "../anchor/flowfi_escrow.json";


export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "26KdmFpYTmAauE1JT3sUr1AbUeN6521tT7HWaZx8J2JJ"
);


export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);


export const ESCROW_IDL = IDL;


export function getEscrowPda(
  client: PublicKey,
  dodoInvoiceId: string
): [PublicKey, number] {
  const idBytes = Buffer.from(dodoInvoiceId).subarray(0, 32);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), client.toBuffer(), idBytes],
    PROGRAM_ID
  );
}


export function getAdvancePda(escrowPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("advance"), escrowPda.toBuffer()],
    PROGRAM_ID
  );
}


export async function getVaultAta(escrowPda: PublicKey): Promise<PublicKey> {
  return getAssociatedTokenAddress(USDC_MINT, escrowPda, true);
}


export async function getUserUsdcAta(wallet: PublicKey): Promise<PublicKey> {
  return getAssociatedTokenAddress(USDC_MINT, wallet, false);
}
