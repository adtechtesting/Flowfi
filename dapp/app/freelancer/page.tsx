"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Search, Coins, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import {
  buildRequestAdvanceTx,
  signAndSendTx,
} from "../lib/solana/client";

export default function FreelancerDashboard() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId") || "";

  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleFetchEscrow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!invoiceId.trim()) return;

    setLoading(true);
    setEscrowData(null);
    try {
      const res = await fetch(`/api/escrow/${encodeURIComponent(invoiceId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setEscrowData(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRequest = async () => {
    if (!publicKey || !signTransaction) return alert("Connect wallet first");
    if (!escrowData) return;

    setActionLoading(true);
    try {
      const clientPubkey = new PublicKey(escrowData.invoice.clientWallet);
      const walletAdapter = { publicKey, signTransaction };


      const tx = await buildRequestAdvanceTx(
        connection,
        walletAdapter,
        escrowData.invoice.dodoInvoiceId,
        clientPubkey,
        publicKey
      );


      const txId = await signAndSendTx(connection, walletAdapter, tx);
      console.log("Advance tx:", txId);


      const res = await fetch("/api/advance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dodoInvoiceId: escrowData.invoice.dodoInvoiceId,
          txSignature: txId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Backend sync failed");

      alert(`Advance claimed. TX: ${txId}`);
      handleFetchEscrow();
    } catch (err: any) {
      console.error(err);
      alert("Failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };


  if (!connected) {
    return (
      <div className="relative min-h-screen bg-black w-full flex items-center justify-center overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-12 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 flex flex-col items-center text-center max-w-md w-full mx-4"
        >
          <div className="mb-6 p-4 bg-white/[0.03] border border-white/5 inline-flex">
            <Coins className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">
            Freelancer Hub
          </h2>
          <p className="text-white/50 font-light text-sm leading-relaxed">
            Connect your Solana wallet to view jobs and claim instant advances.
          </p>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Header + Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">
                Freelancer Hub
              </h1>
              <p className="text-white/50 mt-2 font-light">
                Unlock advances and track your payments.
              </p>
            </div>

            <form
              onSubmit={handleFetchEscrow}
              className="relative flex w-full md:w-80"
            >
              <input
                type="text"
                placeholder="Enter Invoice ID..."
                className="w-full bg-white/[0.02] border border-white/10 pl-4 pr-12 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light text-sm"
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {escrowData ? (
            <div className="grid gap-8 md:grid-cols-2">

              {/* Job details */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                  <h2 className="text-xl font-light text-white tracking-wide">
                    Job Details
                  </h2>
                  <span className="bg-white/5 px-3 py-1 text-xs font-medium text-white/70 border border-white/10 uppercase tracking-widest">
                    {escrowData.invoice.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">
                      Job Title
                    </p>
                    <p className="text-lg text-white font-light">
                      {escrowData.invoice.jobTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">
                      Total Amount
                    </p>
                    <p className="text-4xl font-light text-white">
                      ${(escrowData.invoice.amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">
                      Client Wallet
                    </p>
                    <p className="text-sm font-mono text-white/60 truncate p-3 bg-white/[0.02] border border-white/5">
                      {escrowData.invoice.clientWallet}
                    </p>
                  </div>

                  {/* On-chain escrow status */}
                  {escrowData.onChainEscrow && (
                    <div>
                      <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">
                        On-chain Status
                      </p>
                      <p className="text-sm text-white/70 font-mono capitalize">
                        {Object.keys(escrowData.onChainEscrow.status)[0]}
                        {escrowData.onChainEscrow.advanced && " · Advanced"}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Advance panel */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-8 bg-[#050505] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors overflow-hidden"
              >
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px] pointer-events-none" />

                <div>
                  <h2 className="text-xl font-light text-white flex items-center gap-3 tracking-wide">
                    <Zap className="h-5 w-5 text-amber-500/80" strokeWidth={1.5} />
                    Instant Advance
                  </h2>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed font-light">
                    Withdraw 85% of your payout immediately without waiting for client
                    approval.
                  </p>

                  <div className="mt-8 p-5 border border-amber-500/10 bg-amber-500/[0.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-500/50 text-sm font-medium uppercase tracking-wide">
                        Available Draw
                      </span>
                      <span className="text-2xl font-light text-amber-500/90">
                        ${((escrowData.invoice.amount / 100) * 0.85).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!escrowData.advanceEligible && (
                    <p className="mt-4 text-xs text-white/30 font-light">
                      {escrowData.onChainEscrow?.advanced
                        ? "Advance already claimed."
                        : "Escrow must be funded before claiming advance."}
                    </p>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleAdvanceRequest}
                    disabled={actionLoading || !escrowData.advanceEligible}
                    className="w-full flex justify-center items-center gap-2 px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: escrowData.advanceEligible
                        ? "#ffffff"
                        : "rgba(255,255,255,0.05)",
                      color: escrowData.advanceEligible
                        ? "#000000"
                        : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {actionLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing</>
                    ) : !escrowData.advanceEligible ? (
                      "Not Eligible"
                    ) : (
                      "Claim 85% Advance Now"
                    )}
                  </button>
                </div>
              </motion.div>

            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-20 flex flex-col items-center justify-center border border-dashed border-white/5 bg-white/[0.01]"
            >
              <ShieldCheck className="mb-4 h-10 w-10 text-white/20" strokeWidth={1} />
              <p className="text-white/40 font-light text-sm">
                Search for an invoice ID to view your contract and claim advances.
              </p>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}