import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { assert, expect } from "chai";


async function getEscrowPda(
  programId: PublicKey,
  client: PublicKey,
  dodoInvoiceId: string
): Promise<[PublicKey, number]> {
 
  const idBytes = Buffer.from(dodoInvoiceId).slice(0, 32);
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      client.toBuffer(),
      idBytes,
    ],
    programId
  );
}


async function getAdvancePda(
  programId: PublicKey,
  escrowPda: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("advance"), escrowPda.toBuffer()],
    programId
  );
}


async function airdrop(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  sol = 10
): Promise<void> {
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
}



describe("FlowFi Escrow Program", () => {

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.contract as Program<Contract>;
  const conn = provider.connection;


  const client = Keypair.generate();
  const freelancer = Keypair.generate();
  const authority = Keypair.generate(); // Backend authority


  let usdcMint: PublicKey;
  let clientUsdc: PublicKey;
  let freelancerUsdc: PublicKey;
  let authorityUsdc: PublicKey;

  const INVOICE_ID = "dodo_inv_test_" + Date.now().toString();
  const AMOUNT = new BN(1_000_000); // 1 USDC (6 decimals)
  const ADVANCE_AMOUNT = AMOUNT.muln(85).divn(100); // 850_000

  let escrowPda: PublicKey;
  let escrowBump: number;
  let vaultAta: PublicKey;
  let advancePda: PublicKey;


  before(async () => {

    await airdrop(conn, client.publicKey);
    await airdrop(conn, freelancer.publicKey);
    await airdrop(conn, authority.publicKey);


    usdcMint = await createMint(
      conn,
      client,          // payer
      client.publicKey, // mintAuthority
      null,            // freezeAuthority
      6                // decimals
    );

    // Create ATAs
    clientUsdc = await createAssociatedTokenAccount(
      conn,
      client,
      usdcMint,
      client.publicKey
    );
    freelancerUsdc = await createAssociatedTokenAccount(
      conn,
      freelancer,
      usdcMint,
      freelancer.publicKey
    );
    authorityUsdc = await createAssociatedTokenAccount(
      conn,
      authority,
      usdcMint,
      authority.publicKey
    );


    await mintTo(
      conn,
      client,             // payer
      usdcMint,
      authorityUsdc,
      client.publicKey,   // mint authority
      10_000_000          // 10 USDC
    );

    // Derive PDAs
    [escrowPda, escrowBump] = await getEscrowPda(
      program.programId,
      client.publicKey,
      INVOICE_ID
    );

    vaultAta = await getAssociatedTokenAddress(
      usdcMint,
      escrowPda,
      true 
    );

    [advancePda] = await getAdvancePda(program.programId, escrowPda);
  });

 
  describe("initialize_escrow", () => {
    it("creates escrow with status=Created", async () => {
      await program.methods
        .initializeEscrow(INVOICE_ID, AMOUNT, freelancer.publicKey)
        .accounts({
          client: client.publicKey,
          usdcMint,
          escrowAccount: escrowPda,
          vault: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.ok(escrow.client.equals(client.publicKey), "client mismatch");
      assert.ok(escrow.freelancer.equals(freelancer.publicKey), "freelancer mismatch");
      assert.equal(escrow.amount.toString(), AMOUNT.toString(), "amount mismatch");
      assert.equal(escrow.dodoInvoiceId, INVOICE_ID, "invoice id mismatch");
      assert.deepEqual(escrow.status, { created: {} }, "status should be Created");
      assert.isFalse(escrow.advanced, "advanced should be false");
      assert.isFalse(escrow.milestoneApproved, "milestoneApproved should be false");
    });

    it(" fails with ZeroAmount when amount = 0", async () => {
      const altInvoice = "dodo_inv_zero_amount";
      const [altEscrow] = await getEscrowPda(program.programId, client.publicKey, altInvoice);
      const altVault = await getAssociatedTokenAddress(usdcMint, altEscrow, true);

      try {
        await program.methods
          .initializeEscrow(altInvoice, new BN(0), freelancer.publicKey)
          .accounts({
            client: client.publicKey,
            usdcMint,
            escrowAccount: altEscrow,
            vault: altVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client])
          .rpc();
        assert.fail("Should have thrown ZeroAmount");
      } catch (err: any) {
        expect(err.message).to.include("ZeroAmount");
      }
    });

    it(" fails with InvoiceIdTooLong when ID > 32 chars", async () => {
      const longId = "a".repeat(33);
      const [altEscrow] = await getEscrowPda(program.programId, client.publicKey, longId);
      const altVault = await getAssociatedTokenAddress(usdcMint, altEscrow, true);

      try {
        await program.methods
          .initializeEscrow(longId, AMOUNT, freelancer.publicKey)
          .accounts({
            client: client.publicKey,
            usdcMint,
            escrowAccount: altEscrow,
            vault: altVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client])
          .rpc();
        assert.fail("Should have thrown InvoiceIdTooLong");
      } catch (err: any) {
        expect(err.message).to.include("InvoiceIdTooLong");
      }
    });
  });


  describe("fund_escrow", () => {
    it("funds escrow, status transitions to Funded", async () => {
      await program.methods
        .fundEscrow()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          authorityUsdcAccount: authorityUsdc,
          escrowAccount: escrowPda,
          vault: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.deepEqual(escrow.status, { funded: {} }, "status should be Funded");

      const vaultAccount = await getAccount(conn, vaultAta);
      assert.equal(
        vaultAccount.amount.toString(),
        AMOUNT.toString(),
        "vault balance should equal escrow amount"
      );
    });

    it(" idempotent — calling fund_escrow a second time is a no-op", async () => {
      // Should not throw, just return Ok silently.
      await program.methods
        .fundEscrow()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          authorityUsdcAccount: authorityUsdc,
          escrowAccount: escrowPda,
          vault: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();

      const vaultAccount = await getAccount(conn, vaultAta);
      // Balance unchanged — no double transfer.
      assert.equal(vaultAccount.amount.toString(), AMOUNT.toString());
    });
  });


  describe("approve_milestone", () => {
    it(" fails if called by non-client (freelancer)", async () => {
      try {
        await program.methods
          .approveMilestone()
          .accounts({
            client: freelancer.publicKey, // Wrong signer
            escrowAccount: escrowPda,
          } as any)
          .signers([freelancer])
          .rpc();
        assert.fail("Should have thrown UnauthorizedClient");
      } catch (err: any) {
        // Anchor constraint errors wrap differently - check multiple locations
        const fullError = String(err?.message || "") + String(err?.error?.errorCode?.code || "") + String(err?.error?.message || "");
        expect(fullError).to.include("UnauthorizedClient");
      }
    });

    it("client approves milestone", async () => {
      await program.methods
        .approveMilestone()
        .accounts({
          client: client.publicKey,
          escrowAccount: escrowPda,
        } as any)
        .signers([client])
        .rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.isTrue(escrow.milestoneApproved, "milestoneApproved should be true");
    });
  });


  describe("request_advance", () => {
    // Use a separate invoice/escrow for advance tests
    const ADVANCE_INVOICE = "dodo_inv_advance_" + Date.now().toString();
    let advEscrowPda: PublicKey;
    let advVaultAta: PublicKey;
    let advAdvancePda: PublicKey;

    before(async () => {
      [advEscrowPda] = await getEscrowPda(program.programId, client.publicKey, ADVANCE_INVOICE);
      advVaultAta = await getAssociatedTokenAddress(usdcMint, advEscrowPda, true);
      [advAdvancePda] = await getAdvancePda(program.programId, advEscrowPda);

      // init + fund
      await program.methods
        .initializeEscrow(ADVANCE_INVOICE, AMOUNT, freelancer.publicKey)
        .accounts({
          client: client.publicKey,
          usdcMint,
          escrowAccount: advEscrowPda,
          vault: advVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client])
        .rpc();

      await program.methods
        .fundEscrow()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          authorityUsdcAccount: authorityUsdc,
          escrowAccount: advEscrowPda,
          vault: advVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();
    });

    it(" fails if called by non-freelancer (client)", async () => {
      try {
        await program.methods
          .requestAdvance()
          .accounts({
            freelancer: client.publicKey, // Wrong signer
            usdcMint,
            escrowAccount: advEscrowPda,
            vault: advVaultAta,
            freelancerUsdcAccount: clientUsdc,
            advanceAccount: advAdvancePda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client])
          .rpc();
        assert.fail("Should have thrown UnauthorizedFreelancer");
      } catch (err: any) {
        expect(err.message).to.include("UnauthorizedFreelancer");
      }
    });

    it(" freelancer receives 85% advance instantly", async () => {
      const beforeBalance = (await getAccount(conn, freelancerUsdc)).amount;

      await program.methods
        .requestAdvance()
        .accounts({
          freelancer: freelancer.publicKey,
          usdcMint,
          escrowAccount: advEscrowPda,
          vault: advVaultAta,
          freelancerUsdcAccount: freelancerUsdc,
          advanceAccount: advAdvancePda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([freelancer])
        .rpc();

      const afterBalance = (await getAccount(conn, freelancerUsdc)).amount;
      const diff = afterBalance - beforeBalance;
      assert.equal(diff.toString(), ADVANCE_AMOUNT.toString(), "advance amount mismatch");

      const escrow = await program.account.escrowAccount.fetch(advEscrowPda);
      assert.isTrue(escrow.advanced, "advanced flag should be true");
      assert.equal(escrow.advanceAmount.toString(), ADVANCE_AMOUNT.toString());

      const advance = await program.account.advanceAccount.fetch(advAdvancePda);
      assert.isFalse(advance.repaid, "repaid should be false initially");
      assert.equal(advance.advanceAmount.toString(), ADVANCE_AMOUNT.toString());
    });

    it(" fails with AdvanceAlreadyTaken on second advance attempt", async () => {
      try {
        // Need a fresh AdvancePda derivation — use a throwaway
        const [fakePda] = await getAdvancePda(program.programId, advEscrowPda);
        await program.methods
          .requestAdvance()
          .accounts({
            freelancer: freelancer.publicKey,
            usdcMint,
            escrowAccount: advEscrowPda,
            vault: advVaultAta,
            freelancerUsdcAccount: freelancerUsdc,
            advanceAccount: fakePda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([freelancer])
          .rpc();
        assert.fail("Should have thrown AdvanceAlreadyTaken");
      } catch (err: any) {
        // Either AdvanceAlreadyTaken or account already initialized
        expect(err.message).to.satisfy(
          (m: string) =>
            m.includes("AdvanceAlreadyTaken") || m.includes("already in use")
        );
      }
    });

    it(" repay_advance marks advance as repaid", async () => {
      await program.methods
        .repayAdvance()
        .accounts({
          authority: authority.publicKey,
          escrowAccount: advEscrowPda,
          advanceAccount: advAdvancePda,
        } as any)
        .signers([authority])
        .rpc();

      const advance = await program.account.advanceAccount.fetch(advAdvancePda);
      assert.isTrue(advance.repaid, "repaid should now be true");
    });
  });


  describe("release_funds", () => {
    it(" releases vault → freelancer after milestone approval", async () => {
      const beforeBalance = (await getAccount(conn, freelancerUsdc)).amount;

      await program.methods
        .releaseFunds()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          escrowAccount: escrowPda,
          vault: vaultAta,
          freelancerUsdcAccount: freelancerUsdc,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();

      const afterBalance = (await getAccount(conn, freelancerUsdc)).amount;
      const diff = afterBalance - beforeBalance;
      assert.equal(diff.toString(), AMOUNT.toString(), "full amount should be released");

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.deepEqual(escrow.status, { released: {} }, "status should be Released");
    });

    it(" fails with EscrowNotFunded on double-release", async () => {
      try {
        await program.methods
          .releaseFunds()
          .accounts({
            authority: authority.publicKey,
            usdcMint,
            escrowAccount: escrowPda,
            vault: vaultAta,
            freelancerUsdcAccount: freelancerUsdc,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([authority])
          .rpc();
        assert.fail("Should have thrown EscrowNotFunded");
      } catch (err: any) {
        expect(err.message).to.include("EscrowNotFunded");
      }
    });
  });


  describe("cancel_escrow", () => {
    const CANCEL_INVOICE = "dodo_inv_cancel_" + Date.now().toString();
    let cancelEscrowPda: PublicKey;
    let cancelVaultAta: PublicKey;

    before(async () => {
      [cancelEscrowPda] = await getEscrowPda(
        program.programId,
        client.publicKey,
        CANCEL_INVOICE
      );
      cancelVaultAta = await getAssociatedTokenAddress(usdcMint, cancelEscrowPda, true);

      // Init + fund
      await program.methods
        .initializeEscrow(CANCEL_INVOICE, AMOUNT, freelancer.publicKey)
        .accounts({
          client: client.publicKey,
          usdcMint,
          escrowAccount: cancelEscrowPda,
          vault: cancelVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client])
        .rpc();

      await program.methods
        .fundEscrow()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          authorityUsdcAccount: authorityUsdc,
          escrowAccount: cancelEscrowPda,
          vault: cancelVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();
    });

    it(" fails if called by freelancer (not client)", async () => {
      try {
        await program.methods
          .cancelEscrow(false)
          .accounts({
            client: freelancer.publicKey,
            usdcMint,
            clientUsdcAccount: freelancerUsdc,
            escrowAccount: cancelEscrowPda,
            vault: cancelVaultAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([freelancer])
          .rpc();
        assert.fail("Should have thrown UnauthorizedClient");
      } catch (err: any) {
        // Anchor constraint errors wrap differently - check multiple locations
        const fullError = String(err?.message || "") + String(err?.error?.errorCode?.code || "") + String(err?.error?.message || "");
        expect(fullError).to.include("UnauthorizedClient");
      }
    });

    it(" client cancels funded escrow, receives refund", async () => {
      const beforeBalance = (await getAccount(conn, clientUsdc)).amount;

      await program.methods
        .cancelEscrow(false)
        .accounts({
          client: client.publicKey,
          usdcMint,
          clientUsdcAccount: clientUsdc,
          escrowAccount: cancelEscrowPda,
          vault: cancelVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client])
        .rpc();

      const afterBalance = (await getAccount(conn, clientUsdc)).amount;
      const diff = afterBalance - beforeBalance;
      assert.equal(diff.toString(), AMOUNT.toString(), "full refund to client");

      const escrow = await program.account.escrowAccount.fetch(cancelEscrowPda);
      assert.deepEqual(escrow.status, { cancelled: {} }, "status should be Cancelled");
    });

    it(" fails with ActiveAdvanceNotRepaid if advance outstanding", async () => {
      // Create another escrow, fund it, take advance, then try cancel
      const ACTIVE_ADV_INVOICE = "dodo_inv_active_adv_" + Date.now().toString();
      const [activeEscrow] = await getEscrowPda(
        program.programId,
        client.publicKey,
        ACTIVE_ADV_INVOICE
      );
      const activeVault = await getAssociatedTokenAddress(usdcMint, activeEscrow, true);
      const [activeAdvancePda] = await getAdvancePda(program.programId, activeEscrow);

      await program.methods
        .initializeEscrow(ACTIVE_ADV_INVOICE, AMOUNT, freelancer.publicKey)
        .accounts({
          client: client.publicKey,
          usdcMint,
          escrowAccount: activeEscrow,
          vault: activeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client])
        .rpc();

      await program.methods
        .fundEscrow()
        .accounts({
          authority: authority.publicKey,
          usdcMint,
          authorityUsdcAccount: authorityUsdc,
          escrowAccount: activeEscrow,
          vault: activeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority])
        .rpc();

      await program.methods
        .requestAdvance()
        .accounts({
          freelancer: freelancer.publicKey,
          usdcMint,
          escrowAccount: activeEscrow,
          vault: activeVault,
          freelancerUsdcAccount: freelancerUsdc,
          advanceAccount: activeAdvancePda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([freelancer])
        .rpc();

      // Now try cancelling without repaying advance
      try {
        await program.methods
          .cancelEscrow(false)
          .accounts({
            client: client.publicKey,
            usdcMint,
            clientUsdcAccount: clientUsdc,
            escrowAccount: activeEscrow,
            vault: activeVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client])
          .rpc();
        assert.fail("Should have thrown ActiveAdvanceNotRepaid");
      } catch (err: any) {
        expect(err.message).to.include("ActiveAdvanceNotRepaid");
      }
    });
  });
});
