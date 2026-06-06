import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './MiniGames.css';

export default function MiniGames() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { addCoins, checkCooldown } = useWallet();
  const [result, setResult] = useState(null);
  
  // Game state
  const isCooldown = checkCooldown(gameId);

  // Hypercharge State
  const [chargeClicks, setChargeClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10.0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  // Quiz State
  const questions = [
    { q: "What is the primary power source for the EVEase core infrastructure?", options: ["Fossil Fuels", "Renewable Energy Grid", "Nuclear Fusion", "Geothermal"], answer: 1 },
    { q: "Which charging protocol delivers the fastest energy transfer?", options: ["AC Type 2", "CHAdeMO", "CCS2 Ultra-Fast", "Wireless Induction"], answer: 2 },
    { q: "What does 'V2G' stand for in smart grid technology?", options: ["Vehicle to Grid", "Voltage to Ground", "Variable 2-way Generator", "Virtual 2-Gigabit"], answer: 0 }
  ];
  const [currentQ, setCurrentQ] = useState(0);
  const [quizStatus, setQuizStatus] = useState('playing'); // playing, correct, wrong

  // Spin State
  const [spinDeg, setSpinDeg] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleGameEnd = (won, coins, msg) => {
    if (won) {
      addCoins(coins, `Won ${gameId} event`, gameId);
      setResult({ status: 'success', message: msg, coins });
    } else {
      // Just set cooldown without coins
      addCoins(0, `Played ${gameId}`, gameId);
      setResult({ status: 'failed', message: msg, coins: 0 });
    }
  };

  // Hypercharge Logic
  const startHypercharge = () => {
    setIsActive(true);
    setChargeClicks(0);
    setTimeLeft(10.0);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          handleGameEnd(false, 0, "Grid destabilized. Insufficient power injected in time.");
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
  };

  const tapCharge = () => {
    if (!isActive) return;
    setChargeClicks(prev => {
      const next = prev + 1;
      if (next >= 50) {
        clearInterval(timerRef.current);
        setIsActive(false);
        handleGameEnd(true, 30, "Grid Stabilized! Maximum power capacity reached.");
      }
      return next;
    });
  };

  // Quiz Logic
  const handleAnswer = (idx) => {
    if (quizStatus !== 'playing') return;
    
    if (idx === questions[currentQ].answer) {
      if (currentQ === questions.length - 1) {
        setQuizStatus('correct');
        handleGameEnd(true, 25, "Knowledge matrix validated. All sectors clear.");
      } else {
        setQuizStatus('correct');
        setTimeout(() => {
          setCurrentQ(c => c + 1);
          setQuizStatus('playing');
        }, 1000);
      }
    } else {
      setQuizStatus('wrong');
      setTimeout(() => {
        handleGameEnd(false, 0, "Incorrect parameter provided. Matrix validation failed.");
      }, 1000);
    }
  };

  // Spin Logic
  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const newDeg = Math.floor(Math.random() * 2520) + 1080;
    setSpinDeg(newDeg);
    
    setTimeout(() => {
      setIsSpinning(false);
      const possibleCoins = [10, 20, 30, 40, 50, 100];
      const won = possibleCoins[Math.floor(Math.random() * possibleCoins.length)];
      handleGameEnd(true, won, `Quantum spin complete. You extracted ${won} EVE Coins.`);
    }, 5000);
  };

  const renderContent = () => {
    if (isCooldown) {
      return (
        <div className="game-result-overlay failed">
          <h3><i className="fas fa-lock"></i> Protocol Locked</h3>
          <p>You have already accessed this sector today. Please return after the core resets in 24 hours.</p>
          <button className="game-btn" style={{marginTop: '2rem'}} onClick={() => navigate('/rewards')}>Return to Hub</button>
        </div>
      );
    }

    if (result) {
      return (
        <div className={`game-result-overlay ${result.status === 'success' ? '' : 'failed'}`}>
          <h3>{result.status === 'success' ? <><i className="fas fa-check-circle"></i> Success</> : <><i className="fas fa-times-circle"></i> Failed</>}</h3>
          <p>{result.message}</p>
          {result.coins > 0 && <p style={{fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem'}}>+{result.coins} EVE Coins</p>}
          <button className="game-btn" style={{marginTop: '2rem'}} onClick={() => navigate('/rewards')}>Return to Hub</button>
        </div>
      );
    }

    switch(gameId) {
      case 'hypercharge':
        return (
          <>
            <div className="timer-display">{timeLeft.toFixed(1)}s</div>
            <div className={`hypercharge-core ${isActive ? 'active' : ''}`}>
              <div className="core-level" style={{ height: `${Math.min(chargeClicks * 2, 100)}%` }}></div>
              <i className="fas fa-bolt core-icon"></i>
            </div>
            {!isActive && timeLeft === 10.0 ? (
              <button className="game-btn" onClick={startHypercharge}>Initiate Sequence</button>
            ) : (
              <button className="game-btn" onClick={tapCharge}>INJECT POWER</button>
            )}
          </>
        );
      
      case 'knowledge':
        return (
          <div className="quiz-container">
            <div className="quiz-question">
              Sector {currentQ + 1} / {questions.length}:<br/><br/>
              {questions[currentQ].q}
            </div>
            <div className="quiz-options">
              {questions[currentQ].options.map((opt, i) => {
                let className = "quiz-option";
                if (quizStatus !== 'playing') {
                  className += " disabled";
                  if (i === questions[currentQ].answer) className += " correct";
                  else if (quizStatus === 'wrong') className += " wrong";
                }
                return (
                  <div key={i} className={className} onClick={() => handleAnswer(i)}>
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'quantum':
        return (
          <>
            <div className="wheel-wrapper">
              <div className="wheel-pointer"><i className="fas fa-caret-down"></i></div>
              <div className="wheel" style={{ transform: `rotate(${spinDeg}deg)` }}></div>
              <div className="wheel-center"></div>
            </div>
            <button className="game-btn" onClick={handleSpin} disabled={isSpinning}>
              {isSpinning ? 'Executing...' : 'Execute Spin'}
            </button>
          </>
        );

      default:
        return <h2>Unknown Protocol</h2>;
    }
  };

  const titles = {
    hypercharge: { t: "Hypercharge Sequence", d: "Stabilize the power grid before time runs out." },
    knowledge: { t: "Knowledge Matrix", d: "Validate your infrastructure expertise." },
    quantum: { t: "Quantum Spin", d: "Execute the algorithm to extract random EVE tokens." }
  };

  return (
    <div className="minigames-layout">
      <div className="game-container">
        <Link to="/rewards" className="back-btn"><i className="fas fa-arrow-left"></i> Abort Sequence</Link>
        <h1 className="game-title">{titles[gameId]?.t || 'Unknown'}</h1>
        <p className="game-desc">{titles[gameId]?.d}</p>
        
        {renderContent()}
      </div>
    </div>
  );
}
