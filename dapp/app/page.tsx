"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    q: "How do I get paid instantly?",
    a: "Once the client funds the job, you can withdraw up to 85% immediately. The rest is released after completion.",
  },
  {
    q: "Do clients need crypto?",
    a: "No. Clients pay using normal methods like cards or bank transfers.",
  },
  {
    q: "How is the payment secured?",
    a: "Funds are locked before work starts, so you don't need to chase payments.",
  },
  {
    q: "Are there hidden fees?",
    a: "No. Everything is transparent — no surprise charges.",
  },
];


const quotes = [
  {
    quote: "I no longer wait 30 days to get paid. That alone changed everything.",
    name: "Alex Mercer",
    role: "Freelancer",
  },
  {
    quote: "Cash flow used to slow us down. Now it doesn't.",
    name: "Sarah Chen",
    role: "Agency Owner",
  },
  {
    quote: "I can finally start working without worrying if the client will actually pay me.",
    name: "David Kim",
    role: "Independent Developer",
  },
];

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div className="bg-black min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white">

      <div className="relative min-h-[100svh] w-full overflow-hidden flex flex-col justify-end bg-black border-b border-white/5">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_084718_72a17915-4964-4059-afcd-22d59399b72e.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black z-[5]"></div>

        <main className="relative z-10 w-full px-6 flex justify-center pb-[150px] md:pb-[200px]">
          <div className="relative flex flex-col items-center text-center max-w-4xl w-full">
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col leading-[1.1] mb-6">
                <AnimatedHeading
                  text={"Get paid instantly.\nNot 30 days later."}
                  className="text-5xl md:text-[72px] lg:text-[84px] font-normal text-white tracking-tightest whitespace-pre-wrap"
                  delay={200}
                  charDelay={40}
                />

                <FadeIn delay={1200} duration={800}>
                  <h2 className="text-3xl md:text-[40px] font-normal text-white/90 tracking-tight mt-6">
                    Finish the work → access your money <span className="text-indigo-300">immediately.</span>
                  </h2>
                </FadeIn>
              </div>

              <FadeIn delay={1600} duration={1000}>
                <p className="max-w-xl text-lg md:text-xl text-gray-400 font-sans mb-10 leading-relaxed tracking-wide mx-auto">
                  No delays. No chasing invoices. No waiting on approvals.
                </p>
              </FadeIn>

              <FadeIn delay={2000} duration={1000} className="w-full">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <Link
                    href="/freelancer"
                    className="group bg-white text-black px-8 py-4 rounded-xl font-medium hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 text-lg"
                  >
                    Get Paid Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/client"
                    className="liquid-glass border border-white/20 text-white px-8 py-4 rounded-xl font-medium hover:bg-white/105 hover:text-white/70 transition-colors text-lg flex items-center justify-center"
                  >
                    Create a Job
                  </Link>
                </div>
                <div className="mt-8 text-sm text-gray-500 font-medium tracking-wide text-balance">
                  Clients pay using familiar methods (cards, bank transfers) — powered by Dodo Payments.
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
          <SectionHeading eyebrow="01 — The Problem" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-4xl tracking-tightest">
            Waiting to get paid is <br className="hidden md:block" />
            <span className="gradient-text">the real problem.</span>
          </SectionHeading>

          <div className="mt-20 grid md:grid-cols-12 gap-10 items-start">
            <Reveal delay={100} className="md:col-span-7">
              <p className="text-xl md:text-2xl text-gray-200 leading-snug tracking-tight">
                You do the work. But the money comes late. Freelancers wait weeks — sometimes months.
              </p>
            </Reveal>
            <Reveal delay={250} className="md:col-span-5">
              <p className="text-base text-gray-400 leading-relaxed">
                Payments get delayed, lost, or stuck. Cross-border transfers are slow and expensive. You shouldn't have to wait to use money you've already earned.
              </p>
            </Reveal>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: "30-90", label: "Days waiting for payments" },
              { value: "$0", label: "Hidden wiring fees" },
              { value: "100%", label: "Control of your cash flow" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="liquid-glass-strong glow-ring rounded-2xl p-6 md:p-8 noise relative">
                  <div className="text-4xl md:text-6xl font-normal mb-3 tracking-tightest gradient-text">
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-400">{s.label}</div>
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
            <SectionHeading eyebrow="02 — The Solution" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-3xl tracking-tightest">
              Get your money <br />
              <span className="gradient-text">the moment it's secured.</span>
            </SectionHeading>
            <Reveal delay={150}>
              <p className="max-w-sm text-gray-400 leading-relaxed">
                FlowFi changes how payments work. Once a client funds a job, your earnings are secured upfront — and you can access most of it instantly. No waiting. No uncertainty.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { id: "01", title: "Payments Secured First", desc: "Clients fund the job before work begins. Your money is guaranteed from day one.", points: ["No chasing invoices", "Escrow protection"] },
              { id: "02", title: "Instant Access to Earnings", desc: "Withdraw up to 85% immediately — even before the work is finished.", points: ["Zero approval delays", "Access cash immediately"] },
              { id: "03", title: "Works Globally", desc: "Clients pay with cards or bank transfers. You receive money instantly, anywhere.", points: ["No cross-border delays", "Familiar payment methods"] },
              { id: "04", title: "No Hidden Fees", desc: "No expensive wire transfers. No unexpected cuts.", points: ["Predictable costs", "Transparent pricing"] }
            ].map((s, i) => (
              <Reveal key={s.id} delay={i * 120}>
                <div className="liquid-glass-strong glow-ring rounded-3xl p-8 md:p-10 h-full flex flex-col noise relative group hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center justify-between mb-10">
                    <span className="text-sm tracking-[0.3em] text-gray-500">{s.id}</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-normal mb-5 tracking-tightest group-hover:text-white transition-colors text-gray-200">
                    {s.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-10">{s.desc}</p>
                  <ul className="mt-auto space-y-3 text-sm text-gray-400 border-t border-white/10 pt-6">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <span className="w-1 h-1 rounded-full bg-white/70" />
                        {p}
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
          <SectionHeading eyebrow="03 — How it works" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-3xl tracking-tightest">
            Simple. Fast. <br className="hidden md:block" />Built for real work.
          </SectionHeading>

          <div className="mt-20 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { n: "01", title: "Client Pays", body: "Client pays using normal methods (cards, bank, etc.) via Dodo Payments." },
                { n: "02", title: "Funds Secured", body: "The payment is locked safely and reserved for you." },
                { n: "03", title: "Get Paid Early", body: "You can instantly access most of your earnings — no waiting." },
                { n: "04", title: "Final Settlement", body: "The remaining amount is released after completion." }
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 120}>
                  <div className="relative">
                    <div className="hidden md:block w-3 h-3 rounded-full bg-white mb-8 mx-0 relative z-10 ring-8 ring-black" />
                    <div className="liquid-glass-strong glow-ring rounded-2xl p-6 md:p-7 h-full noise relative">
                      <div className="text-xs tracking-[0.3em] text-gray-500 mb-3">STEP {s.n}</div>
                      <h3 className="text-2xl font-normal mb-3 tracking-tightest text-gray-200">{s.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
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
          <SectionHeading eyebrow="04 — In their words" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-3xl tracking-tightest">
            Built for people who work, <br />not wait.
          </SectionHeading>

          <div className="mt-20 grid md:grid-cols-3 gap-5">
            {quotes.map((q, i) => (
              <Reveal key={q.name} delay={i * 120}>
                <figure className="liquid-glass-strong glow-ring rounded-2xl p-8 h-full flex flex-col noise relative">
                  <div className="text-5xl text-white/30 leading-none mb-4 font-normal" aria-hidden>"</div>
                  <blockquote className="text-lg text-gray-200 leading-relaxed mb-8 tracking-tight">
                    {q.quote}
                  </blockquote>
                  <figcaption className="mt-auto pt-6 border-t border-white/10">
                    <div className="text-sm font-medium">{q.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{q.role}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <section className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl animate-aurora" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center flex flex-col items-center">
          <SectionHeading eyebrow="05 — Our Focus" className="text-4xl md:text-6xl lg:text-7xl font-normal max-w-4xl tracking-tightest">
            This isn't crypto. <br className="hidden md:block" />
            <span className="gradient-text">It's better payments.</span>
          </SectionHeading>

          <Reveal delay={200}>
            <p className="mt-8 text-gray-400 text-lg md:text-xl font-light tracking-wide leading-relaxed max-w-2xl text-center">
              FlowFi is built for freelancers and businesses who need faster payments — not complexity. Behind the scenes, we use modern infrastructure to make payments faster, cheaper, and reliable.
              <br /><br />
              <span className="text-gray-200">But for you, it just works.</span>
            </p>
          </Reveal>
        </div>
      </section>


      <section id="faq" className="relative bg-black text-white py-32 px-6 md:px-12 lg:px-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeading eyebrow="06 — FAQ" className="text-4xl md:text-6xl lg:text-7xl font-normal text-center tracking-tightest">
            Questions, answered.
          </SectionHeading>

          <div className="mt-16 space-y-3">
            {faqs.map((f, i) => {
              const isOpen = faqOpen === i;
              return (
                <Reveal key={f.q} delay={i * 60}>
                  <div className="liquid-glass-strong glow-ring rounded-2xl overflow-hidden noise relative">
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 px-6 md:px-8 py-6 text-left hover:bg-white/[0.03] transition-colors relative z-20"
                    >
                      <span className="text-lg md:text-xl font-normal tracking-tight text-gray-200">
                        {f.q}
                      </span>
                      <span className={`shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-transform duration-300 text-gray-400 ${isOpen ? "rotate-45" : ""}`}>
                        +
                      </span>
                    </button>
                    <div className="grid transition-all duration-500 ease-out relative z-20" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <p className="px-6 md:px-8 pb-6 text-gray-400 leading-relaxed max-w-2xl">
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
            <div className="liquid-glass-strong glow-ring rounded-[2rem] p-10 md:p-20 text-center noise relative">
              <div className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-8">Ready to start?</div>
              <h2 className="text-4xl md:text-6xl lg:text-8xl font-normal mb-8 tracking-tightest">
                Stop waiting for <br />
                <span className="gradient-text">your money.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto mb-12">
                Get paid when the work starts — not weeks later.
              </p>
              <div className="flex flex-wrap gap-4 justify-center relative z-20">
                <Link href="/freelancer" className="group bg-white text-black px-8 py-4 rounded-xl font-medium hover:bg-gray-100 transition-all inline-flex items-center gap-2">
                  Get Paid Now
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/client" className="liquid-glass border border-white/20 text-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-white transition-colors">
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