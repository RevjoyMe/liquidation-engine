import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>Liquidation Engine</h1>
        <p className="subtitle">Instant liquidation lending protocol</p>
        <div className="badge">Built on MegaETH</div>
      </header>
      
      <main>
        <section className="info-card">
          <h2>Contract Deployed</h2>
          <div className="contract-info">
            <p><strong>Address:</strong></p>
            <code className="address">0x4a3401547b860761232834C947e7E011eBc4312</code>
            <a 
              href="https://megaexplorer.xyz/address/0x4a3401547b860761232834C947e7E011eBc4312"
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Explorer →
            </a>
          </div>
        </section>
        
        <section className="info-card">
          <h2>Network Info</h2>
          <ul className="network-info">
            <li><strong>Network:</strong> MegaETH Testnet</li>
            <li><strong>RPC URL:</strong> https://rpc.megaeth.xyz</li>
            <li><strong>Chain ID:</strong> 654321</li>
            <li><strong>Block Time:</strong> 10ms</li>
          </ul>
        </section>
        
        <section className="info-card">
          <h2>Documentation</h2>
          <p>Full documentation and implementation guide:</p>
          <a 
            href="https://github.com/RevjoyMe/liquidation-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            View on GitHub →
          </a>
        </section>
        
        <section className="info-card highlight">
          <h2>Key Features</h2>
          <ul className="features">
            <li>Smart Contract Deployed</li>
            <li>10ms Block Time</li>
            <li>Real-time Updates</li>
            <li>Low Gas Fees</li>
            <li>High Throughput</li>
          </ul>
        </section>
      </main>
      
      <footer>
        <p>Built for MegaETH Hackathon</p>
      </footer>
    </div>
  )
}

export default App
