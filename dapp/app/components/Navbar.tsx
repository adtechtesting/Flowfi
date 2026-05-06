"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function Navbar() {
  const { wallets, select, disconnect, publicKey, connected } = useWallet();
  const address = publicKey?.toString();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
    >
      {/* Main Navbar Bar */}
      <div className="relative liquid-glass-strong glow-ring noise px-8 h-16 rounded-2xl flex items-center justify-between border border-white/10 shadow-2xl">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">

          <span className="text-xl tracking-tighter text-white">
            <span className="font-bold">Flow</span>
            <span className="font-extralight text-white/70">Fi</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-10">
          {[
            { name: "Get Paid", href: "/freelancer" },
            { name: "Hire Talent", href: "/client" },
            { name: "Profile", href: "/profile" },
            { name: "How it works", href: "/how-it-works" },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] font-medium text-white/50 tracking-[0.2em] uppercase transition-all hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Wallet Button */}
        <div className="flex items-center gap-4">
          {connected ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-3 pr-1 py-1 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/60 tracking-wider">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="ml-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white uppercase tracking-widest rounded-lg transition-all"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-6 h-10 bg-white hover:bg-white/90 text-black text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
              >
                <Wallet className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                Connect Wallet
              </button>

              {/* Floating Dropdown - Adjusted margin (mt-6) so it cleanly clears the bottom of the navbar */}
              <AnimatePresence>
                {dropdownOpen && !connected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-6 w-52 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[60] overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                      <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Select Provider</p>
                    </div>
                    {wallets && wallets.length > 0 ? (
                      wallets.map((w) => (
                        <button
                          key={w.adapter.name}
                          onClick={() => { select(w.adapter.name); setDropdownOpen(false); }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-[11px] text-zinc-400 transition-all hover:bg-white/10 hover:text-white rounded-xl group"
                        >
                          <img
                            src={w.adapter.icon}
                            alt={w.adapter.name}
                            className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100"
                          />
                          <span className="font-medium tracking-wide">{w.adapter.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-[10px] text-center text-white/30 italic">
                        No wallets detected.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}