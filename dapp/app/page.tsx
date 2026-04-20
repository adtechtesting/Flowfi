"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, Coins, XCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white">


      <div className="relative min-h-[100svh] w-full overflow-hidden flex flex-col justify-end bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-[5]"></div>

        <main className="relative z-10 w-full px-6 flex justify-center pb-[150px] md:pb-[200px]">
          <div className="relative flex flex-col items-center text-center max-w-4xl w-full">

            <div className="absolute -top-6 -left-6 h-[5px] w-[5px] bg-white hidden md:block"></div>
            <div className="absolute -top-6 -right-6 h-[5px] w-[5px] bg-white hidden md:block"></div>
            <div className="absolute -bottom-6 -left-6 h-[5px] w-[5px] bg-white hidden md:block"></div>
            <div className="absolute -bottom-6 -right-6 h-[5px] w-[5px] bg-white hidden md:block"></div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center w-full"
            >
              <div className="flex flex-col leading-[1.1] mb-6">
                <h1 className="text-5xl md:text-[72px] font-light text-white tracking-tight">
                  Get paid instantly.
                </h1>
                <h2 className="text-4xl md:text-[60px] font-light italic text-white/90 tracking-tight mt-2">
                  Stop waiting weeks for your money.
                </h2>
              </div>

              <p className="max-w-xl text-lg md:text-xl text-white/60 font-sans mb-10 leading-relaxed font-light tracking-wide">
                Clients pay normally. You unlock your earnings immediately — no delays, no chasing invoices.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Link
                  href="/freelancer"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black font-medium transition-colors duration-300 w-full sm:w-auto text-lg"
                  style={{ borderRadius: '2px' }}
                >
                  Get Paid Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/client"
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-white/20 hover:bg-white/10 text-white font-medium transition-colors duration-300 w-full sm:w-auto text-lg"
                  style={{ borderRadius: '2px' }}
                >
                  Create a Job
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>


      <section className="relative w-full px-6 py-24 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl md:text-5xl font-light text-white mb-12 tracking-tight">
              Waiting to get paid is <span className="italic text-white/70">broken.</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-4">
                <XCircle className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <p className="text-white/60 font-light text-sm leading-relaxed tracking-wide">Freelancers wait 30–90 days for payments.</p>
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-4">
                <XCircle className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <p className="text-white/60 font-light text-sm leading-relaxed tracking-wide">Small businesses struggle with cash flow gaps.</p>
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-4">
                <XCircle className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <p className="text-white/60 font-light text-sm leading-relaxed tracking-wide">Cross-border payments are slow and expensive.</p>
              </div>
            </div>

            <div className="inline-block p-6 border border-white/10 bg-white/5 backdrop-blur-sm relative" style={{ borderRadius: '2px' }}>
              {/* Corner Accents */}
              <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white"></div>
              <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white"></div>
              <p className="text-xl md:text-2xl text-white font-light tracking-wide">
                You do the work — <span className="italic text-white/70">but the money comes late.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative w-full px-6 py-32 bg-[#050505] overflow-hidden border-t border-white/5">

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] opacity-40 pointer-events-none transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-30 pointer-events-none transform translate-y-1/4"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center flex flex-col items-center"
          >
            <h3 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
              Get your money <br className="hidden md:block" />
              <span className="italic text-white/90">when you earn it</span>
            </h3>
            <p className="text-white/50 max-w-xl text-lg font-light tracking-wide">
              FlowFi lets you unlock your earnings instantly. Money is secured upfront, withdraw most of it immediately, with no need to wait for approvals or bank delays.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure Payments",
                desc: "Money is locked safely before work begins. No risk, no chasing clients."
              },
              {
                icon: Zap,
                title: "Instant Payouts",
                desc: "Withdraw up to 85% immediately — even before the project is completed."
              },
              {
                icon: Globe,
                title: "Global Payments Made Easy",
                desc: "Clients pay like usual. You receive money instantly, anywhere in the world."
              },
              {
                icon: Coins,
                title: "Lower Fees",
                desc: "No expensive wire transfers. No hidden cuts taking a chunk of your earnings."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-10 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500 group"
              >
                <div className="absolute -top-[1px] -left-[1px] h-[3px] w-[3px] bg-white/50 group-hover:bg-white transition-colors"></div>
                <div className="absolute -top-[1px] -right-[1px] h-[3px] w-[3px] bg-white/50 group-hover:bg-white transition-colors"></div>
                <div className="absolute -bottom-[1px] -left-[1px] h-[3px] w-[3px] bg-white/50 group-hover:bg-white transition-colors"></div>
                <div className="absolute -bottom-[1px] -right-[1px] h-[3px] w-[3px] bg-white/50 group-hover:bg-white transition-colors"></div>

                <div className="mb-8 p-4 bg-white/[0.03] border border-white/5 inline-flex group-hover:bg-white/[0.05] transition-colors" style={{ borderRadius: '2px' }}>
                  <feature.icon className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-light text-white mb-4 tracking-wide">{feature.title}</h4>
                <p className="text-white/50 font-light leading-relaxed tracking-wide text-sm md:text-base">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section className="relative w-full px-6 py-32 bg-black border-t border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-24 text-center"
          >
            <h3 className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight">
              How It <span className="italic text-white/90">Works</span>
            </h3>
            <div className="w-12 h-[1px] bg-white/20 mx-auto"></div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 md:gap-6 w-full relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10"></div>

            {[
              { num: "1", title: "Client Pays", desc: "Client funds the job using normal payment methods." },
              { num: "2", title: "Money is Secured", desc: "Funds are locked safely and guaranteed." },
              { num: "3", title: "Get Paid Early", desc: "Withdraw most of your earnings instantly." },
              { num: "4", title: "Final Payment", desc: "Remaining amount is released after completion." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex-1 flex flex-col items-center text-center z-10 group"
              >
                <div className="w-16 h-16 bg-[#050505] border border-white/10 group-hover:border-white/40 group-hover:bg-white group-hover:text-black transition-all duration-300 flex items-center justify-center text-white/80 font-light text-xl mb-8 relative" style={{ borderRadius: '2px' }}>
                  <div className="absolute -top-[2px] -left-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-black/40 transition-colors"></div>
                  <div className="absolute -bottom-[2px] -right-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-black/40 transition-colors"></div>
                  {step.num}
                </div>
                <h4 className="text-lg font-light text-white mb-3 tracking-wide">{step.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed px-2 font-light tracking-wide">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section className="relative w-full px-6 py-24 bg-[#0a0a0a] border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl md:text-4xl font-light text-white mb-6 tracking-tight">
              Built for real work, <span className="italic text-white/70">not speculation</span>
            </h3>
            <p className="text-white/50 text-base md:text-lg font-light tracking-wide leading-relaxed">
              FlowFi is designed for freelancers and businesses who need faster payments — not crypto hype. Powered by secure infrastructure for instant, low-cost transactions.
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="relative w-full border-t border-white/10 py-32 px-6 flex flex-col items-center bg-black overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-[100%] blur-[100px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <h2 className="text-3xl md:text-5xl text-white font-light mb-10 tracking-tight">
            Ready to stop waiting for <span className="italic text-white/90">your money?</span>
          </h2>
          <Link
            href="/freelancer"
            className="group flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-white/90 text-black font-medium transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            style={{ borderRadius: '2px' }}
          >
            Get Paid Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <p className="mt-12 text-xs tracking-widest uppercase text-white/30 font-medium">
            Powered by Solana for fast, low-cost settlement
          </p>
        </motion.div>
      </footer>
    </div>
  );
}