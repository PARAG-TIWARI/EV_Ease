import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CustomSelect from '../components/CustomSelect';
import { useWallet } from '../context/WalletContext';
import './ManualSearch.css';

export default function ManualSearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('EV Charging Stations');
  const [connector, setConnector] = useState('All');
  const [power, setPower] = useState('All');
  const { wallet, spendCoins, addCoins } = useWallet();

  // Booking Modal State
  const [bookingStation, setBookingStation] = useState(null);
  const [useCoins, setUseCoins] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const handleBook = (e) => {
    e.preventDefault();
    if (useCoins && wallet.balance > 0) {
      const discount = Math.min(wallet.balance, 50);
      spendCoins(discount, `Applied discount to ${bookingStation.name} booking`);
    }
    // Reward for booking
    addCoins(20, `Booking reward for ${bookingStation.name}`, null);
    
    setBookingSuccess({
      ...bookingStation,
      earned: 20,
      saved: useCoins ? Math.min(wallet.balance, 50) : 0
    });
  };

  // We use the basic Google Maps embed URL which doesn't require an API key for simple query searches.
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <div className="header-actions">
          <div className="greeting">
            <h1>Manual Station Search</h1>
            <p>Explore real-time global charging infrastructure via Google Maps.</p>
          </div>
        </div>

        <div className="search-controls-grid">
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a city, zip code, or station network..."
            />
          </div>
          
          <div style={{ zIndex: 60 }}>
            <CustomSelect 
              options={[
                { value: 'All', label: 'Any Connector' },
                { value: 'Type 2', label: 'Type 2' },
                { value: 'CCS2', label: 'CCS2' },
                { value: 'CHAdeMO', label: 'CHAdeMO' }
              ]}
              value={connector}
              onChange={setConnector}
              icon="fas fa-plug"
            />
          </div>

          <div style={{ zIndex: 59 }}>
            <CustomSelect 
              options={[
                { value: 'All', label: 'Any Speed' },
                { value: 'Fast', label: 'Fast (50kW+)' },
                { value: 'Ultra', label: 'Ultra-Fast (150kW+)' }
              ]}
              value={power}
              onChange={setPower}
              icon="fas fa-bolt"
            />
          </div>
        </div>

        <div className="map-container fade-in">
          <div className="map-overlay-badge">
            <i className="fas fa-satellite-dish"></i> Live Google Maps Feed
          </div>
          <iframe 
            src={mapSrc}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <div className="nearby-stations">
          <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-map-pin"></i> Stations found near "{searchQuery}"</h3>
          <div className="stations-grid">
            {[1, 2, 3].map((item) => (
              <div key={item} className="station-card">
                <div className="station-card-header">
                  <div>
                    <h4>EVEase Superhub {item}</h4>
                    <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fas fa-star"></i>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>4.{9 - item}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({85 + (item * 12)} reviews)</span>
                    </div>
                  </div>
                  <span className="badge-success">Available</span>
                </div>
                <p><i className="fas fa-bolt"></i> 150 kW • {connector === 'All' ? 'CCS2' : connector}</p>
                <p><i className="fas fa-rupee-sign"></i> ₹18/kWh</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn-outline" style={{ flex: 1 }}>
                    <i className="fas fa-map"></i> View
                  </button>
                  <button className="btn-outline" style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => setBookingStation({ name: `EVEase Superhub ${item}`, id: item })}>
                    <i className="fas fa-calendar-check"></i> Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {bookingStation && !bookingSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Reserve Slot</h2>
              <button onClick={() => setBookingStation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
            </div>
            <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1.5rem' }}>{bookingStation.name}</p>
            
            <form onSubmit={handleBook}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Date</label>
                <input type="date" required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Time</label>
                <input type="time" required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white' }} />
              </div>

              {wallet.balance > 0 && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', margin: 0 }}>Apply EVE Coins</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Use up to 50 coins for a discount.</p>
                  </div>
                  <input type="checkbox" checked={useCoins} onChange={(e) => setUseCoins(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'black', fontWeight: 700, borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {bookingSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '3rem', borderRadius: '24px', width: '90%', maxWidth: '500px', border: '1px solid var(--primary)', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>
              <i className="fas fa-check"></i>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Reservation Confirmed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your slot at {bookingSuccess.name} is reserved.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
              {bookingSuccess.saved > 0 && <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '0.5rem' }}>🎉 You saved {bookingSuccess.saved} INR using EVE coins!</p>}
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>🎁 You earned {bookingSuccess.earned} EVE coins for this booking!</p>
            </div>

            <button onClick={() => { setBookingStation(null); setBookingSuccess(null); }} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

