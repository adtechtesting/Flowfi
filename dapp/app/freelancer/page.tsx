"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Coins, CheckCircle, ExternalLink, ShieldCheck, Zap, Clock, Info, Banknote, X } from "lucide-react";
import { buildRequestAdvanceTx } from "../lib/solana/client";
import { USDC_MINT } from "../lib/solana/constants";
import { TransakConfig, Transak } from '@transak/ui-js-sdk';
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

  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [exchangeFee, setExchangeFee] = useState<number>(0);

  useEffect(() => {
    if (publicKey) {
      loadMyJobs();
      loadWalletBalance();
    } else {
      setJobs([]);
      setUsdcBalance(0);
    }
  }, [publicKey]);

  const loadWalletBalance = async () => {
    if (!publicKey) return;
    try {
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const ata = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const balance = await connection.getTokenAccountBalance(ata);
      setUsdcBalance(balance.value.uiAmount || 0);

      // Fetch real-time exchange rate
      const rateRes = await fetch("/api/exchange-rate");
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        setExchangeRate(rateData.rate);
        setExchangeFee(rateData.fee);
      }
    } catch {
      setUsdcBalance(0);
    }
  };

  const loadMyJobs = async () => {
    if (!publicKey) return;
    setLoading(true); setError(null); setTxSuccess(null);
    try {
      const res = await fetch(`/api/invoices?freelancerWallet=${publicKey.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load projects");
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
        ? "Withdrawal cancelled."
        : e.message || "Failed to withdraw funds");
    } finally {
      setAdvanceLoadingId(null);
    }
  };

  const handleWithdrawToBank = async (usdcAmount: number) => {
    if (!publicKey) return setError("Connect wallet first");
    if (usdcAmount <= 0) return setError("No funds available to withdraw");

    try {
      const response = await fetch('/api/transak/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: usdcAmount,
          walletAddress: publicKey.toString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create withdrawal session.');
      }

      const transakConfig: TransakConfig = {
        widgetUrl: data.widgetUrl,
        widgetHeight: "700px",
        widgetWidth: "450px",
      };

      const transak = new Transak(transakConfig);
      transak.init();

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
        console.log("Withdrawal successful:", orderData);
        transak.close();
        setTimeout(() => loadWalletBalance(), 5000);
      });

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        transak.close();
        setTimeout(() => loadWalletBalance(), 1000);
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize withdrawal");
    }
  };

  if (!connected) {
    return (
      <div className="relative min-h-screen bg-black w-full flex items-center justify-center overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-12 liquid-glass-strong glow-ring noise rounded-3xl flex flex-col items-center text-center max-w-md w-full mx-4">
          <div className="mb-6 p-4 liquid-glass-strong rounded-2xl inline-flex">
            <Coins className="h-8 w-8 text-white/50" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-3">Freelancer Dashboard</h2>
          <p className="text-white/50 font-light text-sm leading-relaxed">
            Connect your wallet to access your projects and unlock your earnings instantly.
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

          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-light text-white tracking-tight mb-4">Freelancer Hub</h1>
            <p className="text-white/50 text-lg font-light leading-relaxed max-w-xl">
              Access your earnings immediately. Withdraw up to 85% of your pay the moment a client secures funds on the network.
            </p>
          </div>

          {/* Wallet / Withdraw Banner */}
          <div className="liquid-glass-strong glow-ring noise p-8 md:p-10 rounded-[2rem] relative group flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
            <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
            <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
            <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>

            <div className="flex-1 w-full lg:w-auto">
              <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-4">Total Available to Withdraw</p>
              <div className="flex items-baseline gap-4 mb-6 lg:mb-0">
                <span className="text-4xl font-light text-white tracking-tight">{usdcBalance.toFixed(2)}</span>
                <span className="text-xl text-white/30 font-light tracking-wide">USDC</span>
              </div>
            </div>

            <div className="w-full lg:w-[480px] shrink-0 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-white/40 font-light">Exchange Rate</span>
                <span className="text-white/80 font-mono text-xs tracking-wide">
                  {exchangeRate ? `1 USDC ≈ ${exchangeRate.toFixed(2)} INR` : <Loader2 className="w-3 h-3 animate-spin" />}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mb-6 pt-4 border-t border-white/5">
                <span className="text-white/40 font-light">You Receive</span>
                <span className="text-green-400 font-mono text-lg tracking-wide">
                  {exchangeRate ? `₹${((usdcBalance * exchangeRate) - exchangeFee).toFixed(2)}` : "..."}
                </span>
              </div>

              <button
                onClick={() => handleWithdrawToBank(usdcBalance)}
                disabled={usdcBalance <= 0}
                className="w-full py-4 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[15px] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
              >
                Withdraw to Bank
              </button>
              <div className="text-[9px] text-white/30 text-center mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
                Powered by <img src="https://transak.com/favicon.ico" className="w-3 h-3 grayscale opacity-40" alt="Transak" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-10">
            <h2 className="text-2xl font-light text-white tracking-tight mb-8 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              Active Projects
            </h2>
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
                  <p className="text-green-400/90 text-sm font-light">Success! Your funds have been instantly transferred to your wallet.</p>
                </div>
                <a href={explorerUrl(txSuccess)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-400/60 hover:text-green-400 transition-colors font-mono">
                  Receipt <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jobs List */}
          {jobs.length === 0 && !loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 p-20 flex flex-col items-center justify-center liquid-glass-strong noise rounded-3xl text-center">
              <ShieldCheck className="mb-4 h-10 w-10 text-white/20" strokeWidth={1} />
              <p className="text-white/40 font-light text-sm text-center max-w-sm leading-relaxed">
                No active projects yet. When a client secures your payment, it will appear here ready for withdrawal.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => {
                const totalUsdc = job.onChain
                  ? formatUsdc(job.onChain.amount)
                  : (job.amount / 100).toFixed(2);

                const onChainStatusKey = job.onChain ? Object.keys(job.onChain.status)[0] : "unknown";
                const isFunded = onChainStatusKey === "funded" || job.status === "ESCROW_FUNDED" || job.status === "ADVANCED" || job.status === "FUNDED";
                const isAdvanced = job.onChain?.advanced || job.status === "ADVANCED";
                const advanceEligible = (isFunded || job.status === "ESCROW_FUNDED") && !isAdvanced;

                const advanceUsdc = isAdvanced && job.onChain
                  ? formatUsdc(job.onChain.advanceAmount)
                  : (parseFloat(totalUsdc) * 0.85).toFixed(2);
                const remainingUsdc = (parseFloat(totalUsdc) - parseFloat(advanceUsdc)).toFixed(2);

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
                        {isAdvanced && <span className="text-[9px] px-2 py-0.5 bg-white/5 text-white/50 uppercase tracking-widest border border-white/10 rounded-sm">Advance Withdrawn</span>}
                      </div>

                      <div className="flex flex-wrap gap-12 border-t border-white/5 pt-5">
                        <div>
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Total Pay</p>
                          <p className="text-white/80 font-light">${totalUsdc} USDC</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Available Now</p>
                          <p className="text-amber-500/90 font-light">${advanceUsdc} USDC</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1.5">Final Release</p>
                          <p className="text-white/50 font-light">${remainingUsdc} USDC</p>
                        </div>
                        {job.scheduledReleaseAt && (
                          <div>
                            <p className="text-[9px] text-amber-500/60 uppercase tracking-[0.2em] mb-1.5">Auto-Release Date</p>
                            <p className="text-amber-500/90 font-light flex items-center gap-1.5 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(job.scheduledReleaseAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
                      {advanceEligible ? (
                        <button
                          onClick={() => handleClaimAdvance(job)}
                          disabled={advanceLoadingId === job.id}
                          className="w-full md:w-48 flex justify-center items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-100 text-black font-medium rounded-lg transition-all disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        >
                          {advanceLoadingId === job.id
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                            : <><Zap className="h-4 w-4" /> Get Paid Now</>
                          }
                        </button>
                      ) : onChainStatusKey === "released" ? (
                        <div className="w-full md:w-48 text-sm px-6 py-3.5 bg-white/5 text-white/70 font-light flex items-center justify-center gap-2 border border-white/10 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white/50" /> Payment Complete
                        </div>
                      ) : isAdvanced ? (
                        <div className="w-full md:w-48 text-sm px-6 py-3.5 bg-white/5 text-white/60 font-light flex items-center justify-center gap-2 border border-white/5 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-amber-500/70" /> Advance Withdrawn
                        </div>
                      ) : (
                        <div className="w-full md:w-48 text-sm px-6 py-3.5 bg-transparent text-white/30 font-light flex items-center justify-center gap-2 border border-dashed border-white/10 rounded-lg">
                          <Clock className="h-4 w-4" /> Awaiting Deposit
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