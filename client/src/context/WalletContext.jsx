import { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(() => {
    const saved = localStorage.getItem('evease_wallet');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
      cooldowns: {}, // { 'daily_login': '2024-10-26', 'charge_challenge': '2024-10-26' }
    };
  });

  useEffect(() => {
    localStorage.setItem('evease_wallet', JSON.stringify(wallet));
  }, [wallet]);

  const addCoins = (amount, description, gameId = null) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check cooldown
    if (gameId && wallet.cooldowns[gameId] === today) {
      return { success: false, message: 'You have already played this today!' };
    }

    const newTx = {
      id: Date.now(),
      amount,
      type: 'earned',
      description,
      date: new Date().toLocaleString()
    };

    setWallet(prev => {
      const newCooldowns = { ...prev.cooldowns };
      if (gameId) {
        newCooldowns[gameId] = today;
      }
      return {
        ...prev,
        balance: prev.balance + amount,
        totalEarned: prev.totalEarned + amount,
        transactions: [newTx, ...prev.transactions],
        cooldowns: newCooldowns
      };
    });

    return { success: true };
  };

  const spendCoins = (amount, description) => {
    if (wallet.balance < amount) {
      return { success: false, message: 'Insufficient EVE Coins!' };
    }

    const newTx = {
      id: Date.now(),
      amount,
      type: 'spent',
      description,
      date: new Date().toLocaleString()
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance - amount,
      totalSpent: prev.totalSpent + amount,
      transactions: [newTx, ...prev.transactions]
    }));

    return { success: true };
  };

  const checkCooldown = (gameId) => {
    const today = new Date().toISOString().split('T')[0];
    return wallet.cooldowns[gameId] === today;
  };

  return (
    <WalletContext.Provider value={{ wallet, addCoins, spendCoins, checkCooldown }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
