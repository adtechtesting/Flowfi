"use client";

import { motion } from "framer-motion";
import {
    Briefcase, CreditCard, Lock, Zap, CheckCircle,
    ArrowRight, Shield, Globe, Clock, Coins
} from "lucide-react";
import Link from "next/link";



function Step({
    number, icon: Icon, title, description, detail, tag, last = false
}: {
    number: number;
    icon: any;
    title: string;
    description: string;
    detail: string;
    tag: string;
    last?: boolean;
}) {
    return (
        <div className="flex gap-6 group">
            {/* Left — number + line */}
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#050505] border border-white/10 group-hover:border-white/30 transition-colors flex items-center justify-center shrink-0 z-10 relative" style={{ borderRadius: '2px' }}>
                    <div className="absolute -top-[2px] -left-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-white/60 transition-colors"></div>
                    <div className="absolute -bottom-[2px] -right-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-white/60 transition-colors"></div>
                    <span className="text-sm font-light text-white/70">{String(number).padStart(2, "0")}</span>
                </div>
                {!last && <div className="w-[1px] bg-gradient-to-b from-white/10 to-transparent flex-1 mt-4 mb-2" />}
            </div>

            {/* Right — content */}
            <div className={`flex-1 ${!last ? "pb-12" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                    <div className="p-3 bg-white/[0.02] border border-white/5 shrink-0 self-start group-hover:bg-white/[0.05] transition-colors" style={{ borderRadius: '2px' }}>
                        <Icon className="h-6 w-6 text-white/80" strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-light text-white tracking-wide">{title}</h3>
                            <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 uppercase tracking-widest font-medium" style={{ borderRadius: '2px' }}>
                                {tag}
                            </span>
                        </div>
                        <p className="text-white/60 font-light text-base leading-relaxed max-w-xl tracking-wide">{description}</p>
                    </div>
                </div>
                <div className="ml-0 sm:ml-[60px] p-5 bg-white/[0.01] border border-white/5 text-sm text-white/40 font-light leading-relaxed tracking-wide relative" style={{ borderRadius: '2px' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/10 group-hover:bg-white/30 transition-colors"></div>
                    {detail}
                </div>
            </div>
        </div>
    );
}


function CompareRow({ feature, old, now }: { feature: string; old: string; now: string }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 border-b border-white/5 text-sm tracking-wide">
            <span className="text-white/50 font-light">{feature}</span>
            <span className="text-red-400/50 font-light line-through decoration-red-500/20">{old}</span>
            <span className="text-green-400/80 font-medium">{now}</span>
        </div>
    );
}


export default function HowItWorksPage() {
    return (
        <div className="relative min-h-screen bg-black w-full pt-32 pb-24 px-6 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[140px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none opacity-30" />

            <div className="mx-auto max-w-4xl relative z-10 flex flex-col gap-32">


                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center flex flex-col items-center gap-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 text-xs text-white/60 uppercase tracking-widest font-medium" style={{ borderRadius: '2px' }}>
                        <Shield className="h-4 w-4" />
                        Guaranteed Payments
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-5xl md:text-[72px] font-light text-white tracking-tight leading-tight">
                            Get paid instantly.
                        </h1>
                        <h2 className="text-4xl md:text-5xl font-light italic text-white/50 tracking-tight leading-tight">
                            Not in 30 days.
                        </h2>
                    </div>
                    <p className="text-white/50 font-light text-lg md:text-xl leading-relaxed max-w-2xl tracking-wide">
                        FlowFi securely locks the client's payment upfront. Freelancers
                        can withdraw 85% of their money the moment work starts — no waiting, no chasing clients, no delays.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                        <Link href="/freelancer"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full sm:w-auto"
                            style={{ borderRadius: '2px' }}>
                            Start Getting Paid <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link href="/client"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-white/20 text-white font-medium hover:bg-white/10 transition-all w-full sm:w-auto"
                            style={{ borderRadius: '2px' }}>
                            Hire a Freelancer
                        </Link>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="mb-16 text-center sm:text-left">
                        <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">How it works</h2>
                        <p className="text-white/50 font-light tracking-wide text-lg">A simple, secure process from job start to final payment.</p>
                        <div className="h-[1px] w-12 bg-white/20 mt-8 mx-auto sm:mx-0"></div>
                    </div>

                    <div className="max-w-3xl">
                        <Step
                            number={1}
                            icon={Briefcase}
                            title="Client starts a project"
                            description="The client enters the project details and the freelancer's receiving address."
                            detail="Our platform creates a secure, digital agreement. No money moves yet—this simply sets up the safe workspace for the funds."
                            tag="Client"
                        />
                        <Step
                            number={2}
                            icon={CreditCard}
                            title="Client pays securely"
                            description="The client pays using their preferred method (credit card, bank transfer, etc)."
                            detail="We handle the checkout securely behind the scenes. Once the payment clears, our system is automatically notified to move to the next step."
                            tag="Checkout"
                        />
                        <Step
                            number={3}
                            icon={Lock}
                            title="Funds are locked safely"
                            description="The payment is converted to digital dollars and locked in a secure smart contract."
                            detail="The money is now held safely in the middle. The client cannot silently withdraw it, and the freelancer knows the money is guaranteed before they start working."
                            tag="Automated"
                        />
                        <Step
                            number={4}
                            icon={Zap}
                            title="Freelancer gets an instant advance"
                            description="The freelancer logs in and clicks 'Get Paid Now' to instantly draw 85% of the total."
                            detail="With one click, the money is transferred directly to the freelancer. This happens instantly. There is no need to wait for the client to review the work first."
                            tag="Freelancer"
                        />
                        <Step
                            number={5}
                            icon={CheckCircle}
                            title="Client approves the final work"
                            description="When the project is finished, the client reviews the work and clicks 'Approve'."
                            detail="Clicking approve signals the smart contract that the job is complete, which instantly releases the remaining 15% of the funds to the freelancer."
                            tag="Client"
                        />
                        <Step
                            number={6}
                            icon={Globe}
                            title="Project is fully settled"
                            description="Both parties walk away happy. No net-30 terms. No chasing invoices."
                            detail="85% was paid upfront to help the freelancer start. 15% was delivered upon successful completion. A perfectly fair, transparent, and instant payment experience."
                            tag="Complete"
                            last
                        />
                    </div>
                </motion.div>


                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="mb-12 text-center sm:text-left">
                        <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">The new standard</h2>
                        <p className="text-white/50 font-light tracking-wide text-lg">Why FlowFi beats traditional invoices and wire transfers.</p>
                    </div>

                    <div className="p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 relative group" style={{ borderRadius: '2px' }}>
                        {/* Corner Accents */}
                        <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
                        <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
                        <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
                        <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>

                        <div className="hidden sm:grid grid-cols-3 gap-4 pb-4 mb-2 border-b border-white/10">
                            <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Feature</span>
                            <span className="text-xs text-white/40 uppercase tracking-widest font-medium">The Old Way</span>
                            <span className="text-xs text-white/90 uppercase tracking-widest font-medium">With FlowFi</span>
                        </div>
                        <CompareRow feature="Time to first payment" old="30–90 days" now="Instant (85% Advance)" />
                        <CompareRow feature="Payment guarantee" old="Trust & Promises" now="Funds Locked Upfront" />
                        <CompareRow feature="Transfer speed" old="3–5 business days" now="Seconds" />
                        <CompareRow feature="Hidden fees" old="High platform cuts (up to 20%)" now="Near-zero network fees" />
                        <CompareRow feature="Cash flow for freelancer" old="Wait for client approval" now="Access cash immediately" />
                    </div>
                </motion.div>


                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="mb-12 text-center sm:text-left">
                        <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">Built on trust</h2>
                        <p className="text-white/50 font-light tracking-wide text-lg">Clear rules that protect both the client and the freelancer.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                actor: "The Client",
                                can: ["Securely fund a project", "Approve the final work to release funds"],
                                cannot: ["Run away with the work without paying", "Reverse the payment secretly"],
                            },
                            {
                                actor: "The Freelancer",
                                can: ["Withdraw 85% the moment funds are secured", "Receive the final 15% instantly on approval"],
                                cannot: ["Take the money before the client deposits it", "Claim the advance more than once"],
                            },
                            {
                                actor: "The Smart Contract",
                                can: ["Hold the money safely in the middle", "Release funds exactly as agreed"],
                                cannot: ["Be altered or tampered with", "Be bypassed by either party"],
                            },
                            {
                                actor: "FlowFi Platform",
                                can: ["Provide the seamless interface", "Process fiat checkout safely"],
                                cannot: ["Access or steal the locked project funds"],
                            },
                        ].map(({ actor, can, cannot }) => (
                            <div key={actor} className="relative p-8 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 flex flex-col gap-6 group hover:border-white/10 transition-colors" style={{ borderRadius: '2px' }}>
                                {/* Corner Accents */}
                                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>
                                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/10 group-hover:bg-white/40 transition-colors"></div>

                                <p className="text-xl font-light text-white tracking-wide border-b border-white/5 pb-4">{actor}</p>

                                <div className="flex flex-col gap-5">
                                    <div>
                                        <p className="text-[10px] text-green-400/70 uppercase tracking-widest mb-3 font-medium">What they can do</p>
                                        <div className="flex flex-col gap-2">
                                            {can.map(c => (
                                                <div key={c} className="flex items-start gap-3">
                                                    <CheckCircle className="h-4 w-4 text-green-400/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                                                    <span className="text-sm text-white/70 font-light tracking-wide leading-relaxed">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-red-400/70 uppercase tracking-widest mb-3 font-medium">What they cannot do</p>
                                        <div className="flex flex-col gap-2">
                                            {cannot.map(c => (
                                                <div key={c} className="flex items-start gap-3">
                                                    <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                                                        <div className="w-3 h-[1.5px] bg-red-400/60" />
                                                    </div>
                                                    <span className="text-sm text-white/50 font-light tracking-wide leading-relaxed">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>


                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="relative p-12 bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left group" style={{ borderRadius: '2px' }}>

                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-light text-white tracking-tight mb-3">Upgrade your workflow.</h2>
                        <p className="text-white/50 font-light tracking-wide">
                            Stop chasing payments. Start working with peace of mind.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 shrink-0 relative z-10 w-full sm:w-auto">
                        <Link href="/freelancer"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full sm:w-auto"
                            style={{ borderRadius: '2px' }}>
                            Get Paid Faster <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}