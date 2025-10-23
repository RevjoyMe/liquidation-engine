import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseEther, formatEther } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'
import './Dashboard.css'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [supplyAmount, setSupplyAmount] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')
  
  const { writeContract, isPending } = useWriteContract()
  
  // Read user position
  const { data: position } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'positions',
    args: address ? [address] : undefined,
  })
  
  // Read health factor
  const { data: healthFactor } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getHealthFactor',
    args: address ? [address] : undefined,
  })
  
  const handleSupply = () => {
    if (!supplyAmount) return
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'supply',
      value: parseEther(supplyAmount),
    })
    setSupplyAmount('')
  }
  
  const handleBorrow = () => {
    if (!borrowAmount) return
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'borrow',
      args: [parseEther(borrowAmount)],
    })
    setBorrowAmount('')
  }
  
  const hf = healthFactor ? Number(healthFactor) / 100 : 0
  const getHFColor = () => {
    if (hf >= 2) return '#4ade80'
    if (hf >= 1.5) return '#facc15'
    if (hf >= 1.1) return '#fb923c'
    return '#f87171'
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Your Dashboard</h2>
        <ConnectButton />
      </div>
      
      {!isConnected ? (
        <div className="connect-prompt">
          <h3>Connect Your Wallet</h3>
          <p>Connect to start supplying collateral and borrowing</p>
        </div>
      ) : (
        <>
          <div className="health-factor-card">
            <h3>Health Factor</h3>
            <div className="hf-display" style={{ color: getHFColor() }}>
              {hf > 0 ? hf.toFixed(2) : '∞'}
            </div>
            <div className="hf-gauge">
              <div 
                className="hf-fill" 
                style={{ 
                  width: `${Math.min(100, (hf / 2.5) * 100)}%`,
                  backgroundColor: getHFColor()
                }}
              />
            </div>
            <div className="hf-labels">
              <span>1.0 (Liquidation)</span>
              <span>1.5 (Caution)</span>
              <span>2.0+ (Safe)</span>
            </div>
            {hf < 1.2 && hf > 0 && (
              <div className="warning">⚠️ At Risk of Liquidation!</div>
            )}
          </div>
          
          <div className="position-grid">
            <div className="position-card">
              <h3>💰 Your Position</h3>
              <div className="position-stats">
                <div className="stat">
                  <span>Supplied:</span>
                  <strong>{position ? formatEther(position[0]) : '0'} ETH</strong>
                </div>
                <div className="stat">
                  <span>Borrowed:</span>
                  <strong>{position ? formatEther(position[1]) : '0'} USDC</strong>
                </div>
                <div className="stat">
                  <span>Collateral Value:</span>
                  <strong>${position ? (Number(formatEther(position[0])) * 2000).toFixed(2) : '0'}</strong>
                </div>
              </div>
            </div>
            
            <div className="action-card">
              <h3>📥 Supply Collateral</h3>
              <input
                type="number"
                placeholder="Amount in ETH"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
              />
              <button onClick={handleSupply} disabled={isPending || !supplyAmount}>
                {isPending ? 'Supplying...' : 'Supply ETH'}
              </button>
            </div>
            
            <div className="action-card">
              <h3>📤 Borrow</h3>
              <p className="max-borrow">
                Max: ${position ? ((Number(formatEther(position[0])) * 2000 * 100) / 150).toFixed(2) : '0'}
              </p>
              <input
                type="number"
                placeholder="Amount in USDC"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
              />
              <button onClick={handleBorrow} disabled={isPending || !borrowAmount}>
                {isPending ? 'Borrowing...' : 'Borrow USDC'}
              </button>
            </div>
          </div>
          
          <div className="info-card">
            <h3>⚡ Why MegaETH?</h3>
            <ul>
              <li>✅ 10ms liquidation window (vs 12+ sec on Ethereum)</li>
              <li>✅ Real-time Health Factor updates</li>
              <li>✅ Higher LTV ratios (more capital efficient)</li>
              <li>✅ Near-zero bad debt risk</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

