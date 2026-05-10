
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,

} from "@solana/spl-token";
import { FlowfiEscrow } from "../anchor/flowfi_escrow";
import {
  ESCROW_IDL,
  PROGRAM_ID,
  USDC_MINT,
  getEscrowPda,
  getAdvancePda,
} from "./constants";


let _connection: Connection | null = null;

export const getClientConnection = (): Connection => {
  if (!_connection) {
    _connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com",
      { commitment: "confirmed" }
    );
  }
  return _connection;
};


export const getClientProgram = (
  connection: Connection,
  wallet: any
): Program<FlowfiEscrow> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(ESCROW_IDL as any, provider) as unknown as Program<FlowfiEscrow>;
};


export const buildInitializeEscrowTx = async (
  connection: Connection,
  wallet: any,
  dodoInvoiceId: string,
  amountUsd: number,
  clientPubkey: PublicKey,
  freelancerPubkey: PublicKey,
  authorityPubkey: PublicKey
) => {
  const program = getClientProgram(connection, wallet);


  const amountLamports = new BN(Math.round(amountUsd * 1_000_000));

  const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);


  const vault = await getAssociatedTokenAddress(
    USDC_MINT,
    escrowPda,
    true
  );

  return program.methods
    .initializeEscrow(
      dodoInvoiceId,
      amountLamports,
      freelancerPubkey,
      authorityPubkey
    )
    .accounts({
      client: clientPubkey,
      usdcMint: USDC_MINT,
      escrowAccount: escrowPda,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();
};


export const buildRequestAdvanceTx = async (
  connection: Connection,
  wallet: any,
  dodoInvoiceId: string,
  clientPubkey: PublicKey,
  freelancerPubkey: PublicKey
) => {
  const program = getClientProgram(connection, wallet);

  const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);
  const [advancePda] = getAdvancePda(escrowPda);

  const vault = await getAssociatedTokenAddress(USDC_MINT, escrowPda, true);
  const freelancerUsdc = await getAssociatedTokenAddress(
    USDC_MINT,
    freelancerPubkey,
    false
  );

  const tx = await program.methods
    .requestAdvance()
    .accounts({
      freelancer: freelancerPubkey,
      usdcMint: USDC_MINT,
      escrowAccount: escrowPda,
      vault,
      freelancerUsdcAccount: freelancerUsdc,
      advanceAccount: advancePda,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();


  const ataInfo = await connection.getAccountInfo(freelancerUsdc);
  if (!ataInfo) {
    const { createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");
    const initAtaIx = createAssociatedTokenAccountInstruction(
      freelancerPubkey,
      freelancerUsdc,
      freelancerPubkey,
      USDC_MINT
    );
    tx.instructions.unshift(initAtaIx);
  }

  return tx;
};


export const buildApproveMilestoneTx = async (
  connection: Connection,
  wallet: any,
  dodoInvoiceId: string,
  clientPubkey: PublicKey
) => {
  const program = getClientProgram(connection, wallet);
  const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);

  return program.methods
    .approveMilestone()
    .accounts({
      client: clientPubkey,
      escrowAccount: escrowPda,
    } as any)
    .transaction();
};


export const buildCancelEscrowTx = async (
  connection: Connection,
  wallet: any,
  dodoInvoiceId: string,
  clientPubkey: PublicKey,
  hasActiveAdvance: boolean
) => {
  const program = getClientProgram(connection, wallet);

  const [escrowPda] = getEscrowPda(clientPubkey, dodoInvoiceId);
  const [advancePda] = getAdvancePda(escrowPda);
  const vault = await getAssociatedTokenAddress(USDC_MINT, escrowPda, true);
  const clientUsdc = await getAssociatedTokenAddress(USDC_MINT, clientPubkey, false);

  return program.methods
    .cancelEscrow()
    .accounts({
      client: clientPubkey,
      usdcMint: USDC_MINT,
      clientUsdcAccount: clientUsdc,
      escrowAccount: escrowPda,
      vault,

      advanceAccount: hasActiveAdvance ? advancePda : null,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .transaction();
};


export const signAndSendTx = async (
  connection: Connection,
  wallet: any,
  tx: any
): Promise<string> => {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey ?? wallet.account?.publicKey;

  const signed = await wallet.signTransaction(tx);
  const txId = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction(
    { signature: txId, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return txId;
};

export const subscribeToEscrow = (
  connection: Connection,
  escrowPda: PublicKey,
  callback: () => void
) => {
  return connection.onAccountChange(
    escrowPda,
    () => {
      callback();
    },
    "confirmed"
  );
};
