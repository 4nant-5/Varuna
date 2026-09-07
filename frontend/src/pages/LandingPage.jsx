import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShipCanvas from '../components/ShipCanvas';
import WorldMap from '../components/WorldMap';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Ship,
  Layers,
  ChevronDown,
  Anchor,
  Compass,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = window.scrollY / scrollHeight;
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* 3D Ship Background Canvas */}
      <ShipCanvas scrollProgress={scrollProgress} />

      {/* ─── SECTION 1: HERO (0% - 25%) ───────────────────────── */}
      <section className="landing-section hero-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 10 }}>
        <div className="hero-badge">
          <span style={{ width: '8px', height: '8px', borderRadius: '0', background: 'var(--accent-primary)', display: 'inline-block' }}></span>
          SIH26006 • Ministry of Steel • Government of India
        </div>

        <img
          src="/varuna-logo.png"
          alt="Varuna"
          style={{ height: '100px', width: 'auto', marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(14, 165, 233, 0.3))' }}
        />

        <h1 className="hero-title">
          Smarter Chartering &<br />
          <span style={{ color: 'var(--accent-primary)' }}>Brighter Trades</span>
        </h1>

        <p className="hero-subtitle">
          Varuna — Next-generation maritime intelligence platform engineered for bulk raw material procurement.
          Forecast dry bulk freight rates with XGBoost ML, simulate voyage economics, and discover optimal charter strategies for East Coast India ports.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Launch Charter Console</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Get Started</span>
              <ArrowRight size={18} />
            </Link>
          )}
          <a href="#map-section" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} />
            <span>Explore Trade Corridors</span>
          </a>
        </div>

        {/* Hero KPI Stat counters */}
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">8.4%</div>
            <div className="hero-stat-label">Avg. Charter Cost Reduction</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">94.2%</div>
            <div className="hero-stat-label">Freight Trend Accuracy</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">5 Ports</div>
            <div className="hero-stat-label">Paradip, Vizag, Haldia, Dhamra, Chennai</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">&lt; 300ms</div>
            <div className="hero-stat-label">Optimization Solver Latency</div>
          </div>
        </div>

        <div style={{ marginTop: '48px', color: 'var(--text-tertiary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', animation: 'bounce 2s infinite' }}>
          <span>Scroll to rotate bulk carrier & explore maritime intelligence</span>
          <ChevronDown size={18} color="var(--accent-primary)" />
        </div>
      </section>

      {/* ─── SECTION 2: 3D SHIP VOYAGE SIMULATION (25% - 50%) ─── */}
      <section className="landing-section" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 10 }}>
        <div className="glass-card" style={{ maxWidth: '780px', padding: '36px', background: 'rgba(10, 14, 26, 0.82)', border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            <Ship size={16} /> Hydrodynamic Voyage Simulation
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>
            Precision Fleet Allocation for Dry Bulk Cargos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            Whether procuring 160,000 MT of Brazilian iron ore or 75,000 MT of Queensland coking coal, Varuna's algorithms evaluate Capesize, Kamsarmax, Panamax, and Supramax vessels against draft limits, bunker fuel curves, and tidal windows at Indian discharge berths.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'left' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Bunker Fuel Mode</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>VLSFO / Eco-steaming</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Demurrage Risk</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>AI Queue Mitigation</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>TCE Benchmark</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>Real-time Baltic Indices</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: WORLD MAP MORPH (50% - 75%) ───────────── */}
      <section id="map-section" className="landing-section world-map-section" style={{ minHeight: '110vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10, padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="hero-badge">Overseas Supply Lines</div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
            Global Raw Material Corridors to East Coast India
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '15px' }}>
            Live tracking and cost-distance modeling from leading mining hubs in Australia, Indonesia, South Africa, and Brazil to Paradip, Visakhapatnam, and Haldia.
          </p>
        </div>

        <WorldMap />
      </section>

      {/* ─── SECTION 4: PLATFORM CAPABILITIES (75% - 85%) ─────── */}
      <section className="landing-section" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="hero-badge">Vessels | Voyages | Value</div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>
            Engineered for Steel PSUs & Bulk Procurers
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon">
              <TrendingUp size={24} color="#0A0A0A" />
            </div>
            <h3>XGBoost Freight Forecasting</h3>
            <p>
              Trained on macroeconomic variables, Baltic Dry Index (BDI), crude oil futures, seasonal monsoons, and iron ore demand to forecast freight rates up to 30 days ahead with confidence intervals.
            </p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon">
              <Compass size={24} color="#0A0A0A" />
            </div>
            <h3>Voyage Economics & TCE Calculator</h3>
            <p>
              Calculates daily Time Charter Equivalent (TCE), bunker fuel burn (VLSFO & MGO), canal tolls, port disbursement accounts (PDA), and laycan demurrage risk across all vessel classes.
            </p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon">
              <Zap size={24} color="#0A0A0A" />
            </div>
            <h3>Strategy Optimizer (Spot vs TC vs COA)</h3>
            <p>
              Algorithmic recommendations evaluating whether to execute a single-voyage Spot Charter, lock in a 3–6 month Period Time Charter, or enter a multi-voyage Contract of Affreightment (COA).
            </p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon">
              <Layers size={24} color="#0A0A0A" />
            </div>
            <h3>Live Commodity & Market Ticker</h3>
            <p>
              Real-time feed tracking Coking Coal (FOB Aus), Iron Ore Fines 62% Fe (CFR Qingdao), Thermal Coal (FOB Indo), Scrap & Rebar, alongside Baltic Capesize and Panamax Indices.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: SIGN IN / INSTANT ACCESS (85% - 100%) ──── */}
      <section className="landing-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div className="auth-card glass-card" style={{ maxWidth: '480px', width: '100%', padding: '40px', border: '1px solid var(--border-active)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src="/varuna-logo.png"
              alt="Varuna"
              style={{ height: '60px', width: 'auto', margin: '0 auto 16px', display: 'block' }}
            />
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              Access Charter Console
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Varuna Maritime Intelligence Portal
            </p>
          </div>

          {loginError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '0', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleQuickLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-field"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                className="input-field"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember session
              </label>
              <Link to="/contact" style={{ color: 'var(--accent-primary)' }}>Need Help?</Link>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
              {loginLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-secondary)', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Register Now
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center' }}>
          Smart India Hackathon 2026 • Ministry of Steel Problem Statement SIH26006<br />
          Built for SAIL, NMDC, RINL, KIOCL and East Coast Maritime Bulk Handlers
        </div>
      </section>
    </div>
  );
}
