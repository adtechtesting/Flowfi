"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network), [network]);


  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
