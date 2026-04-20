"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Plus, Briefcase, Loader2, Info, CheckCircle, ExternalLink, Zap, Clock, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import {
  buildInitializeEscrowTx,
  buildApproveMilestoneTx,
} from "../lib/solana/client";

function ClientDashboardContent() {
  const { publicKey, signTransaction, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (publicKey) loadMyJobs();
    else setJobs([]);
  }, [publicKey]);

  const loadMyJobs = async () => {
    if (!publicKey) return;
    setJobsLoading(true);
    try {
      const res = await fetch(`/api/invoices?clientWallet=${publicKey.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      // Intentionally silent
    } finally {
      setJobsLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApproveMilestone = async (job: any) => {
    if (!publicKey || !signTransaction) return setError("Connect wallet first");
    setApprovingId(job.id);
    setError(null);
    try {
      const wallet = { publicKey: publicKey!, signTransaction: signTransaction! };
      const tx = await buildApproveMilestoneTx(
        connection,
        wallet,
        job.dodoInvoiceId,
        publicKey!
      );

      const txId = await sendTransaction(tx, connection);

      const res = await fetch("/api/approve-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dodoInvoiceId: job.dodoInvoiceId,
          txSignature: txId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger release");

      setTxSuccess("Work approved! The final payment has been successfully released to the freelancer.");
      await loadMyJobs();
    } catch (e: any) {
      setError(e.message?.includes("User rejected")
        ? "Approval cancelled."
        : e.message || "Failed to approve work");
    } finally {
      setApprovingId(null);
    }
  };

  const handleForceFund = async (job: any) => {
    try {
      const res = await fetch("/api/debug/force-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: job.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Force fund failed");

      setTxSuccess("Funds forcefully secured (Dev Mode bypass).");
      await loadMyJobs();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const [formData, setFormData] = useState({
    jobTitle: "",
    amount: "",
    freelancerWallet: "",
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return alert("Please connect your wallet first");

    let freelancerPubkey: PublicKey;
    try {
      freelancerPubkey = new PublicKey(formData.freelancerWallet);
    } catch {
      return alert("Invalid freelancer wallet address");
    }

    const amountUsd = parseFloat(formData.amount);
    if (isNaN(amountUsd) || amountUsd <= 0) {
      return alert("Invalid amount");
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          amount: Math.round(amountUsd * 100),
          clientWallet: publicKey!.toString(),
          freelancerWallet: formData.freelancerWallet,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to secure project");

      const walletAdapter = { publicKey: publicKey!, signTransaction: signTransaction! };
      const tx = await buildInitializeEscrowTx(
        connection,
        walletAdapter,
        data.dodoInvoiceId,
        amountUsd,
        publicKey!,
        freelancerPubkey,
        new PublicKey(data.authorityPubkey)
      );

      const txId = await sendTransaction(tx, connection);

      window.location.href = data.paymentUrl;

    } catch (err: any) {
      alert("Error: " + (err.message || "Unknown error"));
    } finally {
      setIsCreating(false);
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
            <Briefcase className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">
            Client Dashboard
          </h2>
          <p className="text-white/50 font-light text-sm leading-relaxed">
            Connect your wallet to hire talent and guarantee secure, instant payments.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">
                Client Dashboard
              </h1>
              <p className="text-white/50 mt-2 font-light">
                Manage your active projects and secure payments.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-white/70 uppercase tracking-wider">
                Network Live
              </span>
            </div>
          </div>

          {/* Payment success banner */}
          {(isSuccess || txSuccess) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-green-500/5 border border-green-500/20 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <p className="text-green-400/90 text-sm font-light">
                {txSuccess || "Payment successful. The funds are now securely locked for this job."}
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-red-500/5 border border-red-500/20 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <p className="text-red-400/90 text-sm font-light">
                {error}
              </p>
            </motion.div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">

            {/* Create job form */}
            <div className="relative lg:col-span-3 p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-white/[0.03] border border-white/5 text-white">
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-light text-white tracking-tight">
                  Start a New Project
                </h2>
              </div>

              <form onSubmit={handleCreateJob} className="flex flex-col gap-6">
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                    placeholder="e.g. Website Redesign"
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Total Payment (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-light">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      className="w-full bg-white/[0.02] border border-white/10 pl-8 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Freelancer Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                    placeholder="Enter public key..."
                    value={formData.freelancerWallet}
                    onChange={e =>
                      setFormData({ ...formData, freelancerWallet: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black font-medium transition-all w-full disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Securing Funds...</>
                  ) : (
                    "Secure Funds & Hire"
                  )}
                </button>
              </form>
            </div>

            {/* Info panel */}
            <div className="relative lg:col-span-2 p-8 bg-[#050505] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                  <h3 className="text-lg font-light text-white tracking-wide">
                    How it works
                  </h3>
                </div>
                <ul className="space-y-6 text-sm text-white/60 font-light">
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                    <p className="leading-relaxed">
                      Enter the project details and the freelancer's wallet address.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                    <p className="leading-relaxed">
                      Securely lock the payment upfront using your preferred method.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                    <p className="leading-relaxed">
                      Funds are held safely. The final payment is only released once you are completely satisfied with the work.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="mt-10 p-5 border border-white/5 bg-white/[0.02]">
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  <span className="text-white/80 font-medium">Win-Win:</span>{" "}
                  Once funds are secured, your freelancer can instantly access up to 85% of their pay to get started. You stay protected, and they get paid without waiting.
                </p>
              </div>
            </div>

          </div>

          {/* Job History Feed */}
          <div className="mt-8 border-t border-white/10 pt-12">
            <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Active Projects
            </h2>

            {jobsLoading ? (
              <div className="p-12 border border-white/5 bg-white/[0.01] flex justify-center text-white/50">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 border border-white/5 bg-white/[0.01] text-center text-white/50 font-light text-sm text-balance">
                No active projects yet. When you secure a new contract, it will appear here.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {jobs.map((job) => {
                  const onChainStatus = job.onChain
                    ? Object.keys(job.onChain.status)[0]
                    : job.status;

                  return (
                    <div key={job.id} className="p-6 bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                          <h3 className="text-lg font-light text-white">{job.jobTitle}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-light text-white">${job.amount / 100}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Secured</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-mono p-1.5 border border-white/10 bg-white/5 text-white/80">
                          {onChainStatus.replace(/_/g, ' ')}
                        </span>
                        <div className="flex gap-2">
                          {job.status === "PENDING" && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-red-500/70 py-1 px-2">
                                Waiting for Funds
                              </span>
                              <button
                                onClick={() => handleForceFund(job)}
                                className="text-[10px] px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors uppercase tracking-widest"
                              >
                                Force Fund (Dev)
                              </button>
                            </div>
                          )}
                          {(job.status === "ESCROW_FUNDED" || job.status === "ADVANCED") && (
                            <button
                              onClick={() => handleApproveMilestone(job)}
                              disabled={approvingId === job.id}
                              className="text-xs px-4 py-1.5 bg-white text-black hover:bg-white/80 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                            >
                              {approvingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              Approve & Release Funds
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  );
}