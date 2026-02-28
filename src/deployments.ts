import sepolia from '../deployments/sepolia.json';

export type SupportedNetwork = 'mainnet' | 'sepolia';

export type DeploymentRecord = {
  network: string;
  rpc_url?: string;
  deployer_account?: string;
  last_updated?: string;
  contracts: Record<
    string,
    {
      address?: string;
      class_hash?: string;
      declaration_tx?: string;
      deployment_tx?: string;
      artifact?: string;
    }
  >;
  notes?: string[];
};

const FALLBACK_MAINNET: DeploymentRecord = {
  network: 'mainnet',
  contracts: {},
};

export const DEPLOYMENTS: Record<SupportedNetwork, DeploymentRecord> = {
  mainnet: FALLBACK_MAINNET,
  sepolia,
};

export function getContractAddress(
  network: SupportedNetwork,
  contractName: string,
  fallback = '0x0',
): string {
  const record = DEPLOYMENTS[network];
  return record?.contracts?.[contractName]?.address ?? fallback;
}

