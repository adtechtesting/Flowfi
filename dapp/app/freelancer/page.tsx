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
    // In a real implementation this would trigger an Anchor transaction 
    // signed by the freelancer wallet, and then post to our API.
    // For MVP UI, we simulate the backend call logging.
    if (!wallet) return;
    setActionLoading(true);
    try {
      /*
       const tx = await program.methods.requestAdvance().accounts({...}).rpc();
      */
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
      <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Coins className="mb-4 h-16 w-16 text-white/20" />
        <h2 className="text-2xl font-bold text-white">Freelancer Hub</h2>
        <p className="mt-2 text-white/50">Please connect your wallet to view jobs and claim advances.</p>
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
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Freelancer Hub</h1>
            <p className="text-white/60 mt-1">Unlock advances and track your payments.</p>
          </div>

          <form onSubmit={fetchEscrow} className="flex w-full sm:w-auto relative">
            <input
              type="text"
              placeholder="Enter Invoice ID..."
              className="input-field pr-12 w-full sm:w-72"
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-1.5 hover:bg-white/20 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {escrowData ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="glass-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold text-white">Job Details</h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 border border-white/5 uppercase tracking-wide">
                  {escrowData.invoice.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Job Title</p>
                  <p className="text-base text-white">{escrowData.invoice.jobTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Total Amount</p>
                  <p className="text-3xl font-bold text-green-400">
                    ${(escrowData.invoice.amount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Client Wallet</p>
                  <p className="text-sm font-mono text-white/70 truncate">{escrowData.invoice.clientWallet}</p>
                </div>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-between relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl"></div>

              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Instant Advance
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  You are eligible to withdraw 85% of your payout immediately without waiting for client approval.
                </p>

                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-200/70 text-sm">Available Advance</span>
                    <span className="text-xl font-bold text-amber-400">
                      ${((escrowData.invoice.amount / 100) * 0.85).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleAdvanceRequest}
                  disabled={actionLoading || !escrowData.advanceEligible}
                  className="w-full relative overflow-hidden rounded-xl font-bold text-white transition-all duration-300 py-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: escrowData.advanceEligible ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "rgba(255,255,255,0.1)"
                  }}
                >
                  {actionLoading ? "Processing..." :
                    !escrowData.advanceEligible ? "Not Eligible or Already Claimed" :
                      "Claim 85% Advance Now"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card mt-8 flex flex-col items-center justify-center py-20 opacity-50 border-dashed">
            <ShieldCheck className="mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">Search for an invoice ID to view contract.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
