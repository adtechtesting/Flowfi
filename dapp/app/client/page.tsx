"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWalletConnection } from "@solana/react-hooks";
import { Plus, Briefcase, Loader2, Info } from "lucide-react";
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
          amount: parseInt(formData.amount) * 100,
          clientWallet: address,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);


      window.location.href = data.paymentUrl;
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsCreating(false);
    }
  };


  if (status !== "connected") {
    return (
      <div className="relative min-h-screen bg-black w-full flex items-center justify-center overflow-hidden font-sans selection:bg-white/20 selection:text-white">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-12 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 flex flex-col items-center text-center max-w-md w-full mx-4 group"
        >
          {/* Corner Accents */}
          <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
          <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
          <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
          <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>

          <div className="mb-6 p-4 bg-white/[0.03] border border-white/5 inline-flex" style={{ borderRadius: '2px' }}>
            <Briefcase className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">Client Portal</h2>
          <p className="text-white/50 font-light tracking-wide text-sm leading-relaxed">
            Please connect your Solana wallet to manage escrows and deploy instant payment rails.
          </p>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">Client Portal</h1>
              <p className="text-white/50 mt-2 font-light tracking-wide">Manage your escrows and freelance contracts.</p>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs font-mono text-white/70 tracking-wider uppercase">Network Live</span>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="relative p-4 bg-green-500/5 border border-green-500/20 flex items-center gap-3 group"
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <p className="text-green-400/90 text-sm font-light tracking-wide">
                Payment successfully processed. Your escrow is being funded on-chain.
              </p>
            </motion.div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">

            {/* Create Job Form (Takes up 3/5 width on desktop) */}
            <div className="relative lg:col-span-3 p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 group transition-all duration-500 hover:border-white/20">
              {/* Corner Accents */}
              <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
              <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
              <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
              <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center bg-white/[0.03] border border-white/5 text-white" style={{ borderRadius: '2px' }}>
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-light text-white tracking-tight">Hire a Freelancer</h2>
              </div>

              <form onSubmit={handleCreateJob} className="flex flex-col gap-6">
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">Job Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-light"
                    style={{ borderRadius: '2px' }}
                    placeholder="e.g. Smart Contract Audit"
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">Payout Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-light">$</span>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-white/[0.02] border border-white/10 pl-8 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-light"
                      style={{ borderRadius: '2px' }}
                      placeholder="1000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium tracking-[0.1em] text-white/50 uppercase">Freelancer Wallet (Solana)</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-mono text-sm"
                    style={{ borderRadius: '2px' }}
                    placeholder="Enter public key..."
                    value={formData.freelancerWallet}
                    onChange={e => setFormData({ ...formData, freelancerWallet: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="mt-4 flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black font-medium transition-all duration-300 w-full shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ borderRadius: '2px' }}
                >
                  {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Payment Link"}
                </button>
              </form>
            </div>

            {/* Guidelines / Info Box (Takes up 2/5 width on desktop) */}
            <div className="relative lg:col-span-2 p-8 bg-[#050505] border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                  <h3 className="text-lg font-light text-white tracking-wide">How it works</h3>
                </div>

                <ul className="space-y-6 text-sm text-white/60 font-light">
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
                    <p className="leading-relaxed">Enter the project details and the freelancer's exact Solana public address.</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
                    <p className="leading-relaxed">You securely checkout and pay in fiat (USD) via the Dodo Payments gateway.</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
                    <p className="leading-relaxed">The system automatically swaps your fiat and locks USDC in a trustless Solana smart contract.</p>
                  </li>
                </ul>
              </div>

              <div className="mt-10 p-5 border border-white/5 bg-white/[0.02]" style={{ borderRadius: '2px' }}>
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  <span className="text-white/80 font-medium tracking-wide">Advance Notice:</span> Once funded on-chain, the freelancer can immediately draw an 85% salary advance. The remaining 15% is released upon your final approval.
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}