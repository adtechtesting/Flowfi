"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function Navbar() {
  const { wallets, select, disconnect, publicKey, connected } = useWallet();
  const address = publicKey?.toString();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-0 left-0 right-0 z-50 px-6 py-6 bg-transparent border-none selection:bg-white/20 selection:text-white font-sans"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-light tracking-tight text-white hover:text-white/80 transition-colors">
              FlowFi
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/freelancer"
              className="text-sm font-light text-white/60 tracking-wide transition-all hover:text-white hover:bg-white/5 px-4 py-2"
              style={{ borderRadius: '2px' }}
            >
              Get Paid
            </Link>
            <Link
              href="/client"
              className="text-sm font-light text-white/60 tracking-wide transition-all hover:text-white hover:bg-white/5 px-4 py-2"
              style={{ borderRadius: '2px' }}
            >
              Hire Talent
            </Link>
            <Link
              href="/profile"
              className="text-sm font-light text-white/60 tracking-wide transition-all hover:text-white hover:bg-white/5 px-4 py-2"
              style={{ borderRadius: '2px' }}
            >
              Profile
            </Link> <Link
              href="/how-it-works"
              className="text-sm font-light text-white/60 tracking-wide transition-all hover:text-white hover:bg-white/5 px-4 py-2"
              style={{ borderRadius: '2px' }}
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          {connected ? (
            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 backdrop-blur-md"
                style={{ borderRadius: '2px' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <span className="text-xs font-mono text-white/80 tracking-widest">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="bg-transparent border border-white/20 px-5 py-2 text-sm font-light text-white transition-all hover:bg-white/10 hover:border-white/30 backdrop-blur-md tracking-wide"
                style={{ borderRadius: '2px' }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-end">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] tracking-wide"
                style={{ borderRadius: '2px' }}
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>

              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-3 w-56 border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-2 shadow-2xl z-50"
                  style={{ borderRadius: '2px' }}
                >
                  {wallets && wallets.length > 0 ? (
                    wallets.map((w) => (
                      <button
                        key={w.adapter.name}
                        onClick={() => { select(w.adapter.name); setDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-3 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white font-light tracking-wide"
                        style={{ borderRadius: '2px' }}
                      >
                        <img
                          src={w.adapter.icon}
                          alt={w.adapter.name}
                          className="w-4 h-4 opacity-80"
                        />
                        {w.adapter.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-center text-white/40 font-light tracking-wide">
                      No wallets detected.
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}