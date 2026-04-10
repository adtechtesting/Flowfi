"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWalletConnection } from "@solana/react-hooks";
import { Search, Coins, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function FreelancerDashboard() {
  const { wallet, status } = useWalletConnection();
  const address = wallet?.account.address.toString();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId") || "";

  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEscrow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!invoiceId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/escrow/${invoiceId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEscrowData(data);
    } catch (err: any) {
      alert("Error: " + err.message);
      setEscrowData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRequest = async () => {

    if (!wallet) return;
    setActionLoading(true);
    try {

      const mockTxHash = "5txMock" + Date.now();

      const res = await fetch("/api/advance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dodoInvoiceId: escrowData.invoice.dodoInvoiceId,
          txSignature: mockTxHash
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      alert(`Advance Successful! TX: ${mockTxHash}`);
      fetchEscrow(); // Refresh
    } catch (err: any) {
      alert("Failed to request advance: " + err.message);
    } finally {
      setActionLoading(false);
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
            <Coins className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">Freelancer Hub</h2>
          <p className="text-white/50 font-light tracking-wide text-sm leading-relaxed">
            Please connect your Solana wallet to view jobs and claim instant advances.
          </p>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl font-light text-white tracking-tight">Freelancer Hub</h1>
              <p className="text-white/50 mt-2 font-light tracking-wide">Unlock advances and track your payments.</p>
            </div>

            <form onSubmit={fetchEscrow} className="relative flex w-full md:w-80 group">
              <input
                type="text"
                placeholder="Enter Invoice ID..."
                className="w-full bg-white/[0.02] border border-white/10 pl-4 pr-12 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-light text-sm"
                style={{ borderRadius: '2px' }}
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </form>
          </div>

          {/* Dynamic Content Area */}
          {escrowData ? (
            <div className="grid gap-8 md:grid-cols-2">

              {/* Job Details Card */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 group transition-all duration-500 hover:border-white/20"
              >
                {/* Corner Accents */}
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
                <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
                <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/30 group-hover:bg-white transition-colors"></div>

                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                  <h2 className="text-xl font-light text-white tracking-wide">Job Details</h2>
                  <span className="bg-white/5 px-3 py-1 text-xs font-medium text-white/70 border border-white/10 uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                    {escrowData.invoice.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">Job Title</p>
                    <p className="text-lg text-white font-light">{escrowData.invoice.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">Total Amount</p>
                    <p className="text-4xl font-light text-white">
                      ${(escrowData.invoice.amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5 uppercase tracking-[0.1em] font-medium">Client Wallet</p>
                    <p className="text-sm font-mono text-white/60 truncate p-3 bg-white/[0.02] border border-white/5" style={{ borderRadius: '2px' }}>
                      {escrowData.invoice.clientWallet}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Advance Action Card */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-8 bg-[#050505] border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors overflow-hidden"
              >
                {/* Subtle Amber Glow Top Right */}
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px] pointer-events-none"></div>

                <div>
                  <h2 className="text-xl font-light text-white flex items-center gap-3 tracking-wide">
                    <Zap className="h-5 w-5 text-amber-500/80" strokeWidth={1.5} />
                    Instant Advance
                  </h2>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed font-light tracking-wide">
                    You are eligible to withdraw 85% of your payout immediately without waiting for client approval.
                  </p>

                  <div className="mt-8 p-5 border border-amber-500/10 bg-amber-500/[0.02]" style={{ borderRadius: '2px' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-500/50 text-sm font-medium tracking-wide uppercase">Available Draw</span>
                      <span className="text-2xl font-light text-amber-500/90">
                        ${((escrowData.invoice.amount / 100) * 0.85).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleAdvanceRequest}
                    disabled={actionLoading || !escrowData.advanceEligible}
                    className="w-full relative flex justify-center items-center gap-2 px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                    style={{
                      borderRadius: '2px',
                      backgroundColor: escrowData.advanceEligible ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      color: escrowData.advanceEligible ? '#000000' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {actionLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing</>
                    ) : !escrowData.advanceEligible ? (
                      "Not Eligible / Claimed"
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
              className="mt-4 p-20 flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] border-dashed"
              style={{ borderRadius: '2px' }}
            >
              <ShieldCheck className="mb-4 h-10 w-10 text-white/20" strokeWidth={1} />
              <p className="text-white/40 font-light tracking-wide text-sm">
                Search for an invoice ID to view contract and claim advances.
              </p>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}