"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, Briefcase, Plus, Coins } from "lucide-react";
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
      className="absolute top-0 left-0 right-0 z-50 px-6 py-4 bg-transparent border-none"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">FlowFi</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/client" className="flex items-center gap-2 text-sm font-medium text-white transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg">
              Client Portal
            </Link>
            <Link href="/freelancer" className="flex items-center gap-2 text-sm font-medium text-white transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg">
              Freelancer Hub
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          {connected ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-xs font-mono text-white/80">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:text-red-400 backdrop-blur-md"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-end">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#171717] bg-[#f8f8f8] hover:bg-white transition-colors rounded-sm"
              >
                <Wallet className="h-4 w-4" />
                Connect
              </button>

              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/10 bg-[#121214]/90 backdrop-blur-md p-2 shadow-2xl z-50"
                >
                  {wallets && wallets.length > 0 ? (
                    wallets.map((w) => (
                      <button
                        key={w.adapter.name}
                        onClick={() => { select(w.adapter.name); setDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <img 
                          src={w.adapter.icon} 
                          alt={w.adapter.name} 
                          className="w-4 h-4"
                        />
                        {w.adapter.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-center text-white/50">
                      No wallets available.
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