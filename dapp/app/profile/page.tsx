"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Briefcase, Coins, TrendingUp, Clock, CheckCircle,
    ExternalLink, Copy, Loader2, Zap, XCircle, AlertCircle,
    ArrowRight, ShieldCheck,
} from "lucide-react";
import { Spotlight } from "../components/ui/spotlight-new";

const explorerUrl = (sig: string) =>
    `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

const explorerAddr = (addr: string) =>
    `https://explorer.solana.com/address/${addr}?cluster=devnet`;

const truncate = (s: string, n = 8) =>
    s ? `${s.slice(0, n)}...${s.slice(-n)}` : "";

const formatUsdc = (v: any): string => {
    if (!v) return "0.00";
    const n = parseFloat(v.toString ? v.toString() : String(v));
    return isNaN(n) ? "0.00" : (n / 1_000_000).toFixed(2);
};

const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};


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

function TimelineEvent({ icon: Icon, label, sig, time, color = "text-white/50" }: {
    icon: any; label: string; sig?: string | null; time?: string; color?: string;
}) {
    return (
        <div className="flex items-start gap-4 py-3">
            <div className={`mt-0.5 shrink-0 ${color}`}>
                <Icon className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-light tracking-wide">{label}</p>
                {sig && (
                    <a href={explorerUrl(sig)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white/70 transition-colors mt-1">
                        {truncate(sig, 8)} <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
            {time && <span className="text-xs text-white/30 shrink-0 font-light tracking-wide">{timeAgo(time)}</span>}
        </div>
    );
}



function JobCard({ job, role }: { job: any; role: "client" | "freelancer" }) {
    const [expanded, setExpanded] = useState(false);

    const onChainStatus = job.onChain ? Object.keys(job.onChain.status)[0] : null;
    const amountUsd = job.displayAmountUsd || (job.amount / 100).toFixed(2);
    const advanceUsd = job.onChain?.advanced
        ? formatUsdc(job.onChain.advanceAmount)
        : (parseFloat(amountUsd) * 0.85).toFixed(2);


    const events = [
        job.createdAt && { icon: Briefcase, label: "Project started", time: job.createdAt, color: "text-white/40" },
        job.txSignature && { icon: Coins, label: "Funds secured safely", sig: job.txSignature, time: job.updatedAt, color: "text-green-400/80" },
        job.advanceTxSig && { icon: Zap, label: `Advance withdrawn — $${advanceUsd} USDC`, sig: job.advanceTxSig, time: job.updatedAt, color: "text-amber-400/80" },
        job.releaseTxSig && { icon: CheckCircle, label: "Final payment sent", sig: job.releaseTxSig, time: job.updatedAt, color: "text-purple-400/80" },
    ].filter(Boolean) as any[];

    return (
        <div className="relative bg-zinc-900/40 border border-white/10 rounded-3xl transition-all duration-500 group overflow-hidden shadow-xl backdrop-blur-md">

            {/* Summary row */}
            <div
                className="p-6 md:p-8 flex items-start justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 flex-wrap mb-4">
                        <h3 className="text-xl text-white font-light tracking-tight">{job.jobTitle}</h3>
                        <StatusBadge status={job.status} />
                    </div>
                    <div className="flex gap-8 flex-wrap">
                        <div className="space-y-1">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Project Value</p>
                            <p className="text-sm text-white/80 font-light tracking-wide">${amountUsd} USDC</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Contract ID</p>
                            <p className="text-sm text-white/40 font-mono">{job.dodoInvoiceId?.slice(0, 12)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Initiated</p>
                            <p className="text-sm text-white/40 font-light tracking-wide">{timeAgo(job.createdAt)}</p>
                        </div>
                    </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl shrink-0 transition-all group-hover:border-white/20" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <span className="text-white/30 text-xs">▼</span>
                </div>
            </div>

            {/* Expanded timeline */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 pb-8 border-t border-white/5 pt-8 bg-white/[0.01]">
                            <div className="grid md:grid-cols-2 gap-10">
                                {/* Timeline */}
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4 font-medium">Payment Timeline</p>
                                    {events.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {events.map((e, i) => (
                                                <TimelineEvent key={i} {...e} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-white/30 font-light tracking-wide">No activity recorded yet.</p>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3 font-medium">Payment Breakdown</p>
                                        <div className="space-y-2">
                                            {[
                                                { label: "Total Project Value", value: `$${amountUsd} USDC` },
                                                { label: "Instant Advance (85%)", value: `$${advanceUsd} USDC`, highlight: true },
                                                { label: "Final Release (15%)", value: `$${(parseFloat(amountUsd) - parseFloat(advanceUsd)).toFixed(2)} USDC` },
                                            ].map(({ label, value, highlight }) => (
                                                <div key={label} className={`flex justify-between items-center text-sm px-5 py-4 font-light tracking-wide ${highlight ? "bg-amber-500/5 border border-amber-500/10 text-amber-400 rounded-2xl" : "bg-white/[0.03] border border-white/5 rounded-xl text-white/60"}`}>
                                                    <span className="text-[11px] uppercase tracking-wider opacity-60 font-medium">{label}</span>
                                                    <span className="font-mono text-base">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-medium">
                                            {role === "client" ? "Hired Talent Address" : "Client Address"}
                                        </p>
                                        <p className="text-sm font-mono text-white/50 liquid-glass rounded-xl px-4 py-3 break-all">
                                            {role === "client" ? job.freelancerWallet : job.clientWallet}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


export default function ProfilePage() {
    const { publicKey, connected } = useWallet();

    const [clientJobs, setClientJobs] = useState<any[]>([]);
    const [freelancerJobs, setFreelancerJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"client" | "freelancer">("client");

    useEffect(() => {
        if (publicKey) loadAll();
        else { setClientJobs([]); setFreelancerJobs([]); }
    }, [publicKey]);

    const loadAll = async () => {
        if (!publicKey) return;
        setLoading(true);
        try {
            const [cRes, fRes] = await Promise.all([
                fetch(`/api/invoices?clientWallet=${publicKey.toString()}`),
                fetch(`/api/invoices?freelancerWallet=${publicKey.toString()}`),
            ]);
            const [cData, fData] = await Promise.all([cRes.json(), fRes.json()]);
            setClientJobs(cData.jobs || []);
            setFreelancerJobs(fData.jobs || []);
        } catch (e) {
            // Error intentionally silent
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        if (!publicKey) return;
        navigator.clipboard.writeText(publicKey.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!connected || !publicKey) {
        return (
            <div className="relative min-h-screen bg-black w-full flex items-center justify-center overflow-hidden font-sans selection:bg-white/20 selection:text-white">

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-50 pointer-events-none" />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 p-12 liquid-glass-strong glow-ring noise rounded-3xl flex flex-col items-center text-center max-w-md w-full mx-4 group">


                    <div className="mb-6 p-4 liquid-glass-strong rounded-2xl inline-flex">
                        <User className="h-8 w-8 text-white/50" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-light text-white tracking-tight mb-3">Your Profile</h2>
                    <p className="text-white/50 font-light text-sm leading-relaxed tracking-wide">
                        Connect your wallet to track your earnings, payments, and project history.
                    </p>
                </motion.div>
            </div>
        );
    }

    const allJobs = [...clientJobs, ...freelancerJobs];
    const totalSent = clientJobs.reduce((s, j) => s + (j.amount / 100), 0);
    const totalEarned = freelancerJobs.reduce((s, j) => {
        if (["ADVANCED", "RELEASED"].includes(j.status)) return s + (j.amount / 100);
        return s;
    }, 0);
    const activeJobs = allJobs.filter(j => !["RELEASED", "CANCELLED"].includes(j.status)).length;
    const completedJobs = allJobs.filter(j => j.status === "RELEASED").length;

    const activeJobs_client = clientJobs.filter(j => !["RELEASED", "CANCELLED", "FAILED"].includes(j.status));

    return (
        <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
            <Spotlight></Spotlight>
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none opacity-40" />

            <div className="mx-auto max-w-5xl relative z-10 flex flex-col gap-12">

                {/* Profile Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-12">
                    <div className="flex items-center gap-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-zinc-900/60 border border-white/10 rounded-full flex items-center justify-center shrink-0 relative shadow-2xl backdrop-blur-md overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-50" />
                            <span className="text-3xl font-light text-white/90 relative z-10 font-mono">
                                {publicKey.toString().slice(0, 2).toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-4xl font-light text-white tracking-tightest">
                                Profile Identity
                            </h1>
                            <div className="flex items-center gap-5 flex-wrap">
                                <button
                                    onClick={copyAddress}
                                    className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-sm font-mono text-white/40 hover:text-white/80 transition-all group"
                                >
                                    <span className="group-hover:text-white transition-colors">{truncate(publicKey.toString(), 14)}</span>
                                    <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                                    {copied && <span className="text-emerald-400 text-[10px] font-sans font-bold uppercase tracking-widest ml-1">Copied</span>}
                                </button>
                                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                                <a
                                    href={explorerAddr(publicKey.toString())}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/80 transition-all uppercase tracking-widest font-bold"
                                >
                                    Explorer <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full self-start md:self-auto shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.25em]">Network Active</span>
                    </div>
                </motion.div>


                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "Total Volume Out", value: `$${totalSent.toFixed(2)}`, icon: TrendingUp, color: "text-blue-400" },
                        { label: "Accumulated Earnings", value: `$${totalEarned.toFixed(2)}`, icon: Coins, color: "text-amber-400" },
                        { label: "Active Project Count", value: String(activeJobs), icon: Clock, color: "text-white" },
                        { label: "Total Finalized", value: String(completedJobs), icon: CheckCircle, color: "text-emerald-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="relative p-8 bg-zinc-900/40 border border-white/10 rounded-3xl transition-all group hover:bg-zinc-900/60 shadow-2xl backdrop-blur-md">
                            <div className={`p-2 w-fit bg-white/5 rounded-lg mb-6 group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
                            </div>
                            <p className="text-4xl font-light text-white tracking-tightest mb-2">{value}</p>
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.25em] font-bold">{label}</p>
                        </div>
                    ))}
                </motion.div>


                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        {activeJobs_client.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-start gap-4 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/40" />
                                <AlertCircle className="h-5 w-5 text-amber-500/80 shrink-0 mt-0.5" strokeWidth={1.5} />
                                <div>
                                    <p className="text-[13px] text-amber-500/90 font-light tracking-wide leading-relaxed">
                                        You have {activeJobs_client.length} active project{activeJobs_client.length > 1 ? "s" : ""} awaiting funding or approval.
                                        {activeJobs_client.some(j => j.status === "ADVANCED") &&
                                            " One or more projects are ready for final payout."}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex flex-col gap-8">
                            <div className="flex gap-4 border-b border-white/5">
                                {([
                                    { key: "client", label: `Hiring Intent (${clientJobs.length})` },
                                    { key: "freelancer", label: `Service Provider (${freelancerJobs.length})` },
                                ] as const).map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`px-8 py-5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all border-b-2 -mb-[1px] ${activeTab === key
                                            ? "border-white text-white opacity-100"
                                            : "border-transparent text-white/20 hover:text-white/60"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {loading ? (
                                <div className="p-20 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-white/30 animate-spin" />
                                </div>
                            ) : activeTab === "client" ? (
                                clientJobs.length === 0 ? (
                                    <div className="p-20 flex flex-col items-center justify-center bg-zinc-900/40 border border-white/10 rounded-[2.5rem] text-center">
                                        <Briefcase className="h-10 w-10 text-white/10 mb-6" strokeWidth={1} />
                                        <p className="text-white/40 text-sm font-light tracking-wide mb-8">No active hiring projects found.</p>
                                        <a href="/client" className="px-6 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">
                                            Start a Project
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {clientJobs.map(job => (
                                            <JobCard key={job.id} job={job} role="client" />
                                        ))}
                                    </div>
                                )
                            ) : (
                                freelancerJobs.length === 0 ? (
                                    <div className="p-20 flex flex-col items-center justify-center bg-zinc-900/40 border border-white/10 rounded-[2.5rem] text-center">
                                        <Coins className="h-10 w-10 text-white/10 mb-6" strokeWidth={1} />
                                        <p className="text-white/40 text-sm font-light tracking-wide mb-8">No freelance assignments found.</p>
                                        <a href="/freelancer" className="px-6 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all">
                                            View Opportunities
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {freelancerJobs.map(job => (
                                            <JobCard key={job.id} job={job} role="freelancer" />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar Dashboard */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        
                        {/* Liquidity Snapshot Card */}
                        <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                <Zap className="w-20 h-20 text-white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-6">Quick Liquidity</p>
                                <div className="space-y-1 mb-8">
                                    <p className="text-4xl font-light text-white tracking-tightest">
                                        ${totalEarned.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-white/20 font-light uppercase tracking-widest">Available Earnings</p>
                                </div>
                                <a href="/freelancer" className="w-full py-4 bg-white/[0.05] border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-white/[0.08] transition-all flex items-center justify-center gap-3">
                                    Manage Funds
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Recent Global Activity */}
                        <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative">
                            <h3 className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-bold mb-8">Global Activity Feed</h3>
                            <div className="space-y-8">
                                {allJobs.slice(0, 5).map((job, i) => (
                                    <div key={job.id} className="relative pl-6 group">
                                        <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-blue-400 transition-colors" />
                                        <div className="absolute left-[2px] top-4 bottom-[-24px] w-[1px] bg-white/5 last:hidden" />
                                        
                                        <div className="space-y-1">
                                            <p className="text-[13px] text-white/70 font-light leading-tight group-hover:text-white transition-colors">
                                                {job.jobTitle}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                                    job.status === 'RELEASED' ? 'text-emerald-400/60' : 'text-blue-400/60'
                                                }`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] text-white/20 font-mono">
                                                    {timeAgo(job.updatedAt || job.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {allJobs.length === 0 && (
                                    <p className="text-xs text-white/20 font-light italic">No recent activity detected.</p>
                                )}
                            </div>
                        </div>

                        {/* Profile Verification Card */}
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                                <h3 className="text-[10px] text-emerald-500/60 uppercase tracking-[0.25em] font-bold">Verification</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40 font-light">On-chain Identity</span>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Verified</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40 font-light">Dispute Rate</span>
                                    <span className="text-[9px] text-white/60 font-mono">0.0%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40 font-light">Network Standing</span>
                                    <span className="text-[9px] text-white/60 font-mono">Top Tier</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}