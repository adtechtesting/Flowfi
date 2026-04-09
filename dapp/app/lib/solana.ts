import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { FlowfiEscrow } from "./anchor/flowfi_escrow";
import IDL from "./anchor/flowfi_escrow.json";
import bs58 from "bs58";


const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";


const getBackendKeypair = () => {
  const secretKey = process.env.BACKEND_AUTHORITY_SECRET_KEY;
  if (!secretKey) {
    console.warn("BACKEND_AUTHORITY_SECRET_KEY not set. Using random keypair for testing.");
    return Keypair.generate();
  }
  return Keypair.fromSecretKey(bs58.decode(secretKey));
};

export const backendAuthority = getBackendKeypair();
export const connection = new Connection(RPC_URL, "confirmed");
export const wallet = new Wallet(backendAuthority);

export const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});


export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || IDL.address
);


export const getProgram = () => {
  return new Program(IDL as any, provider) as unknown as Program<FlowfiEscrow>;
};

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const getEscrowPda = (client: PublicKey, dodoInvoiceId: string) => {
  const idBytes = Buffer.from(dodoInvoiceId).subarray(0, 32);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), client.toBuffer(), idBytes],
    PROGRAM_ID
  );
};

export const getAdvancePda = (escrowPda: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("advance"), escrowPda.toBuffer()],
    PROGRAM_ID
  );
};
