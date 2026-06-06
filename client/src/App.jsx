import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WalletProvider } from './context/WalletContext';
import { ProtectedRoute, PremiumRoute, AdminRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AIPlanner from './pages/AIPlanner';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import LiveNavigation from './pages/LiveNavigation';
import ManualSearch from './pages/ManualSearch';
import ActiveCharging from './pages/ActiveCharging';
import Rewards from './pages/Rewards';
import MiniGames from './pages/MiniGames';

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subscription" element={<Subscription />} />
            
            {/* Basic Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/live-navigation" element={<LiveNavigation />} />
              <Route path="/manual-search" element={<ManualSearch />} />
              <Route path="/active-charging" element={<ActiveCharging />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/games/:gameId" element={<MiniGames />} />
            </Route>

            {/* Premium Features */}
            <Route element={<PremiumRoute />}>
              <Route path="/ai-planner" element={<AIPlanner />} />
              <Route path="/assistant" element={<Assistant />} />
            </Route>

            {/* Admin Dashboard */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
