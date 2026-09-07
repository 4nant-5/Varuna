import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Award, Cpu, Anchor, ArrowRight, BarChart3, Database } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="public-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 24px 60px' }}>
      <div className="page-header">
        <div className="hero-badge">Freight Optimization Engine</div>
        <h1>About FreightVoyager</h1>
        <p>
          Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from Overseas to East Coast of India.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0', background: 'rgba(255, 61, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Target size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>The Ministry of Steel Challenge</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
            India’s domestic steel sector requires massive overseas imports of raw materials—primarily metallurgical coking coal from Queensland/New South Wales (Australia) and high-grade iron ore pellets/fines from Brazil and South Africa. Freight rate volatility directly swings raw material landed costs by up to $15–$25 per metric ton.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '0', background: 'rgba(255, 61, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>AI/ML Driven Solution</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
            FreightVoyager delivers a multi-variable machine learning engine (XGBoost regression with ensemble feature selection) capturing Baltic Dry Index fluctuations, Singapore bunker oil futures, geopolitical routing risks, and port congestion factors to accurately predict forward chartering rates.
          </p>
        </div>
      </div>

      {/* Strategic Value Pillars */}
      <div className="glass-card" style={{ padding: '36px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>
          Why East Coast Ports Matter for Indian Steel
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--accent-primary)', fontSize: '15px', marginBottom: '6px' }}>Paradip Port</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Primary gateway for SAIL Rourkela and Kalinganagar steel clusters. High-capacity mechanized coal unloaders.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-primary)', fontSize: '15px', marginBottom: '6px' }}>Visakhapatnam</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Deepwater berths catering directly to Rashtriya Ispat Nigam Ltd (RINL / Vizag Steel Plant) with up to 16.5m draft.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-primary)', fontSize: '15px', marginBottom: '6px' }}>Haldia Dock Complex</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Critical feeder for Durgapur & Burnpur steel plants; requires careful Supramax / Ultramax tide-locked draft management.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-primary)', fontSize: '15px', marginBottom: '6px' }}>Dhamra Port</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Deepwater Capesize berth (18.0m draft) capable of handling fully laden Capesize bulk carriers without lighterage.
            </p>
          </div>
        </div>
      </div>

      {/* System Methodology Banner */}
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.05))', border: '1px solid var(--border-active)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Ready to optimize your procurement pipeline?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px' }}>
          Test the live optimization model, enter your parcel volume, and view real-time voyage economics.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>Open Charter Console</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
