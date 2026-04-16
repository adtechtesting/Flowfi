"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Coins, CheckCircle, ExternalLink, ShieldCheck, Zap, Clock, Info } from "lucide-react";
import { buildRequestAdvanceTx } from "../lib/solana/client";

const truncateSig = (sig: string) => `${sig.slice(0, 4)}...${sig.slice(-4)}`;
const explorerUrl = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

const formatUsdc = (lamports: any): string => {
  if (lamports === undefined || lamports === null) return "0.00";
  const strVal = lamports.toString ? lamports.toString() : String(lamports);
  const val = parseFloat(strVal);
  if (isNaN(val)) return "0.00";
  return (val / 1_000_000).toFixed(2);
};

export default function FreelancerDashboard() {
  const { publicKey, signTransaction, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [advanceLoadingId, setAdvanceLoadingId] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) loadMyJobs();
    else setJobs([]);
  }, [publicKey]);

  const loadMyJobs = async () => {
    if (!publicKey) return;
    setLoading(true); setError(null); setTxSuccess(null);
    try {
      const res = await fetch(`/api/invoices?freelancerWallet=${publicKey.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load jobs");
      setJobs(data.jobs || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdvance = async (job: any) => {
    if (!publicKey || !signTransaction) return setError("Connect wallet first");
    setAdvanceLoadingId(job.id); setError(null);
    try {
      const wallet = { publicKey: publicKey!, signTransaction: signTransaction! };
      const tx = await buildRequestAdvanceTx(
        connection,
        wallet,
        job.dodoInvoiceId,
        new PublicKey(job.clientWallet),
        publicKey!
      );

      const txId = await sendTransaction(tx, connection);
      console.log(" Advance claimed:", explorerUrl(txId));

      await fetch("/api/advance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dodoInvoiceId: job.dodoInvoiceId,
          txSignature: txId,
        }),
      });

      setTxSuccess(txId);
      await loadMyJobs();
    } catch (e: any) {
      setError(e.message?.includes("User rejected")
        ? "Transaction cancelled."
        : e.message || "Failed to claim advance");
    } finally {
      setAdvanceLoadingId(null);
    }
  };

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
            Connect your Solana wallet to view assigned jobs and claim instant advances.
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
              <h1 className="text-4xl font-light text-white tracking-tight">Assigned Jobs</h1>
              <p className="text-white/50 mt-2 font-light">Claim your instant advances safely on-chain.</p>
              <p className="text-white/25 mt-1 font-mono text-xs">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-white/50 mb-2" />}
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                <p className="text-red-400/90 text-sm font-light">{error}</p>
              </motion.div>
            )}
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

          {/* Jobs List */}
          {jobs.length === 0 && !loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 p-20 flex flex-col items-center justify-center border border-dashed border-white/5 bg-white/[0.01]">
              <ShieldCheck className="mb-4 h-10 w-10 text-white/20" strokeWidth={1} />
              <p className="text-white/40 font-light text-sm text-center max-w-xs leading-relaxed">
                You do not have any active jobs assigned to your wallet yet. 
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => {
                const totalUsdc = job.onChain 
                  ? formatUsdc(job.onChain.amount) 
                  : (job.amount / 100).toFixed(2);
                  
                const onChainStatusKey = job.onChain ? Object.keys(job.onChain.status)[0] : "unknown";
                const isFunded = onChainStatusKey === "funded";
                const isAdvanced = job.onChain?.advanced;
                const advanceEligible = isFunded && !isAdvanced;

                const advanceUsdc = isAdvanced && job.onChain
                  ? formatUsdc(job.onChain.advanceAmount)
                  : (parseFloat(totalUsdc) * 0.85).toFixed(2);
                const remainingUsdc = (parseFloat(totalUsdc) - parseFloat(advanceUsdc)).toFixed(2);

                return (
                  <div key={job.id} className="p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row gap-8 justify-between items-center group">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-xl font-light text-white tracking-tight">{job.jobTitle}</h2>
                        {isAdvanced && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500/80 uppercase tracking-widest border border-amber-500/20">Advanced</span>}
                      </div>
                      
                      <div className="flex gap-8 mt-4 border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total</p>
                          <p className="text-white font-light">${totalUsdc} USDC</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Advance (85%)</p>
                          <p className="text-amber-400 font-light">${advanceUsdc} USDC</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Remaining</p>
                          <p className="text-white/60 font-light">${remainingUsdc} USDC</p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end gap-3">
                      {advanceEligible ? (
                        <button 
                          onClick={() => handleClaimAdvance(job)} 
                          disabled={advanceLoadingId === job.id}
                          className="w-full md:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black font-medium transition-all disabled:opacity-50"
                        >
                          {advanceLoadingId === job.id
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Claiming...</>
                            : <><Zap className="h-4 w-4" /> Get Paid Now</>
                          }
                        </button>
                      ) : isAdvanced ? (
                         <div className="text-sm px-6 py-3 bg-white/5 text-white/40 font-medium flex items-center gap-2 border border-white/5">
                           <CheckCircle className="h-4 w-4 text-amber-500/50" /> Advance Paid Out
                         </div>
                      ) : onChainStatusKey === "released" ? (
                         <div className="text-sm px-6 py-3 bg-purple-500/10 text-purple-400/80 font-medium flex items-center gap-2 border border-purple-500/20">
                           <CheckCircle className="h-4 w-4" /> Fully Settled
                         </div>
                      ) : (
                         <div className="text-sm px-6 py-3 bg-white/5 text-white/30 font-medium flex items-center gap-2 border border-transparent border-dashed">
                           <Clock className="h-4 w-4" /> Waiting on Client
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}