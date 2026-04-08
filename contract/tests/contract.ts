import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { FlowfiEscrow } from "../target/types/flowfi_escrow";
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



function getEscrowPda(
  programId: PublicKey,
  client: PublicKey,
  dodoInvoiceId: string
): [PublicKey, number] {
  const idBytes = Buffer.from(dodoInvoiceId).slice(0, 32);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), client.toBuffer(), idBytes],
    programId
  );
}

function getAdvancePda(
  programId: PublicKey,
  escrowPda: PublicKey
): [PublicKey, number] {
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
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
}


function errorCode(err: any): string {
  return (
    err?.error?.errorCode?.code ??
    err?.message ??
    String(err)
  );
}



describe("FlowFi Escrow Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.flowfiEscrow as Program<FlowfiEscrow>;
  const conn = provider.connection;


  const client = Keypair.generate();
  const freelancer = Keypair.generate();
  const authority = Keypair.generate();
  const badActor = Keypair.generate();


  let usdcMint: PublicKey;
  let clientUsdc: PublicKey;
  let freelancerUsdc: PublicKey;
  let authorityUsdc: PublicKey;
  let badActorUsdc: PublicKey;


  const INVOICE_ID = "inv_" + Date.now().toString();
  const AMOUNT = new BN(1_000_000);
  const ADVANCE_AMOUNT = AMOUNT.muln(85).divn(100);

  let escrowPda: PublicKey;
  let vaultAta: PublicKey;
  let advancePda: PublicKey;

  before(async () => {
    await Promise.all([
      airdrop(conn, client.publicKey),
      airdrop(conn, freelancer.publicKey),
      airdrop(conn, authority.publicKey),
      airdrop(conn, badActor.publicKey),
    ]);

    usdcMint = await createMint(conn, client, client.publicKey, null, 6);

    [clientUsdc, freelancerUsdc, authorityUsdc, badActorUsdc] = await Promise.all([
      createAssociatedTokenAccount(conn, client, usdcMint, client.publicKey),
      createAssociatedTokenAccount(conn, freelancer, usdcMint, freelancer.publicKey),
      createAssociatedTokenAccount(conn, authority, usdcMint, authority.publicKey),
      createAssociatedTokenAccount(conn, badActor, usdcMint, badActor.publicKey),
    ]);

    await mintTo(conn, client, usdcMint, authorityUsdc, client.publicKey, 50_000_000);

    [escrowPda] = getEscrowPda(program.programId, client.publicKey, INVOICE_ID);
    vaultAta = await getAssociatedTokenAddress(usdcMint, escrowPda, true);
    [advancePda] = getAdvancePda(program.programId, escrowPda);
  });

  describe("initialize_escrow", () => {
    it("creates escrow with status=Created and correct fields", async () => {
      await program.methods
        .initializeEscrow(INVOICE_ID, AMOUNT, freelancer.publicKey, authority.publicKey)
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
      assert.ok(escrow.authority.equals(authority.publicKey), "authority mismatch");
      assert.equal(escrow.amount.toString(), AMOUNT.toString(), "amount mismatch");
      assert.equal(escrow.dodoInvoiceId, INVOICE_ID, "invoice id mismatch");
      assert.deepEqual(escrow.status, { created: {} }, "status should be Created");
      assert.isFalse(escrow.advanced, "advanced should be false");
      assert.isFalse(escrow.milestoneApproved, "milestoneApproved should be false");
    });

    it("fails with ZeroAmount when amount = 0", async () => {
      const inv = "inv_zero";
      const [pda] = getEscrowPda(program.programId, client.publicKey, inv);
      const vlt = await getAssociatedTokenAddress(usdcMint, pda, true);
      try {
        await program.methods
          .initializeEscrow(inv, new BN(0), freelancer.publicKey, authority.publicKey)
          .accounts({
            client: client.publicKey, usdcMint, escrowAccount: pda, vault: vlt,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
          } as any)
          .signers([client]).rpc();
        assert.fail("expected ZeroAmount");
      } catch (err: any) {
        expect(errorCode(err)).to.include("ZeroAmount");
      }
    });

    it("fails with InvoiceIdTooLong when ID > 32 chars", async () => {
      const longId = "a".repeat(33);
      const [pda] = getEscrowPda(program.programId, client.publicKey, longId);
      const vlt = await getAssociatedTokenAddress(usdcMint, pda, true);
      try {
        await program.methods
          .initializeEscrow(longId, AMOUNT, freelancer.publicKey, authority.publicKey)
          .accounts({
            client: client.publicKey, usdcMint, escrowAccount: pda, vault: vlt,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
          } as any)
          .signers([client]).rpc();
        assert.fail("expected InvoiceIdTooLong");
      } catch (err: any) {
        expect(errorCode(err)).to.include("InvoiceIdTooLong");
      }
    });
  });

  describe("fund_escrow", () => {
    it("funds escrow and transitions status to Funded", async () => {
      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint,
          authorityUsdcAccount: authorityUsdc, escrowAccount: escrowPda, vault: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority]).rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.deepEqual(escrow.status, { funded: {} }, "should be Funded");

      const vault = await getAccount(conn, vaultAta);
      assert.equal(vault.amount.toString(), AMOUNT.toString(), "vault balance mismatch");
    });

    it("is idempotent — second fund_escrow call is a no-op", async () => {
      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint,
          authorityUsdcAccount: authorityUsdc, escrowAccount: escrowPda, vault: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority]).rpc();

      const vault = await getAccount(conn, vaultAta);
      assert.equal(vault.amount.toString(), AMOUNT.toString(), "balance changed on second call");
    });

    it("fails with UnauthorizedAuthority when wrong wallet calls fund_escrow", async () => {
      const inv2 = "inv_auth_" + Date.now().toString().slice(-8);
      const [esc2] = getEscrowPda(program.programId, client.publicKey, inv2);
      const vlt2 = await getAssociatedTokenAddress(usdcMint, esc2, true);

      await program.methods
        .initializeEscrow(inv2, AMOUNT, freelancer.publicKey, authority.publicKey)
        .accounts({
          client: client.publicKey, usdcMint, escrowAccount: esc2, vault: vlt2,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([client]).rpc();

      try {
        await program.methods.fundEscrow()
          .accounts({
            authority: badActor.publicKey, usdcMint,
            authorityUsdcAccount: badActorUsdc, escrowAccount: esc2, vault: vlt2,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([badActor]).rpc();
        assert.fail("expected UnauthorizedAuthority");
      } catch (err: any) {
        expect(errorCode(err)).to.include("UnauthorizedAuthority");
      }
    });
  });

  describe("approve_milestone", () => {
    it("fails with UnauthorizedClient when freelancer tries to approve", async () => {
      try {
        await program.methods.approveMilestone()
          .accounts({ client: freelancer.publicKey, escrowAccount: escrowPda } as any)
          .signers([freelancer]).rpc();
        assert.fail("expected UnauthorizedClient");
      } catch (err: any) {
        expect(errorCode(err)).to.include("UnauthorizedClient");
      }
    });

    it("client successfully approves milestone", async () => {
      await program.methods.approveMilestone()
        .accounts({ client: client.publicKey, escrowAccount: escrowPda } as any)
        .signers([client]).rpc();

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.isTrue(escrow.milestoneApproved, "milestoneApproved should be true");
    });
  });

  describe("request_advance", () => {
    const ADV_INVOICE = "adv_" + Date.now().toString().slice(-8);
    let advEscrow: PublicKey;
    let advVault: PublicKey;
    let advPda: PublicKey;

    before(async () => {
      [advEscrow] = getEscrowPda(program.programId, client.publicKey, ADV_INVOICE);
      advVault = await getAssociatedTokenAddress(usdcMint, advEscrow, true);
      [advPda] = getAdvancePda(program.programId, advEscrow);

      await program.methods
        .initializeEscrow(ADV_INVOICE, AMOUNT, freelancer.publicKey, authority.publicKey)
        .accounts({
          client: client.publicKey, usdcMint, escrowAccount: advEscrow, vault: advVault,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([client]).rpc();

      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint, authorityUsdcAccount: authorityUsdc,
          escrowAccount: advEscrow, vault: advVault, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([authority]).rpc();
    });

    it("fails with UnauthorizedFreelancer when client calls request_advance", async () => {
      try {
        await program.methods.requestAdvance()
          .accounts({
            freelancer: client.publicKey, usdcMint, escrowAccount: advEscrow,
            vault: advVault, freelancerUsdcAccount: clientUsdc, advanceAccount: advPda,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client]).rpc();
        assert.fail("expected UnauthorizedFreelancer");
      } catch (err: any) {
        expect(errorCode(err)).to.include("UnauthorizedFreelancer");
      }
    });

    it("freelancer receives exactly 85% advance instantly", async () => {
      const before = (await getAccount(conn, freelancerUsdc)).amount;

      await program.methods.requestAdvance()
        .accounts({
          freelancer: freelancer.publicKey, usdcMint, escrowAccount: advEscrow,
          vault: advVault, freelancerUsdcAccount: freelancerUsdc, advanceAccount: advPda,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([freelancer]).rpc();

      const after = (await getAccount(conn, freelancerUsdc)).amount;
      assert.equal((after - before).toString(), ADVANCE_AMOUNT.toString(), "advance amount wrong");

      const escrow = await program.account.escrowAccount.fetch(advEscrow);
      assert.isTrue(escrow.advanced, "advanced flag not set");
      assert.equal(escrow.advanceAmount.toString(), ADVANCE_AMOUNT.toString());

      const advance = await program.account.advanceAccount.fetch(advPda);
      assert.isFalse(advance.repaid, "repaid should be false");
      assert.equal(advance.advanceAmount.toString(), ADVANCE_AMOUNT.toString());
    });

    it("fails with AdvanceAlreadyTaken on second advance attempt", async () => {
      try {
        await program.methods.requestAdvance()
          .accounts({
            freelancer: freelancer.publicKey, usdcMint, escrowAccount: advEscrow,
            vault: advVault, freelancerUsdcAccount: freelancerUsdc, advanceAccount: advPda,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([freelancer]).rpc();
        assert.fail("expected AdvanceAlreadyTaken");
      } catch (err: any) {
        const code = errorCode(err);
        expect(
          code.includes("AdvanceAlreadyTaken") || code.includes("already in use")
        ).to.be.true;
      }
    });

    it("repay_advance marks advance as repaid", async () => {
      await program.methods.repayAdvance()
        .accounts({
          authority: authority.publicKey, escrowAccount: advEscrow, advanceAccount: advPda,
        } as any)
        .signers([authority]).rpc();

      const advance = await program.account.advanceAccount.fetch(advPda);
      assert.isTrue(advance.repaid, "repaid should be true");
    });

    it("fails with AdvanceAlreadyRepaid on second repay attempt", async () => {
      try {
        await program.methods.repayAdvance()
          .accounts({
            authority: authority.publicKey, escrowAccount: advEscrow, advanceAccount: advPda,
          } as any)
          .signers([authority]).rpc();
        assert.fail("expected AdvanceAlreadyRepaid");
      } catch (err: any) {
        expect(errorCode(err)).to.include("AdvanceAlreadyRepaid");
      }
    });
  });

  describe("release_funds", () => {
    it("releases full vault amount to freelancer after milestone approval", async () => {
      const before = (await getAccount(conn, freelancerUsdc)).amount;

      await program.methods.releaseFunds()
        .accounts({
          authority: authority.publicKey, usdcMint, escrowAccount: escrowPda,
          vault: vaultAta, freelancerUsdcAccount: freelancerUsdc,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([authority]).rpc();

      const after = (await getAccount(conn, freelancerUsdc)).amount;
      assert.equal((after - before).toString(), AMOUNT.toString(), "wrong release amount");

      const escrow = await program.account.escrowAccount.fetch(escrowPda);
      assert.deepEqual(escrow.status, { released: {} }, "should be Released");
    });

    it("fails with EscrowNotFunded on double-release", async () => {
      try {
        await program.methods.releaseFunds()
          .accounts({
            authority: authority.publicKey, usdcMint, escrowAccount: escrowPda,
            vault: vaultAta, freelancerUsdcAccount: freelancerUsdc,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([authority]).rpc();
        assert.fail("expected EscrowNotFunded");
      } catch (err: any) {
        expect(errorCode(err)).to.include("EscrowNotFunded");
      }
    });

    it("fails with UnauthorizedAuthority when wrong wallet calls release_funds", async () => {
      const inv3 = "inv_rel_" + Date.now().toString().slice(-8);
      const [esc3] = getEscrowPda(program.programId, client.publicKey, inv3);
      const vlt3 = await getAssociatedTokenAddress(usdcMint, esc3, true);

      await program.methods
        .initializeEscrow(inv3, AMOUNT, freelancer.publicKey, authority.publicKey)
        .accounts({
          client: client.publicKey, usdcMint, escrowAccount: esc3, vault: vlt3,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([client]).rpc();

      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint, authorityUsdcAccount: authorityUsdc,
          escrowAccount: esc3, vault: vlt3, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([authority]).rpc();

      await program.methods.approveMilestone()
        .accounts({ client: client.publicKey, escrowAccount: esc3 } as any)
        .signers([client]).rpc();

      const freelancerUsdc3 = await getAssociatedTokenAddress(usdcMint, freelancer.publicKey);

      try {
        await program.methods.releaseFunds()
          .accounts({
            authority: badActor.publicKey, usdcMint, escrowAccount: esc3,
            vault: vlt3, freelancerUsdcAccount: freelancerUsdc3,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([badActor]).rpc();
        assert.fail("expected UnauthorizedAuthority");
      } catch (err: any) {
        expect(errorCode(err)).to.include("UnauthorizedAuthority");
      }
    });
  });

  describe("cancel_escrow", () => {
    const CANCEL_INVOICE = "can_" + Date.now().toString().slice(-8);
    let cancelEscrow: PublicKey;
    let cancelVault: PublicKey;

    before(async () => {
      [cancelEscrow] = getEscrowPda(program.programId, client.publicKey, CANCEL_INVOICE);
      cancelVault = await getAssociatedTokenAddress(usdcMint, cancelEscrow, true);

      await program.methods
        .initializeEscrow(CANCEL_INVOICE, AMOUNT, freelancer.publicKey, authority.publicKey)
        .accounts({
          client: client.publicKey, usdcMint, escrowAccount: cancelEscrow,
          vault: cancelVault, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([client]).rpc();

      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint, authorityUsdcAccount: authorityUsdc,
          escrowAccount: cancelEscrow, vault: cancelVault, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([authority]).rpc();
    });

    it("fails with UnauthorizedClient when freelancer tries to cancel", async () => {
      try {
        await program.methods.cancelEscrow()
          .accounts({
            client: freelancer.publicKey, usdcMint, clientUsdcAccount: freelancerUsdc,
            escrowAccount: cancelEscrow, vault: cancelVault, advanceAccount: null,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([freelancer]).rpc();
        assert.fail("expected UnauthorizedClient");
      } catch (err: any) {
        expect(errorCode(err)).to.include("UnauthorizedClient");
      }
    });

    it("client cancels funded escrow and receives full refund", async () => {
      const before = (await getAccount(conn, clientUsdc)).amount;

      await program.methods.cancelEscrow()
        .accounts({
          client: client.publicKey, usdcMint, clientUsdcAccount: clientUsdc,
          escrowAccount: cancelEscrow, vault: cancelVault, advanceAccount: null,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([client]).rpc();

      const after = (await getAccount(conn, clientUsdc)).amount;
      assert.equal((after - before).toString(), AMOUNT.toString(), "refund amount wrong");

      const escrow = await program.account.escrowAccount.fetch(cancelEscrow);
      assert.deepEqual(escrow.status, { cancelled: {} }, "should be Cancelled");
    });

    it("fails with ActiveAdvanceNotRepaid when advance is outstanding", async () => {
      const ADV_CANCEL_INVOICE = "acan_" + Date.now().toString().slice(-8);
      const [acEscrow] = getEscrowPda(program.programId, client.publicKey, ADV_CANCEL_INVOICE);
      const acVault = await getAssociatedTokenAddress(usdcMint, acEscrow, true);
      const [acAdvPda] = getAdvancePda(program.programId, acEscrow);

      await program.methods
        .initializeEscrow(ADV_CANCEL_INVOICE, AMOUNT, freelancer.publicKey, authority.publicKey)
        .accounts({
          client: client.publicKey, usdcMint, escrowAccount: acEscrow, vault: acVault,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([client]).rpc();

      await program.methods.fundEscrow()
        .accounts({
          authority: authority.publicKey, usdcMint, authorityUsdcAccount: authorityUsdc,
          escrowAccount: acEscrow, vault: acVault, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        } as any)
        .signers([authority]).rpc();

      await program.methods.requestAdvance()
        .accounts({
          freelancer: freelancer.publicKey, usdcMint, escrowAccount: acEscrow,
          vault: acVault, freelancerUsdcAccount: freelancerUsdc, advanceAccount: acAdvPda,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([freelancer]).rpc();

      try {
        await program.methods.cancelEscrow()
          .accounts({
            client: client.publicKey, usdcMint, clientUsdcAccount: clientUsdc,
            escrowAccount: acEscrow, vault: acVault, advanceAccount: acAdvPda,
            tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([client]).rpc();
        assert.fail("expected ActiveAdvanceNotRepaid");
      } catch (err: any) {
        expect(errorCode(err)).to.include("ActiveAdvanceNotRepaid");
      }
    });
  });
});
