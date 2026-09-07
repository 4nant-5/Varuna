import React, { useState } from 'react';
import {
  Ship,
  Calendar,
  Anchor,
  Compass,
  Sliders,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export default function CharterForm({ onOptimize, loading }) {
  const [formData, setFormData] = useState({
    cargoType: 'Coking Coal',
    quantity: 75000,
    loadPort: 'Port Hedland, Australia',
    dischargePort: 'Paradip, India',
    laycanStartDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    laycanEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    objective: 'cost', // cost, certainty, carbon, balanced
    riskTolerance: 50, // 0 - 100
  });

  const cargoOptions = [
    { label: 'Coking Coal (Met Coal)', value: 'Coking Coal', defaultQty: 75000 },
    { label: 'Iron Ore Fines (62% Fe)', value: 'Iron Ore Fines', defaultQty: 160000 },
    { label: 'Thermal Coal (Steam Coal)', value: 'Thermal Coal', defaultQty: 55000 },
    { label: 'Iron Ore Pellets', value: 'Iron Ore Pellets', defaultQty: 150000 },
    { label: 'Direct Reduced Iron (DRI) / Scrap', value: 'Scrap Metal', defaultQty: 45000 },
    { label: 'Limestone / Flux Dolomite', value: 'Limestone', defaultQty: 60000 },
  ];

  const loadPorts = [
    { name: 'Port Hedland, Australia', region: 'Oceania', dist: '3,450 NM' },
    { name: 'Hay Point, Australia', region: 'Oceania', dist: '4,680 NM' },
    { name: 'Gladstone, Australia', region: 'Oceania', dist: '4,720 NM' },
    { name: 'Newcastle, Australia', region: 'Oceania', dist: '5,120 NM' },
    { name: 'Tanjung Bara, Indonesia', region: 'SE Asia', dist: '2,100 NM' },
    { name: 'Muara Pantai, Indonesia', region: 'SE Asia', dist: '2,350 NM' },
    { name: 'Richards Bay, South Africa', region: 'Africa', dist: '4,400 NM' },
    { name: 'Saldanha Bay, South Africa', region: 'Africa', dist: '5,300 NM' },
    { name: 'Tubarao, Brazil', region: 'S. America', dist: '8,900 NM' },
    { name: 'Ponta da Madeira, Brazil', region: 'S. America', dist: '8,600 NM' },
  ];

  const dischargePorts = [
    { name: 'Paradip, India', note: 'Draft 14.5m • SAIL & Kalinganagar' },
    { name: 'Visakhapatnam, India', note: 'Draft 16.5m • RINL Vizag' },
    { name: 'Haldia, India', note: 'Draft 11.5m • Tidal lock / Durgapur' },
    { name: 'Dhamra, India', note: 'Draft 18.0m • Deepwater Capesize' },
    { name: 'Chennai, India', note: 'Draft 15.0m • Southern Hub' },
  ];

  const handleCargoChange = (e) => {
    const val = e.target.value;
    const found = cargoOptions.find((c) => c.value === val);
    setFormData((prev) => ({
      ...prev,
      cargoType: val,
      quantity: found ? found.defaultQty : prev.quantity,
    }));
  };

  const handleQuantityPreset = (qty) => {
    setFormData((prev) => ({ ...prev, quantity: qty }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Compute laycan days from start and end dates
    const start = new Date(formData.laycanStartDate);
    const end = new Date(formData.laycanEndDate);
    const diffMs = end - start;
    const laycanDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    // Send all fields plus computed laycanDays
    const payload = { ...formData, laycanDays };
    onOptimize(payload);
  };

  return (
    <div className="charter-form-container glass-card" style={{ padding: '32px', marginBottom: '28px', border: '1px solid var(--border-active)' }}>
      {/* Header */}
      <div className="charter-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Compass size={16} /> Craft Procurement Module
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Define Charter Requirement</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Provide core cargo parcel specs to trigger the ML rate forecaster and voyage economic optimizer.
          </p>
        </div>

        <div style={{ padding: '6px 14px', background: 'rgba(255, 61, 0, 0.1)', border: '1px solid var(--border-primary)', borderRadius: '0', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
          ⚡ Fast AI Solver Active
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* 1. Cargo Type */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Cargo Type / Bulk Commodity</span>
            </label>
            <select
              className="input-field"
              value={formData.cargoType}
              onChange={handleCargoChange}
            >
              {cargoOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Parcel Quantity */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Cargo Quantity (Metric Tons)</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleQuantityPreset(55000)}
                  style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-secondary)', borderRadius: '0', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  55k (Supra)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuantityPreset(75000)}
                  style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-secondary)', borderRadius: '0', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  75k (Pana)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuantityPreset(160000)}
                  style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-secondary)', borderRadius: '0', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  160k (Cape)
                </button>
              </div>
            </div>
            <input
              type="number"
              className="input-field"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              min="20000"
              max="250000"
              step="5000"
              required
            />
            {/* Live Vessel Match Preview Badge */}
            {(() => {
              const q = formData.quantity || 75000;
              const vClass = q >= 130000 ? 'Capesize' : q >= 65000 ? 'Panamax' : q >= 45000 ? 'Supramax' : 'Handymax';
              const vImg = q >= 130000 ? '/ships/capesize.jpg' : q >= 65000 ? '/ships/panamax.jpg' : q >= 45000 ? '/ships/supramax.jpg' : '/ships/handymax.jpg';
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', padding: '4px 8px', background: 'rgba(255, 61, 0, 0.08)', borderRadius: '0', border: '1px solid rgba(255, 61, 0, 0.2)' }}>
                  <img src={vImg} alt={vClass} style={{ width: '32px', height: '20px', objectFit: 'cover', borderRadius: '0' }} />
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Auto-Matched Vessel: <strong>{vClass} Class</strong>
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 3. Loading Port */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Anchor size={14} color="var(--accent-primary)" />
              <span>Overseas Loading Port (Origin)</span>
            </label>
            <select
              className="input-field"
              value={formData.loadPort}
              onChange={(e) => setFormData({ ...formData, loadPort: e.target.value })}
            >
              {loadPorts.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} — {p.dist}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Discharge Port */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Anchor size={14} color="var(--success)" />
              <span>East Coast India Discharge Port</span>
            </label>
            <select
              className="input-field"
              value={formData.dischargePort}
              onChange={(e) => setFormData({ ...formData, dischargePort: e.target.value })}
            >
              {dischargePorts.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.note})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Laycan Start Date */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--accent-primary)" />
              <span>Laycan Window Start Date</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={formData.laycanStartDate}
              onChange={(e) => setFormData({ ...formData, laycanStartDate: e.target.value })}
              required
            />
          </div>

          {/* 6. Laycan End Date */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--accent-primary)" />
              <span>Laycan Cancelling Date</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={formData.laycanEndDate}
              onChange={(e) => setFormData({ ...formData, laycanEndDate: e.target.value })}
              required
            />
          </div>

          {/* Optimization Objective Selector (Full Width) */}
          <div className="full-width" style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Optimization Objective Preference
            </label>
            <div className="objective-grid">
              {[
                { id: 'cost', title: 'Minimize Total Landed Cost', desc: 'Prioritizes lowest $/ton freight & bunker arbitrage' },
                { id: 'certainty', title: 'Maximize Laycan Certainty', desc: 'Avoids port congestion & high demurrage risks' },
                { id: 'carbon', title: 'Eco-Steaming & Low Emissions', desc: 'Minimizes CII rating impact & bunker burn' },
                { id: 'balanced', title: 'Balanced AI Frontier', desc: 'Optimal Pareto trade-off between price & schedule' },
              ].map((obj) => (
                <div
                  key={obj.id}
                  className={`objective-option ${formData.objective === obj.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, objective: obj.id })}
                >
                  <div style={{ width: '14px', height: '14px', borderRadius: '0', border: '2px solid var(--accent-primary)', background: formData.objective === obj.id ? 'var(--accent-primary)' : 'transparent', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{obj.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{obj.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Tolerance Slider (Full Width) */}
          <div className="full-width" style={{ marginTop: '12px', padding: '16px', background: 'rgba(15, 15, 15, 0.4)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Market Volatility Risk Tolerance
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {formData.riskTolerance < 35 ? 'Conservative (Hedge Heavily)' : formData.riskTolerance < 70 ? 'Balanced (Opportunistic Spot/TC)' : 'Aggressive (Ride Spot Dip)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.riskTolerance}
              onChange={(e) => setFormData({ ...formData, riskTolerance: parseInt(e.target.value) })}
              className="risk-slider"
            />
            <div className="risk-labels">
              <span>Low Risk (Prefer COA/Time Charter)</span>
              <span>Balanced</span>
              <span>High Flexibility (Spot Voyages)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '0', animation: 'spin 0.8s linear infinite' }}></div>
                <span>Solving Optimization Model...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Calculate Best Charter Strategy</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
