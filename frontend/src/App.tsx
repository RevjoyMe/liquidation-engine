import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './wagmi'
import Dashboard from './components/Dashboard'
import '@rainbow-me/rainbowkit/styles.css'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="app">
            <header>
              <div className="header-content">
                <h1>⚡ Liquidation Engine</h1>
                <p className="subtitle">Instant liquidations with 10ms precision</p>
                <div className="badge">MegaETH Testnet</div>
              </div>
            </header>
            
            <main>
              <Dashboard />
            </main>
            
            <footer>
              <p>Built on MegaETH • Contract: 0x4a3401547b860761232834C947e7E011eBc4312</p>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

