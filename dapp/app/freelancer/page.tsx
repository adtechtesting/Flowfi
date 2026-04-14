"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Search, Coins, Zap, ShieldCheck, Loader2, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { buildRequestAdvanceTx } from "../lib/solana/client";

type EscrowStatus = "created" | "funded" | "released" | "cancelled" | "unknown";

const getOnChainStatus = (escrow: any): EscrowStatus => {
  if (!escrow) return "unknown";
  return Object.keys(escrow.status)[0] as EscrowStatus;
};

const formatUsdc = (lamports: any): string => {
  if (lamports === undefined || lamports === null) return "0.00";
  const strVal = lamports.toString ? lamports.toString() : String(lamports);
  const val = parseFloat(strVal);
  if (isNaN(val)) return "0.00";
  return (val / 1_000_000).toFixed(2);
};

const truncateSig = (sig: string) =>
  sig ? sig.slice(0, 8) + "..." + sig.slice(-8) : "";

const explorerUrl = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    created: { cls: "border-blue-500/30 text-blue-400/80 bg-blue-500/5", label: "Created" },
    funded: { cls: "border-green-500/30 text-green-400/80 bg-green-500/5", label: "Funded" },
    released: { cls: "border-purple-500/30 text-purple-400/80 bg-purple-500/5", label: "Released" },
    cancelled: { cls: "border-red-500/30 text-red-400/80 bg-red-500/5", label: "Cancelled" },
    unknown: { cls: "border-white/10 text-white/40 bg-white/5", label: "Not on-chain" },
    PENDING: { cls: "border-yellow-500/30 text-yellow-400/80 bg-yellow-500/5", label: "Pending payment" },
    ESCROW_FUNDED: { cls: "border-green-500/30 text-green-400/80 bg-green-500/5", label: "Funded" },
    ADVANCED: { cls: "border-amber-500/30 text-amber-400/80 bg-amber-500/5", label: "Advanced" },
    RELEASED: { cls: "border-purple-500/30 text-purple-400/80 bg-purple-500/5", label: "Released" },
  };
  const c = map[status] ?? map.unknown;
  return (
    <span className={`px-3 py-1 text-xs font-medium border uppercase tracking-widest ${c.cls}`}>
      {c.label}
    </span>
  );
};

export default function FreelancerDashboard() {
  const { publicKey, signTransaction, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const searchParams = useSearchParams();

  const [invoiceId, setInvoiceId] = useState(searchParams.get("invoiceId") || "");
  const [escrowData, setEscrowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("invoiceId");
    if (id) { setInvoiceId(id); doFetch(id); }
  }, []);

  const doFetch = async (id?: string) => {
    const target = (id || invoiceId).trim();
    if (!target) return;
    setLoading(true); setError(null); setEscrowData(null); setTxSuccess(null);
    try {
      const res = await fetch(`/api/escrow/${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice not found");
      setEscrowData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdvance = async () => {
    if (!publicKey || !signTransaction) return setError("Connect wallet first");
    if (!escrowData) return;

    if (escrowData.invoice.freelancerWallet !== publicKey!.toString()) {
      return setError("Your wallet does not match the freelancer wallet on this escrow");
    }

    setAdvanceLoading(true); setError(null);
    try {
      const wallet = { publicKey: publicKey!, signTransaction: signTransaction! };
      const tx = await buildRequestAdvanceTx(
        connection,
        wallet,
        escrowData.invoice.dodoInvoiceId,
        new PublicKey(escrowData.invoice.clientWallet),
        publicKey!
      );

      const txId = await sendTransaction(tx, connection);
      console.log(" Advance claimed:", explorerUrl(txId));

      await fetch("/api/advance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dodoInvoiceId: escrowData.invoice.dodoInvoiceId,
          txSignature: txId,
        }),
      });

      setTxSuccess(txId);
      await doFetch();
    } catch (e: any) {
      setError(e.message?.includes("User rejected")
        ? "Transaction cancelled."
        : e.message || "Failed to claim advance");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const onChainStatus = getOnChainStatus(escrowData?.onChainEscrow);
  const totalUsdc = escrowData?.onChainEscrow
    ? formatUsdc(escrowData.onChainEscrow.amount)
    : escrowData ? (escrowData.invoice.amount / 100).toFixed(2) : "0.00";
  const advanceUsdc = escrowData?.onChainEscrow?.advanced
    ? formatUsdc(escrowData.onChainEscrow.advanceAmount)
    : (parseFloat(totalUsdc) * 0.85).toFixed(2);
  const remainingUsdc = (parseFloat(totalUsdc) - parseFloat(advanceUsdc)).toFixed(2);

  if (!connected) {
    return (
      <div className="relative min-h-screen bg-black w-full flex items-center justify-center overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-12 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 flex flex-col items-center text-center max-w-md w-full mx-4">
          <div className="mb-6 p-4 bg-white/[0.03] border border-white/5 inline-flex">
            <Coins className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">Freelancer Hub</h2>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">Freelancer Hub</h1>
              <p className="text-white/50 mt-2 font-light">Unlock advances and track your payments.</p>
              <p className="text-white/25 mt-1 font-mono text-xs">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </p>
            </div>

            <form onSubmit={e => { e.preventDefault(); doFetch(); }} className="relative flex w-full md:w-96">
              <input
                type="text"
                placeholder="Paste Invoice ID (inv_xxxxxxxxxx)..."
                className="w-full bg-white/[0.02] border border-white/10 pl-4 pr-12 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light text-sm"
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </form>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-red-400/90 text-sm font-light">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {txSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-green-500/5 border border-green-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  <p className="text-green-400/90 text-sm font-light">Advance claimed successfully.</p>
                </div>
                <a href={explorerUrl(txSuccess)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-400/60 hover:text-green-400 transition-colors font-mono">
                  Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          {escrowData ? (
            <div className="flex flex-col gap-6">

              {/* Status row */}
              <div className="flex flex-wrap items-center gap-3 p-4 bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/40 uppercase tracking-widest">On-chain status</span>
                <StatusBadge status={onChainStatus} />
                <StatusBadge status={escrowData.invoice.status} />
                {escrowData.onChainEscrow?.milestoneApproved && (
                  <span className="flex items-center gap-1 text-xs text-purple-400/70">
                    <CheckCircle className="h-3 w-3" /> Milestone approved
                  </span>
                )}
                {escrowData.onChainEscrow?.advanced && (
                  <span className="flex items-center gap-1 text-xs text-amber-400/70">
                    <Zap className="h-3 w-3" /> Advance taken
                  </span>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">

                {/* Left — job details */}
                <div className="p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all flex flex-col gap-6">
                  <h2 className="text-xl font-light text-white border-b border-white/10 pb-4 tracking-tight">Job Details</h2>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-[0.1em]">Title</p>
                      <p className="text-lg text-white font-light">{escrowData.invoice.jobTitle}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-[0.1em]">Amount</p>
                      <p className="text-2xl font-light text-white">${totalUsdc}</p>
                      <p className="text-xs text-white/30">USDC</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-[0.1em]">Network</p>
                      <p className="text-lg font-light text-white">Devnet</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-[0.1em]">Client</p>
                      <p className="text-xs font-mono text-white/50 truncate p-2 bg-white/[0.02] border border-white/5">
                        {escrowData.invoice.clientWallet}
                      </p>
                    </div>
                  </div>

                  {/* On-chain escrow status */}
                  <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">
                        On-chain Escrow PDA
                      </p>
                      <p className="text-[10px] font-mono text-white/40 truncate">
                        {escrowData.escrowPubkey}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/40 mb-1 uppercase tracking-[0.1em] font-medium">
                          On-chain Status
                        </p>
                        {escrowData.onChainEscrow ? (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <p className="text-sm text-white font-mono capitalize">
                              {Object.keys(escrowData.onChainEscrow.status)[0]}
                              {escrowData.onChainEscrow.advanced && " · Advanced"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                              <p className="text-sm text-white/40 font-mono">Not found on-chain</p>
                            </div>
                            {escrowData.onChainError && (
                              <p className="text-[10px] text-red-500/50 font-mono mt-1">
                                Error: {escrowData.onChainError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Transaction links */}
                      <div className="flex flex-col gap-2 text-right">
                        {escrowData.invoice.txSignature && (
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Initialized</p>
                            <a href={explorerUrl(escrowData.invoice.txSignature)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-end gap-1 text-[10px] font-mono text-blue-400/60 hover:text-blue-400 transition-colors">
                              {truncateSig(escrowData.invoice.txSignature)} <ExternalLink className="h-2 w-2" />
                            </a>
                          </div>
                        )}

                        {escrowData.invoice.advanceTxSig && (
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Advance</p>
                            <a href={explorerUrl(escrowData.invoice.advanceTxSig)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-end gap-1 text-[10px] font-mono text-amber-400/60 hover:text-amber-400 transition-colors">
                              {truncateSig(escrowData.invoice.advanceTxSig)} <ExternalLink className="h-2 w-2" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — advance panel */}
                <div className="p-8 bg-[#050505] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors overflow-hidden relative">
                  <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px] pointer-events-none" />

                  <div className="flex flex-col gap-5">
                    <h2 className="text-xl font-light text-white flex items-center gap-3">
                      <Zap className="h-5 w-5 text-amber-500/80" strokeWidth={1.5} />
                      Payment Breakdown
                    </h2>

                    {/* Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-white/[0.02] border border-white/5">
                        <span className="text-sm text-white/50">Total escrow</span>
                        <span className="text-sm text-white">${totalUsdc} USDC</span>
                      </div>
                      <div className="flex justify-between p-3 bg-amber-500/[0.03] border border-amber-500/10">
                        <span className="text-sm text-amber-400/70">Instant advance (85%)</span>
                        <span className="text-lg text-amber-400/90">${advanceUsdc} USDC</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/[0.02] border border-white/5">
                        <span className="text-sm text-white/50">After approval (15%)</span>
                        <span className="text-sm text-white">${remainingUsdc} USDC</span>
                      </div>
                    </div>

                    {/* Context messages */}
                    {onChainStatus === "unknown" && (
                      <div className="flex gap-2 p-3 bg-yellow-500/[0.03] border border-yellow-500/10">
                        <Clock className="h-4 w-4 text-yellow-400/60 mt-0.5 shrink-0" />
                        <p className="text-xs text-yellow-400/60 leading-relaxed">
                          Escrow not yet on-chain. Client must initialize first.
                        </p>
                      </div>
                    )}

                    {onChainStatus === "created" && (
                      <div className="flex gap-2 p-3 bg-blue-500/[0.03] border border-blue-500/10">
                        <Clock className="h-4 w-4 text-blue-400/60 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-400/60 leading-relaxed">
                          Waiting for client payment to fund the vault.
                        </p>
                      </div>
                    )}

                    {onChainStatus === "funded" && escrowData.onChainEscrow?.advanced && (
                      <div className="flex gap-2 p-3 bg-amber-500/[0.03] border border-amber-500/10">
                        <CheckCircle className="h-4 w-4 text-amber-400/60 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-400/60 leading-relaxed">
                          ${advanceUsdc} advance claimed. ${remainingUsdc} releases after client approval.
                        </p>
                      </div>
                    )}

                    {onChainStatus === "released" && (
                      <div className="flex gap-2 p-3 bg-purple-500/[0.03] border border-purple-500/10">
                        <CheckCircle className="h-4 w-4 text-purple-400/60 mt-0.5 shrink-0" />
                        <p className="text-xs text-purple-400/60 leading-relaxed">
                          All funds fully released. Job complete.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA button */}
                  <div className="mt-6">
                    {escrowData.advanceEligible ? (
                      <button onClick={handleClaimAdvance} disabled={advanceLoading}
                        className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {advanceLoading
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Claiming...</>
                          : <><Zap className="h-4 w-4" /> Claim ${advanceUsdc} USDC Now</>
                        }
                      </button>
                    ) : onChainStatus === "funded" && escrowData.onChainEscrow?.advanced ? (
                      <div className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-white/5 text-white/30 font-medium">
                        <CheckCircle className="h-4 w-4" /> Advance Already Claimed
                      </div>
                    ) : onChainStatus === "released" ? (
                      <div className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-white/5 text-white/30 font-medium">
                        <CheckCircle className="h-4 w-4" /> Fully Paid Out
                      </div>
                    ) : (
                      <div className="w-full flex justify-center items-center gap-2 px-8 py-4 bg-white/5 text-white/30 font-medium">
                        <Clock className="h-4 w-4" /> Waiting for Vault Funding
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 p-20 flex flex-col items-center justify-center border border-dashed border-white/5 bg-white/[0.01]">
              <ShieldCheck className="mb-4 h-10 w-10 text-white/20" strokeWidth={1} />
              <p className="text-white/40 font-light text-sm text-center max-w-xs leading-relaxed">
                Enter your invoice ID above to view escrow status and claim your advance.
              </p>
              <p className="mt-3 text-white/20 font-mono text-xs">example: inv_1234567890</p>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}