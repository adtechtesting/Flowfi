"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Globe, Coins } from "lucide-react";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  charDelay?: number;
}

function AnimatedHeading({ text, className = "", style = {}, delay = 200, charDelay = 30 }: AnimatedHeadingProps) {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStartAnimation(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const lines = text.split("\n");
  let globalCharIndex = 0;

  return (
    <h1 className={className} style={style}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {line.split("").map((char, i) => {
            const currentCharIndex = globalCharIndex++;
            return (
              <span
                key={i}
                className="inline-block transition-all duration-500"
                style={{
                  opacity: startAnimation ? 1 : 0,
                  transform: startAnimation ? "translateX(0)" : "translateX(-18px)",
                  transitionDelay: `${currentCharIndex * charDelay}ms`
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

function FadeIn({ children, delay = 800, duration = 1000, className = "" }: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`
      }}
    >
      {children}
    </div>
  );
}

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: delay / 1000 }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionHeading = ({ eyebrow, children, className = "" }: { eyebrow: string, children: React.ReactNode, className?: string }) => (
  <Reveal>
    <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">{eyebrow}</div>
    <h2 className={className}>{children}</h2>
  </Reveal>
);


const logos = ["Dodo Payments", "Solana", "Transak", "Earn", "Phantom", "Superteam", "Backpack"];

// FAQ Data
const faqs = [
  {
    q: "Do clients need crypto?",
    a: "No. Clients can pay using cards or bank transfers.",
  },
  {
    q: "How is the payment secured?",
    a: "Funds are locked upfront and cannot be accessed until conditions are met.",
  },
  {
    q: "What if the client doesn't respond?",
    a: "The remaining amount is automatically released after the set timeline unless a dispute is raised.",
  },
  {
    q: "Can I withdraw to my bank account?",
    a: "Yes. You can withdraw your earnings through integrated payout providers.",
  },
];

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div className="bg-black min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white">

      <div className="relative min-h-[100svh] w-full overflow-hidden flex flex-col justify-center bg-black border-b border-white/5">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_084718_72a17915-4964-4059-afcd-22d59399b72e.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black z-[5]"></div>
        <div className="absolute inset-0 bg-black/30 z-[5]"></div>

        <main className="relative z-10 w-full px-6 flex justify-center mt-20">
          <div className="relative flex flex-col items-center text-center max-w-5xl w-full">
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col leading-[1.05] mb-8">
                <AnimatedHeading
                  text={"Get paid sooner.\nNot weeks later."}
                  className="text-4xl md:text-5xl lg:text-6xl font-normal text-white tracking-tightest whitespace-pre-wrap drop-shadow-2xl"
                  delay={200}
                  charDelay={30}
                />

                <FadeIn delay={1200} duration={800}>
                  <h2 className="text-xl md:text-2xl font-light text-white/70 tracking-tight mt-6">
                    Freelancers don’t struggle to earn.<br className="hidden md:block" /> They struggle to <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">access what they’ve already earned.</span>
                  </h2>
                </FadeIn>
              </div>

              <FadeIn delay={1600} duration={1000}>
                <p className="max-w-2xl text-base md:text-xl text-gray-400 font-light mb-10 leading-relaxed tracking-wide mx-auto">
                  FlowFi fixes that.
                </p>
              </FadeIn>

              <FadeIn delay={2000} duration={1000} className="w-full flex flex-col items-center">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <Link
                    href="/freelancer"
                    className="group bg-white text-black px-8 py-4 rounded-xl font-medium hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-3 text-base shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    Get Paid Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/client"
                    className="liquid-glass border border-white/20 text-white px-8 py-4 rounded-xl font-medium hover:bg-white/10 hover:border-white/40 hover:text-white transition-all text-base flex items-center justify-center shadow-xl"
                  >
                    Create a Job
                  </Link>
                </div>
                
                <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-sm text-gray-400 font-medium tracking-wider uppercase text-balance border-t border-white/10 pt-6">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
                    Powered by Dodo Payments
                  </span>
                  <span className="hidden md:block text-white/20">•</span>
                  <span>Familiar methods (cards, bank transfers)</span>
                </div>
              </FadeIn>
            </div>
          </div>
        </main>
      </div>

      {/* ----------------- MARQUEE ----------------- */}
      <section className="relative bg-black py-16 overflow-hidden border-b border-white/5">
        <div className="text-center text-xs uppercase tracking-[0.3em] text-gray-500 mb-10">
          Powered by the best
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10" style={{ background: "linear-gradient(to right, #000, transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10" style={{ background: "linear-gradient(to left, #000, transparent)" }} />
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...logos, ...logos, ...logos].map((name, i) => (
              <span key={i} className="text-2xl md:text-3xl text-gray-500 hover:text-white transition-colors tracking-tightest font-normal">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>


      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-6xl mx-auto">
          <SectionHeading eyebrow="01 — The Problem" className="text-3xl md:text-5xl lg:text-6xl font-normal max-w-4xl tracking-tightest">
            Waiting to get paid is <br className="hidden md:block" />
            <span className="gradient-text">the real problem.</span>
          </SectionHeading>

          <div className="mt-20">
            <Reveal delay={100}>
              <div className="liquid-glass-strong glow-ring rounded-[2rem] p-8 md:p-12 noise relative flex flex-col md:flex-row gap-12 items-center">
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs text-red-400 tracking-wider uppercase font-medium">The Old Way</span>
                  </div>
                  <h3 className="text-xl md:text-2xl text-gray-200 leading-snug tracking-tight font-light mb-6">
                    Waiting to get paid is still normal.
                  </h3>
                  <ul className="text-base text-gray-400 leading-relaxed font-light space-y-3 mb-6">
                    <li className="flex items-start gap-3"><span className="text-white/20 mt-1">•</span> Freelancers wait 30–60 days after finishing work</li>
                    <li className="flex items-start gap-3"><span className="text-white/20 mt-1">•</span> Cross-border payments are slow and expensive</li>
                    <li className="flex items-start gap-3"><span className="text-white/20 mt-1">•</span> Small teams deal with constant cash flow pressure</li>
                  </ul>
                  <p className="text-base text-gray-400 leading-relaxed font-light">
                    Even when a client is ready to pay, the money doesn’t arrive when it’s actually needed. That delay isn’t just inconvenient — it slows people down.
                  </p>
                </div>

                <div className="w-full md:w-[400px] shrink-0 bg-black/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <span className="text-sm text-gray-500 uppercase tracking-widest font-medium">Invoice Status</span>
                    <span className="text-sm text-yellow-500/80 font-mono">Net-30 Pending</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="h-10 w-full bg-white/[0.02] rounded-lg animate-pulse"></div>
                    <div className="h-10 w-full bg-white/[0.02] rounded-lg animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-10 w-3/4 bg-white/[0.02] rounded-lg animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: "30-90", label: "Days waiting for payments" },
              { value: "$0", label: "Hidden wiring fees" },
              { value: "100%", label: "Control of your cash flow" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100} className="h-full">
                <div className="liquid-glass-strong glow-ring rounded-[2rem] p-8 md:p-10 noise relative h-full flex flex-col justify-center transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                  <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                  <div className="text-3xl md:text-4xl font-light mb-4 tracking-tightest text-white drop-shadow-md">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-400 font-medium tracking-widest uppercase">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl animate-aurora" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl animate-aurora" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
            <SectionHeading eyebrow="02 — What FlowFi does" className="text-3xl md:text-5xl lg:text-6xl font-normal max-w-3xl tracking-tightest">
              Access your earnings <br />
              <span className="gradient-text">early.</span>
            </SectionHeading>
            <Reveal delay={150}>
              <p className="max-w-sm text-gray-400 leading-relaxed font-light">
                FlowFi lets freelancers access their earnings early — instead of waiting weeks. It’s not a marketplace. It’s a payment layer for freelancers and clients who already work together.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { id: "01", icon: ShieldCheck, title: "Secured Upfront", desc: "Once a job is funded, the money is secured — and most of it becomes available immediately.", points: ["No risk of non-payment", "Verifiable transaction flow"] },
              { id: "02", icon: Zap, title: "Partial Payouts", desc: "Partial payout improves liquidity without removing accountability.", points: ["Better cash flow from day one", "Keeps payment moving"] },
              { id: "03", icon: Globe, title: "Real-world Payouts", desc: "Freelancers can withdraw their earnings directly to their bank accounts through providers like Transak.", points: ["No need to understand crypto", "Just get paid"] },
              { id: "04", icon: Coins, title: "Protected Settlement", desc: "The remaining amount stays protected until completion.", points: ["Timeline-based release", "Prevents stuck funds"] }
            ].map((s, i) => (
              <Reveal key={s.id} delay={i * 120} className="h-full">
                <div className="liquid-glass-strong glow-ring rounded-[2rem] p-8 md:p-10 h-full flex flex-col noise relative group hover:bg-white/[0.05] transition-all duration-500">
                  <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
                  <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20 group-hover:bg-white transition-colors"></div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-all">
                      <s.icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm tracking-[0.3em] text-gray-600 font-medium">{s.id}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-light mb-4 tracking-tightest group-hover:text-white transition-colors text-gray-200">
                    {s.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-8 text-base font-light">{s.desc}</p>
                  <ul className="mt-auto space-y-3 text-sm text-gray-400 border-t border-white/10 pt-5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-emerald-400 transition-colors" />
                        <span className="font-light tracking-wide">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="03 — How it works" className="text-3xl md:text-5xl lg:text-6xl font-normal max-w-3xl tracking-tightest">
            Simple. Fast. <br className="hidden md:block" />Built for real work.
          </SectionHeading>

          <div className="mt-20 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { n: "01", title: "Client Pays", body: "Client pays using normal methods (cards, bank, etc.) via Dodo Payments." },
                { n: "02", title: "Funds Secured", body: "The payment is locked safely and reserved for you on the network." },
                { n: "03", title: "Get Paid Early", body: "You can instantly access most of your earnings — no waiting." },
                { n: "04", title: "Final Settlement", body: "The remaining amount is released after completion of the work." }
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 120} className="h-full">
                  <div className="relative h-full flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-black border border-white/20 flex items-center justify-center mb-8 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-xl font-light text-white tracking-widest">
                      {s.n}
                    </div>
                    <div className="liquid-glass-strong glow-ring rounded-[2rem] p-8 h-full noise relative flex flex-col transition-transform hover:-translate-y-1 duration-500 w-full">
                      <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                      <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                      <h3 className="text-xl font-light mb-4 tracking-tight text-gray-100">{s.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed font-light">{s.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-6xl mx-auto">
          <SectionHeading eyebrow="04 — Why this matters" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-3xl tracking-tightest">
            The payment <br />keeps up with the work.
          </SectionHeading>

          <div className="mt-20 grid md:grid-cols-2 gap-8">
            <Reveal delay={120} className="h-full">
              <div className="liquid-glass-strong glow-ring rounded-[2rem] p-10 h-full flex flex-col noise relative transition-transform hover:-translate-y-1 duration-500">
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-8 font-medium">For Freelancers</div>
                <ul className="space-y-6 text-gray-300 font-light text-lg">
                  <li className="flex items-start gap-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
                    <span>No more waiting weeks to access earnings</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
                    <span>Better cash flow from day one</span>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={240} className="h-full">
              <div className="liquid-glass-strong glow-ring rounded-[2rem] p-10 h-full flex flex-col noise relative transition-transform hover:-translate-y-1 duration-500">
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-8 font-medium">For Clients</div>
                <ul className="space-y-6 text-gray-300 font-light text-lg">
                  <li className="flex items-start gap-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                    <span>Payment is controlled and only fully released after completion</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                    <span>Clear, verifiable transaction flow</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl animate-aurora" />
        </div>

        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-16">
          <div className="max-w-xl">
            <SectionHeading eyebrow="05 — Built for trust" className="text-4xl md:text-6xl lg:text-7xl font-normal tracking-tightest mb-8">
              Transparent.<br />
              <span className="gradient-text">Verifiable.</span>
            </SectionHeading>
            <Reveal delay={200}>
              <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide leading-relaxed mb-8">
                The system is transparent and verifiable, powered by Solana.
              </p>
            </Reveal>
          </div>

          <div className="flex-1 w-full">
            <Reveal delay={300}>
              <div className="liquid-glass-strong glow-ring rounded-[2rem] p-10 noise relative flex flex-col w-full">
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <ul className="space-y-6 text-gray-300 font-light text-lg">
                  <li className="flex items-start gap-4">
                    <span className="text-white/20 mt-1">•</span>
                    <span>Funds are locked upfront — no risk of non-payment</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-white/20 mt-1">•</span>
                    <span>Partial payout improves liquidity without removing accountability</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-white/20 mt-1">•</span>
                    <span>Remaining amount stays protected until completion</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-white/20 mt-1">•</span>
                    <span>Timeline-based release prevents funds from being stuck</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 w-full">
            <Reveal delay={200}>
              <div className="liquid-glass-strong glow-ring rounded-[2rem] p-10 noise relative flex flex-col w-full">
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
                <div className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-6 font-medium">Who this is for</div>
                <ul className="space-y-4 text-gray-300 font-light text-lg">
                  <li className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                    <span>Freelancers working with repeat clients</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                    <span>Agencies managing multiple payments</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                    <span>Small teams dealing with delayed invoices</span>
                  </li>
                </ul>
                <div className="mt-8 pt-6 border-t border-white/10 text-gray-400 font-light italic">
                  "If you already trust who you work with, FlowFi makes sure the payment keeps up with the work."
                </div>
              </div>
            </Reveal>
          </div>

          <div className="max-w-xl text-left md:text-right">
            <SectionHeading eyebrow="06 — Real-world payouts" className="text-3xl md:text-5xl font-normal tracking-tightest mb-8">
              Designed for <br />
              <span className="gradient-text">actual usage.</span>
            </SectionHeading>
            <Reveal delay={300}>
              <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide leading-relaxed">
                Not just on-chain activity. Freelancers can withdraw their earnings directly to their bank accounts through providers like Transak.
                <br /><br />
                <span className="text-gray-200">No need to understand crypto. Just get paid.</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>


      <section id="faq" className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeading eyebrow="07 — FAQ" className="text-3xl md:text-5xl lg:text-6xl font-normal text-center tracking-tightest">
            Questions, answered.
          </SectionHeading>

          <div className="mt-16 space-y-3">
            {faqs.map((f, i) => {
              const isOpen = faqOpen === i;
              return (
                <Reveal key={f.q} delay={i * 60}>
                  <div className="liquid-glass-strong glow-ring rounded-[1.5rem] overflow-hidden noise relative group transition-colors hover:bg-white/[0.02]">
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 px-6 md:px-8 py-6 text-left relative z-20"
                    >
                      <span className="text-lg md:text-xl font-light tracking-tight text-gray-200 group-hover:text-white transition-colors">
                        {f.q}
                      </span>
                      <span className={`shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-transform duration-300 text-gray-400 group-hover:border-white/40 group-hover:text-white ${isOpen ? "rotate-45" : ""}`}>
                        +
                      </span>
                    </button>
                    <div className="grid transition-all duration-500 ease-out relative z-20" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <p className="px-6 md:px-8 pb-6 text-gray-400 leading-relaxed max-w-2xl font-light">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>


      <section id="contact" className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl animate-aurora" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <Reveal>
            <div className="liquid-glass-strong glow-ring rounded-[3rem] p-12 md:p-24 text-center noise relative">
              <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
              <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>
              <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/20"></div>
              <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/20"></div>

              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-8 font-medium">Ready to start?</div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-light mb-8 tracking-tightest drop-shadow-xl">
                Getting paid shouldn’t take longer <br className="hidden md:block" />
                <span className="gradient-text font-normal">than doing the work.</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 font-light tracking-wide leading-relaxed">
                FlowFi makes sure it doesn’t.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-20 items-center">
                <Link href="/freelancer" className="group bg-white text-black px-10 py-5 rounded-2xl font-medium hover:bg-gray-100 transition-all inline-flex items-center gap-3 text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  Get Paid Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/client" className="liquid-glass border border-white/20 text-white px-10 py-5 rounded-2xl font-medium hover:bg-white/10 hover:border-white/40 hover:text-white transition-all text-lg shadow-2xl">
                  Create a Job
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      <footer className="relative bg-black text-white border-t border-white/10 px-6 md:px-12 lg:px-16 pt-20 pb-10 overflow-hidden">
        <div className="pointer-events-none absolute -bottom-12 md:-bottom-24 left-1/2 -translate-x-1/2 text-[28vw] md:text-[22vw] font-normal tracking-tightest leading-none select-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 80%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          aria-hidden
        >
          FlowFi
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 mb-16">
            <div className="md:col-span-5">
              <div className="text-3xl font-normal mb-3 tracking-tightest">FlowFi</div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Secure payments. Instant payouts. Shaping the future of freelance work.
              </p>
              <div className="mt-8 flex gap-3">
                <a href="#" className="liquid-glass w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition" aria-label="Twitter"><span className="text-sm">𝕏</span></a>
                <a href="#" className="liquid-glass w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition" aria-label="LinkedIn"><span className="text-sm">in</span></a>
                <a href="mailto:hello@flowfi.com" className="liquid-glass w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition" aria-label="Email"><span className="text-sm">@</span></a>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-gray-500 uppercase tracking-[0.25em] text-xs mb-4">Product</div>
                <ul className="space-y-3">
                  <li><Link href="/freelancer" className="text-gray-300 hover:text-white transition-colors">For Freelancers</Link></li>
                  <li><Link href="/client" className="text-gray-300 hover:text-white transition-colors">For Clients</Link></li>
                  <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-gray-500 uppercase tracking-[0.25em] text-xs mb-4">Company</div>
                <ul className="space-y-3">
                  <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Story</Link></li>
                  <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="#" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-gray-500 relative">
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Powered by Solana for fast, low-cost settlement</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <span>© {new Date().getFullYear()} FlowFi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}