import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useWallet } from '../context/WalletContext';
import './Rewards.css';

export default function Rewards() {
  const { wallet, addCoins, checkCooldown } = useWallet();
  const [claimStatus, setClaimStatus] = useState(
    checkCooldown('daily_login') ? 'claimed' : 'available'
  );

  const handleClaim = () => {
    if (claimStatus === 'claimed') return;
    setClaimStatus('claiming');
    setTimeout(() => {
      const res = addCoins(10, 'Daily Protocol Bonus', 'daily_login');
      if (res.success) {
        setClaimStatus('claimed');
      } else {
        setClaimStatus('available');
      }
    }, 1500); // simulate network delay for smooth animation
  };

  return (
    <div className="rewards-layout dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="rewards-header">
          <div>
            <h1>EVEase Rewards Hub</h1>
            <p style={{ color: 'var(--text-muted)' }}>Accumulate protocol tokens (EVE) and reduce your charging costs.</p>
          </div>
        </header>

        <div className="wallet-master-card">
          <div className="wallet-balance-display">
            <div className="wallet-icon-large">
              <i className="fas fa-bolt"></i>
            </div>
            <div>
              <p style={{ color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Active Balance</p>
              <div className="wallet-balance-text">{wallet.balance} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>EVE</span></div>
            </div>
          </div>

          <button 
            className="claim-btn" 
            onClick={handleClaim}
            disabled={claimStatus !== 'available'}
          >
            {claimStatus === 'available' && <><i className="fas fa-gift"></i> Initialize Daily Claim</>}
            {claimStatus === 'claiming' && <><i className="fas fa-spinner fa-spin"></i> Processing Signature...</>}
            {claimStatus === 'claimed' && <><i className="fas fa-check-circle"></i> Daily Protocol Claimed</>}
          </button>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--text-main)' }}>Engage & Earn</h2>
        
        <div className="games-grid">
          <Link to="/games/hypercharge" className="game-card">
            <div className="game-icon-wrapper"><i className="fas fa-charging-station"></i></div>
            <h3>Hypercharge Sequence</h3>
            <p>Stabilize the grid by rapidly injecting power. A highly advanced tapping interface.</p>
            <div className="play-badge">Initialize Sequence</div>
          </Link>
          
          <Link to="/games/knowledge" className="game-card">
            <div className="game-icon-wrapper"><i className="fas fa-brain"></i></div>
            <h3>Knowledge Matrix</h3>
            <p>Test your EV infrastructure knowledge against the core mainframe.</p>
            <div className="play-badge">Access Matrix</div>
          </Link>

          <Link to="/games/quantum" className="game-card">
            <div className="game-icon-wrapper"><i className="fas fa-dharmachakra"></i></div>
            <h3>Quantum Probability</h3>
            <p>Execute the quantum spin protocol to receive randomized EVE token drops.</p>
            <div className="play-badge">Execute Spin</div>
          </Link>
        </div>

        <div className="tx-panel">
          <div className="tx-header">
            <h3>Protocol Ledger</h3>
          </div>
          <div>
            {wallet.transactions.length > 0 ? (
              wallet.transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-left">
                    <div className={`tx-icon ${tx.type}`}>
                      <i className={`fas ${tx.type === 'earned' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{tx.description}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tx.date}</div>
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No network transactions recorded.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
