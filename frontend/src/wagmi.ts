import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Liquidation Engine',
  projectId: 'YOUR_PROJECT_ID',
  chains: [{
    id: 7862,
    name: 'MegaETH Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.megaeth.io'] },
    },
    blockExplorers: {
      default: { name: 'MegaETH Explorer', url: 'https://explorer.megaeth.io' },
    },
  }],
  transports: {
    7862: http('https://rpc.megaeth.io'),
  },
  ssr: false,
})

