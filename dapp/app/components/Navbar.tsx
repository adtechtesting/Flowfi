"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_LINKS = [
  { name: "Get Paid", href: "/freelancer" },
  { name: "Hire Talent", href: "/client" },
  { name: "Profile", href: "/profile" },
  { name: "How it works", href: "/how-it-works" },
];

export function Navbar() {
  const { wallets, select, disconnect, publicKey, connected } = useWallet();
  const address = publicKey?.toString();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
    >
      {/* Main Navbar Bar */}
      <div className="relative liquid-glass-strong glow-ring noise px-4 md:px-8 h-16 rounded-2xl flex items-center justify-between border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group z-50">
          <span className="text-xl tracking-tighter text-white">
            <span className="font-bold">Flow</span>
            <span className="font-extralight text-white/70">Fi</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] font-medium text-white/50 tracking-[0.2em] uppercase transition-all hover:text-white hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 md:gap-4 z-50">
          {/* Wallet Button */}
          {connected ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-2 md:pl-3 pr-1 py-1 rounded-xl">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-mono text-white/60 tracking-wider">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="ml-1 md:ml-2 px-2 md:px-3 py-1 md:py-1.5 bg-white/10 hover:bg-white/20 text-[8px] md:text-[9px] font-bold text-white uppercase tracking-widest rounded-lg transition-all"
              >
                Exit
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 h-9 md:h-10 bg-white hover:bg-white/90 text-black text-[10px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
              >
                <Wallet className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </button>

              {/* Floating Wallet Dropdown */}
              <AnimatePresence>
                {dropdownOpen && !connected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-6 w-52 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[60] overflow-hidden"
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

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full mt-4 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl md:hidden z-40 shadow-2xl flex flex-col gap-2"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-[11px] font-bold text-white/60 hover:text-white tracking-[0.2em] uppercase rounded-xl hover:bg-white/5 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}