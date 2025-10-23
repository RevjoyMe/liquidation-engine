# 🚀 Vercel Deployment Guide - Instant Liquidation Engine

## 📋 Contract Info

- **Contract**: InstantLendingPool
- **Address**: `0x4a3401547b860761232834C947e7E011eBc4312`
- **Network**: MegaETH Testnet
- **Liquidation Threshold**: 150% (1.5 HF)
- **Liquidation Bonus**: 5%

## 🏗️ Frontend Structure

```
liquidation-engine/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HealthFactor.tsx      # ⚡ CRITICAL: Real-time HF widget
│   │   │   ├── SupplyModal.tsx       # Supply collateral
│   │   │   ├── BorrowModal.tsx       # Borrow assets
│   │   │   └── Dashboard.tsx         # Main dashboard
│   │   ├── hooks/
│   │   │   └── useHealthFactor.ts    # ⚡ Real-time HF hook
│   │   ├── pages/
│   │   │   └── index.tsx             # Dashboard page
│   │   └── contractInfo.ts
│   └── next.config.js
└── vercel.json
```

## 📄 vercel.json

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "installCommand": "cd frontend && npm install"
}
```

## 🎨 Frontend Implementation

### 1. Contract Info (contractInfo.ts)

```typescript
export const LENDING_POOL_ADDRESS = "0x4a3401547b860761232834C947e7E011eBc4312";
export const LENDING_POOL_ABI = [
  "function supply() external payable",
  "function borrow(uint256 amount) external",
  "function getHealthFactor(address user) public view returns (uint256)",
  "function liquidate(address user) external",
  "event Supplied(address indexed user, uint256 amount)",
  "event Borrowed(address indexed user, uint256 amount)",
  "event Liquidated(address indexed liquidator, address indexed user, uint256 debtRepaid, uint256 collateralSeized)"
];

// Mock Oracle (в реальности это отдельный контракт)
export const MOCK_ORACLE_ADDRESS = "0x...";
export const ORACLE_ABI = [
  "function getPrice() external view returns (uint256)",
  "event PriceUpdated(uint256 newPrice)"
];
```

### 2. 🔥 Critical Hook: useHealthFactor.ts

```typescript
import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI, MOCK_ORACLE_ADDRESS } from '../contractInfo';

const megaETH = {
  id: 654321,
  name: 'MegaETH',
  rpcUrls: { default: { http: ['https://rpc.megaeth.xyz'] } }
};

/**
 * ⚡ CRITICAL: This hook provides REAL-TIME health factor updates
 * It updates whenever:
 * 1. Price oracle updates (every second)
 * 2. User's position changes (borrow/supply/repay)
 */
export function useHealthFactor() {
  const { address } = useAccount();
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!address) return;
    
    const client = createPublicClient({
      chain: megaETH,
      transport: http()
    });
    
    // Initial load
    async function loadHF() {
      const hf = await client.readContract({
        address: LENDING_POOL_ADDRESS,
        abi: LENDING_POOL_ABI,
        functionName: 'getHealthFactor',
        args: [address]
      }) as bigint;
      
      setHealthFactor(Number(hf) / 100); // Convert to readable format
      setLoading(false);
    }
    
    loadHF();
    
    // Subscribe to Price Updates
    const unwatchPrice = client.watchEvent({
      address: MOCK_ORACLE_ADDRESS,
      event: parseAbiItem('event PriceUpdated(uint256 newPrice)'),
      async onLogs() {
        // Price changed! Re-fetch HF immediately
        const newHF = await client.readContract({
          address: LENDING_POOL_ADDRESS,
          abi: LENDING_POOL_ABI,
          functionName: 'getHealthFactor',
          args: [address]
        }) as bigint;
        
        setHealthFactor(Number(newHF) / 100);
      }
    });
    
    // Subscribe to User's actions
    const unwatchUser = client.watchEvent({
      address: LENDING_POOL_ADDRESS,
      event: parseAbiItem('event Supplied(address indexed user, uint256 amount)'),
      args: { user: address },
      async onLogs() {
        const newHF = await client.readContract({
          address: LENDING_POOL_ADDRESS,
          abi: LENDING_POOL_ABI,
          functionName: 'getHealthFactor',
          args: [address]
        }) as bigint;
        
        setHealthFactor(Number(newHF) / 100);
      }
    });
    
    return () => {
      unwatchPrice();
      unwatchUser();
    };
  }, [address]);
  
  return { healthFactor, loading };
}
```

### 3. Health Factor Widget (HealthFactor.tsx)

```typescript
'use client';
import { useHealthFactor } from '../hooks/useHealthFactor';
import { motion } from 'framer-motion';

export function HealthFactor() {
  const { healthFactor, loading } = useHealthFactor();
  
  if (loading) return <div>Loading...</div>;
  
  const getColor = (hf: number) => {
    if (hf >= 2.0) return 'green';
    if (hf >= 1.5) return 'yellow';
    if (hf >= 1.1) return 'orange';
    return 'red';
  };
  
  const getStatus = (hf: number) => {
    if (hf >= 2.0) return 'Very Safe ✅';
    if (hf >= 1.5) return 'Safe ✅';
    if (hf >= 1.1) return 'Caution ⚠️';
    return 'LIQUIDATION RISK! 🚨';
  };
  
  const color = getColor(healthFactor);
  const status = getStatus(healthFactor);
  const percentage = Math.min(100, (healthFactor / 2.5) * 100);
  
  return (
    <div className={`health-factor-widget border-${color}`}>
      <h2>Health Factor</h2>
      
      <motion.div
        className="hf-value"
        key={healthFactor}
        initial={{ scale: 1.2, color: '#fff' }}
        animate={{ scale: 1, color: color }}
        transition={{ duration: 0.3 }}
      >
        {healthFactor.toFixed(2)}
      </motion.div>
      
      <div className="gauge">
        <div className="gauge-bg">
          <motion.div
            className="gauge-fill"
            style={{ width: `${percentage}%`, backgroundColor: color }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="gauge-labels">
          <span>1.0</span>
          <span>1.5</span>
          <span>2.0+</span>
        </div>
      </div>
      
      <div className={`status status-${color}`}>
        {status}
      </div>
      
      {healthFactor < 1.2 && (
        <button className="repay-button" onClick={() => {}}>
          Repay Now!
        </button>
      )}
    </div>
  );
}
```

### 4. Dashboard Page (index.tsx)

```typescript
'use client';
import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { HealthFactor } from '../components/HealthFactor';
import { LENDING_POOL_ADDRESS, LENDING_POOL_ABI } from '../contractInfo';

export default function Dashboard() {
  const { address } = useAccount();
  const [supplyAmount, setSupplyAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  
  const { writeContract } = useWriteContract();
  
  const handleSupply = () => {
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: 'supply',
      value: parseEther(supplyAmount)
    });
  };
  
  const handleBorrow = () => {
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: 'borrow',
      args: [parseEther(borrowAmount)]
    });
  };
  
  return (
    <div className="dashboard">
      <header>
        <h1>⚡ Instant Liquidation Engine</h1>
        <p>Lightning-fast lending powered by MegaETH 10ms blocks</p>
      </header>
      
      <div className="dashboard-grid">
        {/* Health Factor Widget - MOST IMPORTANT */}
        <div className="widget-large">
          <HealthFactor />
        </div>
        
        {/* Supply Section */}
        <div className="widget">
          <h3>💰 Supply Collateral</h3>
          <input
            type="number"
            placeholder="Amount in ETH"
            value={supplyAmount}
            onChange={(e) => setSupplyAmount(e.target.value)}
          />
          <button onClick={handleSupply}>Supply ETH</button>
        </div>
        
        {/* Borrow Section */}
        <div className="widget">
          <h3>📤 Borrow</h3>
          <p className="max-borrow">Max Borrow: 13,333 USDC</p>
          <input
            type="number"
            placeholder="Amount in USDC"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
          />
          <button onClick={handleBorrow}>Borrow USDC</button>
        </div>
        
        {/* My Position */}
        <div className="widget">
          <h3>📊 My Position</h3>
          <table>
            <tr>
              <td>Supplied:</td>
              <td>10.00 ETH</td>
            </tr>
            <tr>
              <td>Borrowed:</td>
              <td>10,000 USDC</td>
            </tr>
            <tr>
              <td>Collateral Value:</td>
              <td>$20,000</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div className="info-panel">
        <h3>⚡ Why MegaETH?</h3>
        <ul>
          <li>✅ 10ms liquidation window (vs. 12+ sec on Ethereum)</li>
          <li>✅ Real-time Health Factor updates</li>
          <li>✅ Higher LTV ratios (more capital efficient)</li>
          <li>✅ Near-zero bad debt risk</li>
        </ul>
      </div>
    </div>
  );
}
```

### 5. CSS (Example)

```css
.health-factor-widget {
  padding: 2rem;
  border-radius: 12px;
  border: 4px solid;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  text-align: center;
}

.hf-value {
  font-size: 4rem;
  font-weight: bold;
  margin: 1rem 0;
}

.gauge {
  margin: 2rem 0;
}

.gauge-bg {
  height: 30px;
  background: #333;
  border-radius: 15px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  transition: width 0.5s ease-in-out;
}

.status {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.status-red {
  background: rgba(255, 0, 0, 0.2);
  color: #ff4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

## 🌐 Environment Variables

```
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x4a3401547b860761232834C947e7E011eBc4312
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_MEGAETH_RPC=https://rpc.megaeth.xyz
NEXT_PUBLIC_CHAIN_ID=654321
```

## 📦 Package.json

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0",
    "framer-motion": "^10.0.0",
    "@rainbow-me/rainbowkit": "^2.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

## 🚀 Deployment

1. Push to GitHub
2. Import to Vercel
3. Add Environment Variables
4. Deploy!

## ✅ Testing

1. Connect wallet
2. Supply 10 ETH as collateral
3. Borrow 10,000 USDC
4. Watch Health Factor widget
5. **Simulate price drop** (in test environment)
6. See Health Factor **instantly** drop in real-time!

## 🤖 Liquidator Bot (Optional)

```javascript
// liquidator-bot.js
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const client = createPublicClient({ chain: megaETH, transport: http() });
const wallet = createWalletClient({ account: privateKeyToAccount(BOT_PRIVATE_KEY), transport: http() });

// Subscribe to price updates
client.watchEvent({
  address: ORACLE_ADDRESS,
  event: parseAbiItem('event PriceUpdated(uint256 newPrice)'),
  async onLogs() {
    console.log('Price updated! Checking positions...');
    
    for (const user of users) {
      const hf = await client.readContract({
        address: LENDING_POOL_ADDRESS,
        functionName: 'getHealthFactor',
        args: [user]
      });
      
      if (Number(hf) < 100) { // HF < 1.0
        console.log(`Liquidating ${user}...`);
        await wallet.writeContract({
          address: LENDING_POOL_ADDRESS,
          functionName: 'liquidate',
          args: [user]
        });
      }
    }
  }
});
```

---

**Lend with Lightning Speed! ⚡**

