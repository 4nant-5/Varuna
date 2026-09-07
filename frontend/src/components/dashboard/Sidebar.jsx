import React from 'react';
import {
  Ship,
  Compass,
  BookmarkCheck,
  History,
  TrendingUp,
  Anchor,
  HelpCircle,
  FileText,
  Sliders,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const ports = [
    { name: 'Paradip', draft: '14.5m', status: 'Normal' },
    { name: 'Vizag', draft: '16.5m', status: 'Optimal' },
    { name: 'Haldia', draft: '11.5m', status: 'Tidal' },
    { name: 'Dhamra', draft: '18.0m', status: 'Optimal' },
  ];

  return (
    <aside className="dashboard-sidebar">
      {/* Platform Title */}
      <div style={{ padding: '0 20px 18px', borderBottom: '1px solid var(--border-secondary)', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '4px' }}>
          Console Navigation
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          East Coast Bulk Chartering
        </div>
      </div>

      {/* Main Actions */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Operations</div>
        <button
          className={`sidebar-item ${activeTab === 'new-charter' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-charter')}
        >
          <Compass className="sidebar-icon" size={18} />
          <span>Craft Procurement</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'saved-charters' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved-charters')}
        >
          <BookmarkCheck className="sidebar-icon" size={18} />
          <span>Saved Charters</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'past-charters' ? 'active' : ''}`}
          onClick={() => setActiveTab('past-charters')}
        >
          <History className="sidebar-icon" size={18} />
          <span>Past Executions</span>
        </button>

        <button
          className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp className="sidebar-icon" size={18} />
          <span>Market & Freight Trends</span>
        </button>
      </div>

      {/* Indian East Coast Port Status */}
      <div className="sidebar-section" style={{ marginTop: '24px' }}>
        <div className="sidebar-section-title">East Coast Berth Drafts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 8px' }}>
          {ports.map((p) => (
            <div
              key={p.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '0',
                border: '1px solid var(--border-secondary)',
                fontSize: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Max Draft: {p.draft}</div>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '0',
                  background: p.status === 'Optimal' ? 'rgba(34,197,94,0.15)' : p.status === 'Tidal' ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)',
                  color: p.status === 'Optimal' ? 'var(--success)' : p.status === 'Tidal' ? 'var(--warning)' : 'var(--accent-primary)',
                }}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Spec Badge */}
      <div style={{ margin: '24px 16px 0', padding: '12px', background: 'rgba(255, 61, 0, 0.05)', borderRadius: '0', border: '1px solid var(--border-primary)', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '4px' }}>
          <Anchor size={14} /> SIH26006 Engine
        </div>
        <div>Model: XGBoost v2.4 + Voyage Econ</div>
        <div style={{ marginTop: '4px', color: 'var(--text-tertiary)' }}>Last Trained: Sep 2026</div>
      </div>
    </aside>
  );
}
