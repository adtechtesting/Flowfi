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
      console.error(e);
    } finally {
      setJobsLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
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
          durationDays: formData.durationDays,
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

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">

            {/* Create job form */}
            <div className="relative lg:col-span-3 p-8 md:p-10 liquid-glass-strong glow-ring noise rounded-[2rem] transition-all duration-500">
              <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
              <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>

              <div className="mb-10 flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="flex h-12 w-12 items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white">
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-light text-white tracking-tight">
                    Start a New Project
                  </h2>
                  <p className="text-sm text-white/40 font-light mt-1">Deploy capital securely into a new smart contract.</p>
                </div>
              </div>

              <form onSubmit={handleCreateJob} className="flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-[10px] font-medium tracking-widest text-white/40 uppercase">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white/[0.02] border border-white/10 px-5 py-3.5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all font-light"
                      placeholder="e.g. Website Redesign"
                      value={formData.jobTitle}
                      onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-medium tracking-widest text-white/40 uppercase">
                      Total Payment (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-light">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className="w-full bg-white/[0.02] border border-white/10 pl-9 pr-5 py-3.5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all font-light"
                        placeholder="1000.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium tracking-widest text-white/40 uppercase">
                    Freelancer Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-5 py-3.5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all font-mono text-sm tracking-wide"
                    placeholder="Enter Solana public key..."
                    value={formData.freelancerWallet}
                    onChange={e =>
                      setFormData({ ...formData, freelancerWallet: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium tracking-widest text-white/40 uppercase">
                    Payment Release Schedule (Auto-Approval)
                  </label>
                  <select
                    className="w-full bg-white/[0.02] border border-white/10 px-5 py-3.5 rounded-xl text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all font-light appearance-none"
                    value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  >
                    <option value={7} className="bg-zinc-900">7 Days (Fast-track)</option>
                    <option value={14} className="bg-zinc-900">14 Days (Standard)</option>
                    <option value={30} className="bg-zinc-900">30 Days (Monthly)</option>
                    <option value={60} className="bg-zinc-900">60 Days (Enterprise)</option>
                  </select>
                  <p className="text-[10px] text-white/30 mt-2 font-light">
                    Funds will automatically release to the freelancer after this period if no dispute is raised.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="mt-6 flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all w-full disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {isCreating ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Securing Funds on Network...</>
                  ) : (
                    "Secure Funds & Hire"
                  )}
                </button>
              </form>
            </div>

            {/* Info panel */}
            <div className="relative lg:col-span-2 p-8 md:p-10 liquid-glass-strong glow-ring noise rounded-3xl flex flex-col justify-between transition-colors">
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

              <div className="mt-10 p-6 liquid-glass rounded-2xl">
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  <span className="text-white font-medium">Win-Win:</span>{" "}
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
                    <div key={job.id} className="relative p-6 md:p-8 liquid-glass-strong glow-ring noise rounded-3xl transition-all flex flex-col md:flex-row gap-8 justify-between items-center group">
                      {/* Micro Corner Accents */}
                      <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>
                      <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>
                      <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>
                      <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>

                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-4 mb-4">
                          <h2 className="text-xl font-light text-white tracking-tight">{job.jobTitle}</h2>
                          <span className="text-[9px] px-2 py-0.5 bg-white/5 text-white/50 uppercase tracking-widest border border-white/10 rounded-sm">
                            {onChainStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-12 border-t border-white/5 pt-5">
                          <div>
                            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Date Created</p>
                            <p className="text-white/80 font-light">{new Date(job.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Total Secured</p>
                            <p className="text-green-400/90 font-light">${job.amount / 100} USDC</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Freelancer</p>
                            <p className="text-white/50 font-mono text-sm mt-0.5">{job.freelancerWallet.slice(0, 4)}...{job.freelancerWallet.slice(-4)}</p>
                          </div>
                          {job.scheduledReleaseAt && (
                            <div>
                              <p className="text-[9px] text-amber-500/60 uppercase tracking-[0.2em] mb-1.5">Auto-Release Date</p>
                              <p className="text-amber-500/90 font-light flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(job.scheduledReleaseAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
                        {job.status === "PENDING" && (
                          <div className="w-full md:w-48 flex flex-col gap-2">
                            <button
                              onClick={() => setEditingJob({ ...job, amount: job.amount / 100 })}
                              className="w-full text-[10px] py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest rounded-lg"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={isDeletingId === job.id}
                              className="w-full text-[10px] py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors uppercase tracking-widest disabled:opacity-50 rounded-lg"
                            >
                              {isDeletingId === job.id ? "..." : "Delete Project"}
                            </button>
                            <button
                              onClick={() => handleForceFund(job)}
                              className="w-full text-[10px] py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors uppercase tracking-widest rounded-lg"
                            >
                              Force Fund (Dev)
                            </button>
                          </div>
                        )}

                        {(job.status === "ESCROW_FUNDED" || job.status === "ADVANCED") && (
                          <button
                            onClick={() => handleApproveMilestone(job)}
                            disabled={approvingId === job.id}
                            className="w-full md:w-48 flex justify-center items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-100 text-black font-medium rounded-lg transition-all disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          >
                            {approvingId === job.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Approving...</> : "Approve & Release"}
                          </button>
                        )}

                        {(job.status === "RELEASED" || job.status === "COMPLETED") && (
                          <div className="w-full md:w-48 text-sm px-6 py-3.5 bg-white/5 text-white/70 font-light flex items-center justify-center gap-2 border border-white/10 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-white/50" /> Fully Released
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