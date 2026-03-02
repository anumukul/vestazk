'use client';

import { ReactNode } from "react";
import { mainnet, sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
  voyager
} from "@starknet-react/core";

export function StarknetProvider({ children }: { children: ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // Show these wallets by default
    recommended: [
      argent(),
      braavos(),
    ],
    // Hide recommended wallets if they're not installed
    includeRecommended: "onlyIfNoConnectors",
    // Auto-connect to previously connected wallet
    order: "random"
  });

  return (
    <StarknetConfig
      chains={[sepolia, mainnet]}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
