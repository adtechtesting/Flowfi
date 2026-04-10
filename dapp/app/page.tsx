"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, Lock } from "lucide-react";

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


        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-[5]"></div>

        <main className="relative z-10 w-full px-6 flex justify-center pb-[200px] md:pb-[250px]">

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
              {/* Liquid Glass Badge */}
              <div className="mb-8 inline-flex items-center justify-center p-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                  <span className="text-xs font-semibold text-white uppercase tracking-[0.15em]">
                    Powered by Solana & Dodo
                  </span>
                </div>
              </div>

              {/* Dynamic Headline */}
              <div className="flex flex-col leading-[1.1] mb-6">
                <h1 className="text-4xl md:text-[64px] font-light text-white tracking-tight">
                  Programmable escrow &
                </h1>
                <h2 className="text-4xl md:text-[64px] font-light italic text-white/90 tracking-tight">
                  instant payment rails
                </h2>
              </div>

              {/* Sub-headline */}
              <p className="max-w-xl text-base md:text-lg text-white/60 font-sans mb-10 leading-relaxed font-light tracking-wide">
                FlowFi combines decentralized escrow, instant 85% salary advances,
                and global fiat on-ramps to redefine how freelancers and clients operate globally.
              </p>

              {/* Sharp Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Link
                  href="/client"
                  className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-white/90 text-black font-medium transition-colors duration-300 w-full sm:w-auto"
                  style={{ borderRadius: '2px' }}
                >
                  Hire a Freelancer
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/freelancer"
                  className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-white/20 hover:bg-white/10 text-white font-medium transition-colors duration-300 w-full sm:w-auto"
                  style={{ borderRadius: '2px' }}
                >
                  Freelancer Hub
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>


      <section className="relative w-full px-6 py-32 bg-black overflow-hidden border-t border-white/5">


        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] opacity-50 pointer-events-none transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-40 pointer-events-none transform translate-y-1/4"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center flex flex-col items-center"
          >
            <h3 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
              Infrastructure for the <br className="hidden md:block" />
              <span className="italic text-white/90">global workforce</span>
            </h3>
            <p className="text-white/50 max-w-xl text-lg font-light tracking-wide">
              Bridging the gap between traditional fiat invoicing and high-speed blockchain settlement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature Cards with Corner Accents */}
            {[
              {
                icon: Shield,
                title: "Programmable Escrow",
                desc: "Funds are securely locked in Solana smart contracts. Releases are tied to automated milestones, protecting both clients and freelancers."
              },
              {
                icon: Zap,
                title: "Instant 85% Advances",
                desc: "Don't wait for net-30 terms. As soon as the client deposits into escrow, workers can instantly draw up to 85% of their payment."
              },
              {
                icon: Globe,
                title: "Dodo Payments Fiat Rail",
                desc: "Clients pay in USD via credit cards or bank transfers. We automatically route and convert the fiat into USDC for on-chain settlement."
              },
              {
                icon: Lock,
                title: "Solana Speed & Low Fees",
                desc: "Settlements occur at the speed of light for fractions of a penny. Forget wire transfer fees or platform cuts taking 20% of your money."
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
                {/* Micro Corner Accents */}
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


      <section className="relative w-full px-6 py-32 bg-[#050505] border-t border-white/5 overflow-hidden">

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-24 text-center"
          >
            <h3 className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight">
              How FlowFi <span className="italic text-white/90">Works</span>
            </h3>
            <div className="w-12 h-[1px] bg-white/20 mx-auto"></div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 md:gap-8 w-full relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10"></div>

            {/* Steps */}
            {[
              { num: "01", title: "Client Funds Escrow", desc: "Client pays via fiat or crypto. Funds are securely locked in the FlowFi vault." },
              { num: "02", title: "Freelancer Advance", desc: "Instantly draw down up to 85% of the locked capital before starting the work." },
              { num: "03", title: "Automated Settlement", desc: "Upon milestone completion, the remaining 15% is released instantly on-chain." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex-1 flex flex-col items-center text-center z-10 group"
              >
                <div className="w-16 h-16 bg-black border border-white/10 group-hover:border-white/30 transition-colors flex items-center justify-center text-white/80 font-mono text-sm tracking-widest mb-8 relative" style={{ borderRadius: '2px' }}>
                  {/* Step Corner Accents */}
                  <div className="absolute -top-[2px] -left-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-white/60"></div>
                  <div className="absolute -bottom-[2px] -right-[2px] h-[4px] w-[4px] bg-white/20 group-hover:bg-white/60"></div>
                  {step.num}
                </div>
                <h4 className="text-lg font-light text-white mb-3 tracking-wide">{step.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed px-4 font-light tracking-wide">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <footer className="relative w-full border-t border-white/10 py-32 px-6 flex flex-col items-center bg-black overflow-hidden">
        {/* Footer Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-[100%] blur-[100px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <h2 className="text-3xl md:text-5xl text-white font-light mb-8 tracking-tight">
            Ready to upgrade your <span className="italic text-white/90">workflow?</span>
          </h2>
          <Link
            href="/client"
            className="group flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-white/90 text-black font-medium transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            style={{ borderRadius: '2px' }}
          >
            Start Building
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </footer>
    </div>
  );
}