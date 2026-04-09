"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWalletConnection } from "@solana/react-hooks";
import { Plus, Briefcase, ExternalLink, Loader2, Link2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ClientDashboard() {
  const { wallet, status } = useWalletConnection();
  const address = wallet?.account.address.toString();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: "",
    amount: "",
    freelancerWallet: "",
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Please connect wallet first");

    setIsCreating(true);
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseInt(formData.amount) * 100, // convert to cents assuming USD
          clientWallet: address,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Redirect to Dodo Checkout
      window.location.href = data.paymentUrl;
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsCreating(false);
    }
  };

  if (status !== "connected") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Briefcase className="mb-4 h-16 w-16 text-white/20" />
        <h2 className="text-2xl font-bold text-white">Client Portal</h2>
        <p className="mt-2 text-white/50">Please connect your wallet to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Client Portal</h1>
            <p className="text-white/60 mt-1">Manage your escrows and freelance contracts.</p>
          </div>
        </div>

        {isSuccess && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400 text-sm">
            Payment successfully processed! Your escrow is being funded on-chain.
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Create Job Form */}
          <div className="glass-card flex flex-col">
            <div className="mb-6 flex animate-pulse items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                <Plus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Hire a Freelancer</h2>
            </div>

            <form onSubmit={handleCreateJob} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Job Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Smart Contract Audit"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Payout Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field pl-8"
                    placeholder="1000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Freelancer Wallet (Solana)</label>
                <input
                  type="text"
                  required
                  className="input-field font-mono text-sm"
                  placeholder="Enter public key..."
                  value={formData.freelancerWallet}
                  onChange={e => setFormData({ ...formData, freelancerWallet: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary mt-4 flex items-center justify-center gap-2 py-3.5"
              >
                {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Payment Link"}
              </button>
            </form>
          </div>

          {/* Guidelines / Info Box */}
          <div className="glass-card flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">How it works</h3>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400"></div>
                  <p>Enter the job details and freelancer's Solana address.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></div>
                  <p>You pay in fiat (USD) via Dodo Payments.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400"></div>
                  <p>The system automatically swaps and locks USDC in a trustless Solana smart contract.</p>
                </li>
              </ul>
            </div>

            <div className="mt-8 rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs text-white/40 leading-relaxed">
                Once funded, the freelancer can immediately withdraw an 85% advance. The remaining 15% is released upon your approval.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
