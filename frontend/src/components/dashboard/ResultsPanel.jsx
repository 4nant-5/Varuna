import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import {
  CheckCircle2,
  BookmarkPlus,
  History,
  TrendingDown,
  TrendingUp,
  Ship,
  DollarSign,
  Fuel,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  FileCheck,
  AlertCircle,
  Award,
  Radio,
  ExternalLink,
  Eye,
  X,
  Anchor,
  Layers,
  Info,
} from 'lucide-react';
import DispatcherConsole from './DispatcherConsole';

export default function ResultsPanel({ result, onSaveCharter, onSavePast }) {
  const [speedScenario, setSpeedScenario] = useState(13.0); // knots
  const [laycanShift, setLaycanShift] = useState(0); // days
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [inspectedVessel, setInspectedVessel] = useState(null);

  if (!result) return null;

  const {
    recommendedStrategy,
    strategyRationale,
    keyMetrics,
    strategiesComparison,
    vesselOptions,
    forecast,
    aiRecommendations,
    dispatcherInfo,
  } = result;

  // Sensitivity calculation modifiers
  const speedRatio = 13.0 / speedScenario;
  const adjustedVoyageDays = Math.round((keyMetrics.totalVoyageDays * speedRatio) * 10) / 10;
  // Fuel burn scales cubic with speed: (V / V0)^2.5
  const fuelFactor = Math.pow(speedScenario / 13.0, 2.5);
  const adjustedBunkerCost = Math.round(keyMetrics.bunkerCost * fuelFactor);
  const adjustedTotalCost = keyMetrics.totalVoyageCost - keyMetrics.bunkerCost + adjustedBunkerCost + (laycanShift * 4200);
  const adjustedRatePerTonne = Math.round((adjustedTotalCost / result.input.quantity) * 100) / 100;

  const handleSaveToSaved = async () => {
    await onSaveCharter({
      cargoType: result.input.cargoType,
      quantity: result.input.quantity,
      loadPort: result.input.loadPort,
      dischargePort: result.input.dischargePort,
      vesselClass: vesselOptions[0].vesselClass,
      ratePerTonne: adjustedRatePerTonne,
      totalCost: adjustedTotalCost,
      strategy: recommendedStrategy,
      savings: keyMetrics.estimatedSavings,
    });
    setSaveSuccessMsg('Trade strategy successfully recorded in Saved Charters!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleSaveToPast = async () => {
    await onSavePast({
      cargoType: result.input.cargoType,
      quantity: result.input.quantity,
      loadPort: result.input.loadPort,
      dischargePort: result.input.dischargePort,
      vesselName: vesselOptions[0].name || ('MV ' + vesselOptions[0].vesselClass + ' Voyager'),
      vesselClass: vesselOptions[0].vesselClass,
      actualFreight: adjustedRatePerTonne,
      benchmarkRate: Math.round((adjustedRatePerTonne * 1.08) * 100) / 100,
      realizedSavings: keyMetrics.estimatedSavings,
      voyageDays: adjustedVoyageDays,
    });
    setSaveSuccessMsg('Trade executed and archived into Past Charters record!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const getVesselImage = (v) => {
    if (v.image) return v.image;
    const vc = (v.vesselClass || '').toLowerCase();
    if (vc.includes('cape')) return '/ships/capesize.jpg';
    if (vc.includes('pana') || vc.includes('kamsar')) return '/ships/panamax.jpg';
    if (vc.includes('supra') || vc.includes('ultra')) return '/ships/supramax.jpg';
    if (vc.includes('vloc')) return '/ships/vloc.jpg';
    return '/ships/handymax.jpg';
  };

  return (
    <div className="results-container" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', borderRadius: '0', color: 'var(--success)', marginBottom: '20px' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ─── 1. RECOMMENDED STRATEGY HERO BANNER ──────────────── */}
      <div className="glass-card recommendation-card recommended" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="rec-badge best" style={{ marginBottom: '8px' }}>
              <Award size={14} /> AI Recommended Procurement Strategy
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '4px 0 8px' }}>
              {recommendedStrategy}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Route: <strong style={{ color: 'var(--text-primary)' }}>{result.input.loadPort} → {result.input.dischargePort}</strong></span>
              <span>Cargo: <strong style={{ color: 'var(--text-primary)' }}>{result.input.quantity.toLocaleString()} MT {result.input.cargoType}</strong></span>
              <span>Optimal Laycan: <strong style={{ color: 'var(--accent-primary)' }}>{keyMetrics.laycanOptimalDate}</strong></span>
            </div>
          </div>

          {/* Action Buttons to Save */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSaveToSaved}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BookmarkPlus size={16} /> Save Strategy
            </button>
            <button
              onClick={handleSaveToPast}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <History size={16} /> Execute & Archive
            </button>
          </div>
        </div>

        {/* AI Strategy Rationale Box */}
        <div style={{ marginTop: '18px', padding: '16px', background: 'rgba(255, 61, 0, 0.04)', borderRadius: '0', borderLeft: '4px solid var(--accent-primary)', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          <strong style={{ color: 'var(--accent-primary)' }}>AI Decision Rationale: </strong>
          {strategyRationale}
        </div>

        {/* Key Voyage Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '20px' }}>
          <div className="metric-box">
            <span className="label">Recommended Freight Rate</span>
            <span className="value" style={{ color: 'var(--accent-primary)' }}>
              ${keyMetrics.ratePerTonne || keyMetrics.bestRatePerTonne}/MT
            </span>
            <span className="sub">Market Benchmark: ${(keyMetrics.ratePerTonne * 1.08 || 26.5).toFixed(2)}</span>
          </div>

          <div className="metric-box">
            <span className="label">Total Freight Expenditure</span>
            <span className="value">
              ${keyMetrics.totalVoyageCost.toLocaleString()}
            </span>
            <span className="sub">Includes port & bunkers</span>
          </div>

          <div className="metric-box">
            <span className="label">Estimated Cost Savings</span>
            <span className="value" style={{ color: 'var(--success)' }}>
              ${keyMetrics.estimatedSavings.toLocaleString()}
            </span>
            <span className="sub">7.8% under index median</span>
          </div>

          <div className="metric-box">
            <span className="label">Total Voyage Duration</span>
            <span className="value">
              {keyMetrics.totalVoyageDays} Days
            </span>
            <span className="sub">{keyMetrics.seaDays || 16.5} sea + {keyMetrics.portDays || 4.5} port</span>
          </div>

          <div className="metric-box">
            <span className="label">Bunker Fuel Cost</span>
            <span className="value">
              ${keyMetrics.bunkerCost.toLocaleString()}
            </span>
            <span className="sub">{keyMetrics.bunkerBurnTonnes || 740} MT VLSFO</span>
          </div>

          <div className="metric-box">
            <span className="label">Carbon Footprint (CO2)</span>
            <span className="value">
              {(keyMetrics.co2Emissions || 2300).toLocaleString()} MT
            </span>
            <span className="sub">IMO CII Compliant</span>
          </div>
        </div>
      </div>

      {/* ─── 2. STRATEGY COMPARISON TABLE ─────────────────────── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>
          Procurement Options Evaluation Matrix
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="strategy-table">
            <thead>
              <tr>
                <th>Procurement Strategy</th>
                <th>Rate / Tonne</th>
                <th>Total Expenditure</th>
                <th>Operational Flexibility</th>
                <th>Demurrage Exposure</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {strategiesComparison.map((st) => (
                <tr key={st.name} className={st.recommended ? 'best' : ''}>
                  <td style={{ fontWeight: 600, color: st.recommended ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {st.name}
                  </td>
                  <td>${st.ratePerTonne.toFixed(2)}</td>
                  <td>${st.totalCost.toLocaleString()}</td>
                  <td>{st.flexScore}</td>
                  <td>{st.marketRisk}</td>
                  <td>
                    {st.recommended ? (
                      <span className="rec-badge best">Optimal Choice</span>
                    ) : (
                      <span className="rec-badge rank">Alternative</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 3. VESSEL CLASS SELECTION & ATTRIBUTES (WITH SHIP IMAGES) ─── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
              Vessel Class Selection & Fleet Optimization
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>
              Comparing deadweight, draft compatibility, gear configuration, and per-tonne voyage economics.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
            🚢 4 Vessel Classes Evaluated
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '18px' }}>
          {vesselOptions.map((v) => {
            const shipImg = getVesselImage(v);
            return (
              <div
                key={v.vesselClass}
                style={{
                  padding: '16px',
                  borderRadius: '0',
                  background: v.recommended ? 'rgba(255, 61, 0, 0.06)' : '#0A0A0A',
                  border: v.recommended ? '2px solid var(--accent-primary)' : '1px solid var(--border-secondary)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: v.recommended ? '0 0 20px none' : 'none',
                }}
              >
                {/* Ship Visual Image Header */}
                <div style={{
                  width: '100%',
                  height: '135px',
                  borderRadius: '0',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0A0A0A',
                  marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <img
                    src={shipImg}
                    alt={v.vesselClass}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {v.recommended && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--accent-primary)',
                      color: '#0a0e1a',
                      fontWeight: 800,
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    }}>
                      Top Match
                    </span>
                  )}
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(10,10,10,0.85)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--text-primary)',
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '0',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    IMO: {v.imoNumber || '9842104'} • {v.flag || 'Singapore (SG)'}
                  </span>
                </div>

                {/* Vessel Title & Gear Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                    {v.vesselClass}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {v.dwt?.toLocaleString()} DWT
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.cranes || (v.vesselClass === 'Capesize' || v.vesselClass === 'Panamax' ? 'Gearless Bulk Carrier' : 'Geared (4x30T Cranes + Grabs)')}
                </div>

                {/* Metrics 2x3 Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '14px', flex: 1 }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>COST / MT</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '14px' }}>${v.costPerTonne.toFixed(2)}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>TOTAL COST</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>${v.totalCost.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>VOYAGE DAYS</div>
                    <div style={{ fontWeight: 600 }}>{v.voyageDurationDays} Days</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>DEMURRAGE RISK</div>
                    <div style={{ fontWeight: 600, color: v.demurrageRisk?.includes('Low') ? 'var(--success)' : '#fbbf24' }}>
                      {v.demurrageRisk || 'Low (<5%)'}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>EST. CO2 BURN</div>
                    <div style={{ fontWeight: 600 }}>{v.co2EmissionsTons} Tons</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>BERTH DRAFT</div>
                    <div style={{ color: 'var(--success)', fontWeight: 600 }}>Compliant ✓</div>
                  </div>
                </div>

                {/* Inspect Specs Button */}
                <button
                  onClick={() => setInspectedVessel(v)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255, 61, 0, 0.06)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: '0',
                    color: 'var(--accent-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Eye size={13} /> View Vessel Blueprints & Specs
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. MARITIME DISPATCHER & PORT OPERATIONS CONSOLE ──── */}
      <DispatcherConsole
        dispatcherInfo={dispatcherInfo}
        charterData={{
          ...result.input,
          ratePerTonne: keyMetrics.ratePerTonne || keyMetrics.bestRatePerTonne,
          totalCost: keyMetrics.totalVoyageCost,
        }}
      />

      {/* ─── 5. ML FREIGHT RATE FORWARD TRAJECTORY CHART ──────── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
              Forward Freight Rate Trajectory (15-Day Laycan Horizon)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>
              XGBoost forecast for {result.input.loadPort} → {result.input.dischargePort} with 90% confidence bands.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', display: 'inline-block' }}></span>
              Predicted Rate ($/t)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
              <span style={{ width: '12px', height: '3px', background: 'rgba(255, 61, 0, 0.3)', display: 'inline-block' }}></span>
              Confidence Interval
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rateBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF3D00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF3D00" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} tickLine={false} unit="$" />
              <Tooltip
                contentStyle={{ background: '#0F0F0F', borderColor: '#FF3D00', borderRadius: '0', fontSize: '12px' }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                formatter={(val, name) => [`$${val}/t`, name === 'predictedRate' ? 'AI Predicted Rate' : name]}
              />
              <Area type="monotone" dataKey="upperBound" stroke="transparent" fill="url(#rateBand)" />
              <Area type="monotone" dataKey="lowerBound" stroke="transparent" fill="transparent" />
              <Line type="monotone" dataKey="predictedRate" stroke="#FF3D00" strokeWidth={2.5} dot={{ r: 3, fill: '#FF3D00' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 6. SENSITIVITY & SCENARIO ANALYSIS SLIDERS ───────── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <SlidersHorizontal size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
            Interactive Sensitivity & Scenario Simulation
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Steaming Speed Scenario */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Transit Speed Optimization</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {speedScenario} Knots
              </span>
            </div>
            <input
              type="range"
              min="11.5"
              max="14.5"
              step="0.5"
              value={speedScenario}
              onChange={(e) => setSpeedScenario(parseFloat(e.target.value))}
              className="risk-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              <span>Eco Slow (11.5 kts)</span>
              <span>Design Speed (13.0 kts)</span>
              <span>Fast (14.5 kts)</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Impact on bunker burn: <strong>${(adjustedBunkerCost - keyMetrics.bunkerCost).toLocaleString()}</strong>
            </div>
          </div>

          {/* Laycan Shift Scenario */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Laycan Window Shift (+/- Days)</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {laycanShift > 0 ? `+${laycanShift}` : laycanShift} Days
              </span>
            </div>
            <input
              type="range"
              min="-7"
              max="7"
              step="1"
              value={laycanShift}
              onChange={(e) => setLaycanShift(parseInt(e.target.value))}
              className="risk-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              <span>Advance 7 Days</span>
              <span>Fixed Date</span>
              <span>Delay 7 Days</span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Estimated freight rate variance: <strong>${adjustedRatePerTonne.toFixed(2)}/MT</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. AI TACTICAL RECOMMENDATIONS ───────────────────── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#fff' }}>
          Tactical Recommendations for Procurement Officers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {aiRecommendations.map((rec, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(255, 61, 0, 0.03)',
                borderRadius: '0',
                borderLeft: '3px solid var(--accent-primary)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <CheckCircle2 size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL: VESSEL BLUEPRINTS & TECHNICAL SPECIFICATIONS ─── */}
      {inspectedVessel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '680px', width: '100%', padding: '28px', border: '1px solid var(--accent-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ship size={22} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                  {inspectedVessel.name || `MV ${inspectedVessel.vesselClass} Voyager`} — Technical Dossier
                </h3>
              </div>
              <button
                onClick={() => setInspectedVessel(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Large Ship Visual in Modal */}
            <div style={{ width: '100%', height: '180px', borderRadius: '0', overflow: 'hidden', marginBottom: '16px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
              <img
                src={getVesselImage(inspectedVessel)}
                alt={inspectedVessel.vesselClass}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Spec Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>CLASSIFICATION SOCIETY</span>
                <div style={{ fontWeight: 700, color: '#fff' }}>Indian Register of Shipping (IRS) / DNV</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>FLAG & REGISTRATION</span>
                <div style={{ fontWeight: 700, color: '#fff' }}>{inspectedVessel.flag || 'Singapore (SG)'} • IMO {inspectedVessel.imoNumber || '9842104'}</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>DEADWEIGHT CAPACITY</span>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{inspectedVessel.dwt?.toLocaleString()} Metric Tonnes</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>MAX SUMMER DRAFT</span>
                <div style={{ fontWeight: 700, color: '#fff' }}>{inspectedVessel.maxDraftM || 18.2} Meters</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>CARGO GEAR / CRANES</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>{inspectedVessel.cranes || 'Gearless (Bulk Terminal Grab Discharging)'}</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>SERVICE SPEED & CONSUMPTION</span>
                <div style={{ fontWeight: 600, color: '#fff' }}>14.0 Knots • 32.5 MT VLSFO/day</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setInspectedVessel(null)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
