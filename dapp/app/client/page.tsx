"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Plus, Briefcase, Loader2, Info, CheckCircle, ExternalLink, Zap, Clock, ShieldCheck, ArrowRight, Wallet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import {
  buildInitializeEscrowTx,
  buildApproveMilestoneTx,
} from "../lib/solana/client";
import { getEscrowPda } from "../lib/solana/constants";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: "Awaiting Funds", color: "text-yellow-400/70 bg-yellow-500/5 border-yellow-500/20", dot: "bg-yellow-400" },
  ESCROW_FUNDED: { label: "Funds Secured", color: "text-green-400/70 bg-green-500/5 border-green-500/20", dot: "bg-green-400" },
  FUNDED: { label: "Funds Secured", color: "text-green-400/70 bg-green-500/5 border-green-500/20", dot: "bg-green-400" },
  ADVANCED: { label: "Advance Paid", color: "text-amber-400/70 bg-amber-500/5 border-amber-500/20", dot: "bg-amber-400" },
  APPROVED: { label: "Approved", color: "text-blue-400/70 bg-blue-500/5 border-blue-500/20", dot: "bg-blue-400" },
  RELEASED: { label: "Fully Paid", color: "text-purple-400/70 bg-purple-500/5 border-purple-500/20", dot: "bg-purple-400" },
  CANCELLED: { label: "Cancelled", color: "text-red-400/70 bg-red-500/5 border-red-500/20", dot: "bg-red-400" },
  FAILED: { label: "Failed", color: "text-red-400/70 bg-red-500/5 border-red-500/20", dot: "bg-red-500" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const c = STATUS_CONFIG[status] ?? { label: status, color: "text-white/40 bg-white/5 border-white/10", dot: "bg-white/30" };
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-[9px] font-bold border uppercase tracking-[0.2em] ${c.color} rounded-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shadow-[0_0_8px_${c.dot.replace('bg-', '')}]`} />
      {c.label}
    </span>
  );
};

interface PendingJob {
  jobTitle: string;
  amount: string;
  freelancerWallet: string;
  durationDays: number;
  tempInvoiceId: string;
  escrowPda: string;
}

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

  // Real-time synchronization for pending jobs
  useEffect(() => {
    if (!publicKey || jobs.length === 0) return;

    const pendingJobs = jobs.filter(j => j.status === "PENDING" && j.escrowPda);
    if (pendingJobs.length === 0) return;

    const subscriptions: number[] = [];

    import("../lib/solana/client").then(({ subscribeToEscrow }) => {
      pendingJobs.forEach(job => {
        try {
          const subId = subscribeToEscrow(
            connection,
            new PublicKey(job.escrowPda),
            () => {
              console.log(`Live update detected for project: ${job.jobTitle}`);
              loadMyJobs();
            }
          );
          subscriptions.push(subId);
        } catch (e) {
          console.error("Subscription failed:", e);
        }
      });
    });

    return () => {
      subscriptions.forEach(id => {
        try { connection.removeAccountChangeListener(id); } catch (e) { }
      });
    };
  }, [jobs, connection, publicKey]);

  const loadMyJobs = async () => {
    if (!publicKey) return;
    setJobsLoading(true);
    try {
      const res = await fetch(`/api/invoices?clientWallet=${publicKey.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setJobsLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingJobData, setPendingJobData] = useState<PendingJob | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [editingJob, setEditingJob] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this project?")) return;
    setIsDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }
      await loadMyJobs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${editingJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: editingJob.jobTitle,
          amount: editingJob.amount,
          freelancerWallet: editingJob.freelancerWallet,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project");
      }
      setEditingJob(null);
      await loadMyJobs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

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
    durationDays: 30,
  });

  const handlePreConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return alert("Please connect your wallet first");

    const amountNum = parseFloat(formData.amount);
    if (amountNum > 10) {
      return alert("Devnet Limit: Maximum funding amount is $10.00 during the testing period.");
    }

    try {
      new PublicKey(formData.freelancerWallet);
    } catch {
      return alert("Invalid freelancer wallet address");
    }

    const tempInvoiceId = "inv_" + Date.now().toString().slice(-10);
    const [pda] = getEscrowPda(publicKey, tempInvoiceId);

    setPendingJobData({
      ...formData,
      tempInvoiceId,
      escrowPda: pda.toString(),
    });
    setShowConfirmModal(true);
  };

  const handleCreateJob = async () => {
    if (!publicKey || !pendingJobData) return;

    setIsCreating(true);
    setShowConfirmModal(false);

    try {
      const amountUsd = parseFloat(pendingJobData.amount);

      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: pendingJobData.jobTitle,
          amount: Math.round(amountUsd * 100),
          clientWallet: publicKey!.toString(),
          freelancerWallet: pendingJobData.freelancerWallet,
          durationDays: pendingJobData.durationDays,
          customInvoiceId: pendingJobData.tempInvoiceId, // Pass the pre-calculated ID
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to secure project");

      // AUTHORIZATION STEP: Sign the transaction to prove wallet ownership
      const walletAdapter = { publicKey: publicKey!, signTransaction: signTransaction! };
      const tx = await buildInitializeEscrowTx(
        connection,
        walletAdapter,
        data.dodoInvoiceId,
        amountUsd,
        publicKey!,
        new PublicKey(pendingJobData.freelancerWallet),
        new PublicKey(data.authorityPubkey)
      );

      const txId = await sendTransaction(tx, connection);

      // REDIRECT STEP: Go to Dodo after on-chain authorization
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
          className="relative z-10 p-12 liquid-glass-strong glow-ring noise rounded-3xl flex flex-col items-center text-center max-w-md w-full mx-4"
        >
          <div className="mb-6 p-4 liquid-glass-strong rounded-2xl inline-flex">
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
              <h1 className="text-3xl font-light text-white tracking-tight mb-4">
                Client Dashboard
              </h1>
              <p className="text-white/50 text-lg font-light leading-relaxed max-w-xl">
                Manage your active projects, lock funds securely, and release payments exactly when the work is done.
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-10 w-10 items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white">
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-light text-white tracking-tight leading-none">
                    Start a New Project
                  </h2>
                  <p className="text-[11px] text-white/30 font-light mt-1.5 tracking-tight uppercase tracking-[0.05em]">Secure your next collaboration on-chain</p>
                </div>
              </div>

              <form onSubmit={handlePreConfirm} className="space-y-5 bg-zinc-900/30 p-8 rounded-3xl border border-white/5 shadow-2xl">
                {/* Project Identity */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/20 uppercase tracking-[0.2em] ml-1 font-bold">Project Identity</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      className="w-full bg-white/[0.02] border border-white/5 px-5 py-3 rounded-xl text-white placeholder-white/10 focus:outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all font-light text-sm"
                      placeholder="Project title..."
                      value={formData.jobTitle}
                      onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                    <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/30 transition-colors" />
                  </div>
                </div>

                {/* Freelancer Wallet */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-white/20 uppercase tracking-[0.2em] ml-1 font-bold">Freelancer Wallet</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      className="w-full bg-white/[0.02] border border-white/5 px-5 py-3 rounded-xl text-white placeholder-white/10 focus:outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all font-mono text-[11px] tracking-wider"
                      placeholder="Solana address..."
                      value={formData.freelancerWallet}
                      onChange={e => setFormData({ ...formData, freelancerWallet: e.target.value })}
                    />
                    <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/30 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/20 uppercase tracking-[0.2em] ml-1 font-bold">Funding Amount (USD)</label>
                    <div className="relative group">
                      <input
                        type="number"
                        required
                        max="10"
                        className="w-full bg-white/[0.02] border border-white/5 pl-9 pr-4 py-3 rounded-xl text-white placeholder-white/10 focus:outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all font-light text-sm"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-light">$</span>
                      <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/30 transition-colors" />
                    </div>
                    <p className="mt-2 text-[8px] text-amber-500/50 uppercase tracking-widest font-bold">Testing Safety Limit: Max $10.00</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-white/20 uppercase tracking-[0.2em] ml-1 font-bold">Auto-Release Schedule</label>
                    <div className="relative group">
                      <select
                        className="w-full bg-white/[0.02] border border-white/5 px-5 py-3 rounded-xl text-white focus:outline-none focus:border-white/10 focus:bg-white/[0.04] transition-all font-light text-sm appearance-none cursor-pointer"
                        value={formData.durationDays}
                        onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                      >
                        <option value={7} className="bg-zinc-900 text-xs">7 Days</option>
                        <option value={14} className="bg-zinc-900 text-xs">14 Days</option>
                        <option value={30} className="bg-zinc-900 text-xs">30 Days</option>
                        <option value={60} className="bg-zinc-900 text-xs">60 Days</option>
                      </select>
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-white/30 transition-colors pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col items-center gap-4">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                  >
                    {isCreating ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Authorizing...</>
                    ) : (
                      <>
                        Secure Project & Hire
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-500/40" />
                    <span className="text-[8px] text-white/20 uppercase tracking-[0.25em] font-medium font-mono">Verified Smart Contract Protection</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Info className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                </div>
                <h3 className="text-[11px] font-bold text-white/40 tracking-[0.2em] uppercase">
                  How it works
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 group">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[10px] text-white/30 font-mono group-hover:border-white/20 transition-colors">01</div>
                    <p className="text-[12px] text-white/40 leading-relaxed font-light">
                      Enter the project details and the freelancer's wallet address.
                    </p>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[10px] text-white/30 font-mono group-hover:border-white/20 transition-colors">02</div>
                    <p className="text-[12px] text-white/40 leading-relaxed font-light">
                      Securely lock the payment upfront using your preferred method.
                    </p>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[10px] text-white/30 font-mono group-hover:border-white/20 transition-colors">03</div>
                    <p className="text-[12px] text-white/40 leading-relaxed font-light">
                      Funds are held safely. The final payment is only released once you are completely satisfied with the work.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2.5 text-emerald-500/80 uppercase tracking-[0.2em] text-[9px] font-bold">
                      <Zap className="w-3 h-3 animate-pulse" />
                      Win-Win Protocol
                    </div>
                    <p className="text-[11px] text-emerald-500/40 leading-relaxed font-light">
                      Once funds are secured, your freelancer can instantly access up to <span className="text-emerald-400 font-medium">85% of their pay</span> to get started. You stay protected, and they get paid without waiting.
                    </p>
                  </div>
                </div>
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
              <div className="p-12 liquid-glass-strong noise rounded-3xl flex justify-center text-white/50">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 liquid-glass-strong noise rounded-3xl text-center text-gray-400 font-light text-sm text-balance">
                No active projects yet. When you secure a new contract, it will appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {jobs.map((job) => {
                  const onChainStatus = job.onChain
                    ? Object.keys(job.onChain.status)[0]
                    : job.status;

                  return (
                    <div key={job.id} className="relative p-6 md:p-8 bg-zinc-900/40 border border-white/10 rounded-3xl transition-all flex flex-col md:flex-row gap-8 justify-between items-center group shadow-xl backdrop-blur-md">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-4 mb-5">
                          <h2 className="text-xl font-light text-white tracking-tight">{job.jobTitle}</h2>
                          <StatusBadge status={onChainStatus} />
                        </div>

                        <div className="flex flex-wrap gap-12 border-t border-white/5 pt-6">
                          <div className="space-y-1.5">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Funds Secured</p>
                            <p className="text-emerald-400 font-light text-lg tracking-tight">${(job.amount / 100).toLocaleString()} <span className="text-[10px] text-white/20 ml-1 font-mono">USDC</span></p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Service Provider</p>
                            <p className="text-white/40 font-mono text-xs mt-0.5 tracking-wider">{job.freelancerWallet.slice(0, 8)}...{job.freelancerWallet.slice(-8)}</p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Deployment Date</p>
                            <p className="text-white/40 font-light text-sm">{new Date(job.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                          </div>
                          {job.scheduledReleaseAt && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] text-amber-500/40 uppercase tracking-[0.2em] font-bold">Auto-Release Protcol</p>
                              <p className="text-amber-500/80 font-light text-sm flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 opacity-60" />
                                {new Date(job.scheduledReleaseAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
                        {job.status === "PENDING" && (
                          <div className="w-full md:w-52 flex flex-col gap-2">
                            <button
                              onClick={() => handleForceFund(job)}
                              className="w-full text-[10px] py-3.5 bg-emerald-500/[0.05] text-emerald-500/70 border border-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 transition-all uppercase tracking-[0.2em] font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                              <Zap className="w-3 h-3" />
                              Dev: Secure Funds
                            </button>
                            <button
                              onClick={() => setEditingJob({ ...job, amount: job.amount / 100 })}
                              className="w-full text-[10px] py-3.5 bg-white/[0.03] text-white/50 border border-white/5 hover:border-white/20 hover:text-white transition-all uppercase tracking-[0.2em] font-bold rounded-xl"
                            >
                              Edit Protocol
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={isDeletingId === job.id}
                              className="w-full text-[10px] py-3.5 bg-red-500/[0.03] text-red-400/50 border border-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all uppercase tracking-[0.2em] font-bold rounded-xl disabled:opacity-50"
                            >
                              {isDeletingId === job.id ? "Processing..." : "Terminate Agreement"}
                            </button>
                          </div>
                        )}

                        {(job.status === "ESCROW_FUNDED" || job.status === "ADVANCED") && (
                          <button
                            onClick={() => handleApproveMilestone(job)}
                            disabled={approvingId === job.id}
                            className="w-full md:w-52 flex justify-center items-center gap-3 px-6 py-4 bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 shadow-xl"
                          >
                            {approvingId === job.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Finalizing...</> : <>Approve & Release <ArrowRight className="w-4 h-4" /></>}
                          </button>
                        )}

                        {(job.status === "RELEASED" || job.status === "COMPLETED") && (
                          <div className="w-full md:w-52 text-[10px] px-6 py-4 bg-emerald-500/5 text-emerald-500 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-emerald-500/20 rounded-xl">
                            <CheckCircle className="h-4 w-4" /> Agreement Finalized
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Edit Job Modal */}
      <AnimatePresence>
        {editingJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md liquid-glass-strong glow-ring noise rounded-3xl p-8"
            >
              <h3 className="text-xl font-light text-white mb-6">Edit Project</h3>
              <form onSubmit={handleUpdateJob} className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                    value={editingJob.jobTitle}
                    onChange={e => setEditingJob({ ...editingJob, jobTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.01"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-light"
                    value={editingJob.amount}
                    onChange={e => setEditingJob({ ...editingJob, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">
                    Freelancer Wallet
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                    value={editingJob.freelancerWallet}
                    onChange={e => setEditingJob({ ...editingJob, freelancerWallet: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="flex-1 py-3 bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && pendingJobData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 shadow-2xl rounded-[2rem] p-7 md:p-9 overflow-hidden text-left"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Finalize Project Funding</span>
                </div>
                <h3 className="text-xl font-light text-white tracking-tight">Secure Agreement Authorization</h3>
              </div>

              {/* Stats Grid */}
              <div className="space-y-3.5 mb-7 bg-white/[0.03] rounded-2xl p-5 border border-white/5 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Project Name</span>
                  <span className="text-xs text-white font-light">{pendingJobData.jobTitle}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Funding Amount</span>
                  <span className="text-sm text-emerald-400 font-bold">${pendingJobData.amount} <span className="text-[9px] text-white/20 font-light">USDC</span></span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Freelancer</span>
                  <span className="text-[9px] font-mono text-white/40">{pendingJobData.freelancerWallet.slice(0, 6)}...{pendingJobData.freelancerWallet.slice(-6)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Escrow PDA Address</span>
                  <span className="text-[9px] font-mono text-white/40">{pendingJobData.escrowPda.slice(0, 8)}...{pendingJobData.escrowPda.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Network Fees</span>
                  <div className="text-right">
                    <span className="text-[9px] block text-emerald-500/80 font-bold uppercase tracking-widest">Sponsored by FlowFi</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="px-1 mb-7">
                <p className="text-[11px] text-white/40 leading-relaxed font-light">
                  You will provide a one-time authorization to secure these funds. This ensures <span className="text-white/60">wallet integrity</span> and project protection. FlowFi covers all infrastructure costs for this deployment.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleCreateJob}
                  disabled={isCreating}
                  className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Authorize & Pay via Dodo"}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3.5 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] hover:text-white/40 transition-all"
                >
                  Edit Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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