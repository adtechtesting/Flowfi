"use client";

import Link from "next/link";
import { useWalletConnection } from "@solana/react-hooks";
import { Wallet, Briefcase, Plus, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function Navbar() {
  const { connectors, connect, disconnect, wallet, status } = useWalletConnection();
  const address = wallet?.account.address.toString();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-50 border-b border-white/5 px-6 py-4"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FlowFi</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/client" className="flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
              <Briefcase className="h-4 w-4" /> Client Portal
            </Link>
            <Link href="/freelancer" className="flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
              <Coins className="h-4 w-4" /> Freelancer Hub
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          {status === "connected" ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-xs font-mono text-white/80">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:text-red-400"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-3 w-56 rounded-xl border border-white/10 bg-[#121214] p-2 shadow-2xl glass"
                >
                  {connectors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { connect(c.id); setDropdownOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {c.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
