import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, Globe, Anchor } from 'lucide-react';

export default function AnalyticsView() {
  const freightTrendsData = [
    { month: 'Jan', bdi: 1520, ausIndiaRate: 14.8, brazilIndiaRate: 20.4 },
    { month: 'Feb', bdi: 1610, ausIndiaRate: 15.2, brazilIndiaRate: 21.0 },
    { month: 'Mar', bdi: 1780, ausIndiaRate: 16.5, brazilIndiaRate: 22.8 },
    { month: 'Apr', bdi: 1950, ausIndiaRate: 17.8, brazilIndiaRate: 24.2 },
    { month: 'May', bdi: 1820, ausIndiaRate: 16.9, brazilIndiaRate: 23.1 },
    { month: 'Jun', bdi: 1710, ausIndiaRate: 15.8, brazilIndiaRate: 21.9 },
    { month: 'Jul', bdi: 1680, ausIndiaRate: 15.4, brazilIndiaRate: 21.5 },
    { month: 'Aug', bdi: 1790, ausIndiaRate: 16.2, brazilIndiaRate: 22.4 },
    { month: 'Sep (Now)', bdi: 1845, ausIndiaRate: 16.6, brazilIndiaRate: 22.9 },
  ];

  const vesselTCComparison = [
    { vessel: 'Capesize (180k)', tceDaily: 28400, fuelBurnDay: 42, carbonTonDay: 130 },
    { vessel: 'Kamsarmax (82k)', tceDaily: 17200, fuelBurnDay: 26, carbonTonDay: 80 },
    { vessel: 'Panamax (75k)', tceDaily: 15800, fuelBurnDay: 24, carbonTonDay: 74 },
    { vessel: 'Ultramax (64k)', tceDaily: 14600, fuelBurnDay: 21, carbonTonDay: 65 },
    { vessel: 'Supramax (58k)', tceDaily: 13400, fuelBurnDay: 19, carbonTonDay: 58 },
  ];

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
          <BarChart3 size={16} /> Market Intelligence
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Freight Indices & Route Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
          Longitudinal Baltic Exchange indices and vessel class operating economics.
        </p>
      </div>

      {/* Chart 1: Rate trends */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          Route Freight Rate Trends ($/Tonne) vs. Baltic Dry Index
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
          Correlating overseas bulk routes to East Coast India against global BDI levels.
        </p>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={freightTrendsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#FF3D00" fontSize={11} unit="$" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#0F0F0F', borderColor: '#FF3D00', borderRadius: '0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="ausIndiaRate" name="Aus → Paradip ($/t)" stroke="#FF3D00" strokeWidth={2.5} />
              <Line yAxisId="left" type="monotone" dataKey="brazilIndiaRate" name="Brazil → Vizag ($/t)" stroke="#CC3000" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="bdi" name="Baltic Dry Index (Pts)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Vessel TCE & Efficiency */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
          Fleet Class Daily TCE Earnings Comparison ($/Day)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
          Current Indian Ocean spot fixtures across dry bulk deadweight classes.
        </p>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vesselTCComparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="vessel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="$" />
              <Tooltip
                contentStyle={{ background: '#0F0F0F', borderColor: '#FF3D00', borderRadius: '0', fontSize: '12px' }}
                formatter={(val) => [`$${val.toLocaleString()}/day`, 'Daily TCE Earnings']}
              />
              <Bar dataKey="tceDaily" fill="#FF3D00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
