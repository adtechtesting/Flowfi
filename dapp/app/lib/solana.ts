
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AnchorProvider,
  Program,
  BN,
} from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

import IDL from "./anchor/flowfi_escrow.json";
import { FlowfiEscrow } from "./anchor/flowfi_escrow";



function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}


const RPC_URL = requireEnv("RPC_URL");

export const connection = new Connection(RPC_URL, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60_000,
});


function loadBackendKeypair(): Keypair {
  const raw = requireEnv("BACKEND_AUTHORITY_SECRET_KEY");
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    throw new Error(
      "BACKEND_AUTHORITY_SECRET_KEY is set but could not be decoded. " +
      "Expected a base58-encoded 64-byte secret key."
    );
  }
}

export const backendAuthority: Keypair = loadBackendKeypair();


class NodeWallet {
  constructor(readonly payer: Keypair) { }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    } else {
      (tx as VersionedTransaction).sign([this.payer]);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return txs.map((tx) => {
      if (tx instanceof Transaction) {
        tx.partialSign(this.payer);
      } else {
        (tx as VersionedTransaction).sign([this.payer]);
      }
      return tx;
    });
  }
}


const provider = new AnchorProvider(
  connection,
  new NodeWallet(backendAuthority),
  { commitment: "confirmed", skipPreflight: false }
);

export const program = new Program(
  IDL as any,
  provider
) as unknown as Program<FlowfiEscrow>;


export const PROGRAM_ID = program.programId;


export const USDC_MINT = new PublicKey(requireEnv("USDC_MINT_ADDRESS"));

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


export async function fundEscrow(
  clientWallet: PublicKey,
  dodoInvoiceId: string
): Promise<string> {
  const [escrowPda] = getEscrowPda(clientWallet, dodoInvoiceId);
  const vault = await getVaultAta(escrowPda);
  const authorityUsdc = await getUserUsdcAta(backendAuthority.publicKey);

  const sig = await program.methods
    .fundEscrow()
    .accounts({
      authority: backendAuthority.publicKey,
      usdcMint: USDC_MINT,
      authorityUsdcAccount: authorityUsdc,
      escrowAccount: escrowPda,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return sig;
}


export async function releaseFunds(
  clientWallet: PublicKey,
  freelancerWallet: PublicKey,
  dodoInvoiceId: string
): Promise<string> {
  const [escrowPda] = getEscrowPda(clientWallet, dodoInvoiceId);
  const vault = await getVaultAta(escrowPda);
  const freelancerUsdc = await getUserUsdcAta(freelancerWallet);

  const sig = await program.methods
    .releaseFunds()
    .accounts({
      authority: backendAuthority.publicKey,
      usdcMint: USDC_MINT,
      escrowAccount: escrowPda,
      vault,
      freelancerUsdcAccount: freelancerUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return sig;
}


export async function repayAdvance(
  clientWallet: PublicKey,
  dodoInvoiceId: string
): Promise<string> {
  const [escrowPda] = getEscrowPda(clientWallet, dodoInvoiceId);
  const [advancePda] = getAdvancePda(escrowPda);

  const sig = await program.methods
    .repayAdvance()
    .accounts({
      authority: backendAuthority.publicKey,
      escrowAccount: escrowPda,
      advanceAccount: advancePda,
    } as any)
    .rpc();

  return sig;
}


export async function fetchEscrow(
  clientWallet: PublicKey,
  dodoInvoiceId: string
) {
  const [escrowPda] = getEscrowPda(clientWallet, dodoInvoiceId);
  try {
    return await program.account.escrowAccount.fetch(escrowPda);
  } catch {
    return null;
  }
}


export async function fetchAdvance(escrowPda: PublicKey) {
  const [advancePda] = getAdvancePda(escrowPda);
  try {
    return await program.account.advanceAccount.fetch(advancePda);
  } catch {
    return null;
  }
}