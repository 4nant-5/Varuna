import React, { useState } from 'react';
import { Navigation, Anchor, Compass, Info } from 'lucide-react';

export default function WorldMap() {
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Key shipping routes from overseas origins to East Coast India
  const routes = [
    {
      id: 'aus-east',
      name: 'Australia (Port Hedland) → Paradip',
      cargo: 'Met Coal & Iron Ore',
      distance: '3,450 NM',
      transitTime: '11.0 Days',
      vesselClass: 'Capesize / Panamax',
      origin: { name: 'Port Hedland, AUS', x: 790, y: 350 },
      dest: { name: 'Paradip, IND', x: 675, y: 245 },
      path: 'M 790 350 Q 720 330 675 245',
      color: '#38bdf8',
    },
    {
      id: 'aus-haypoint',
      name: 'Australia (Hay Point) → Visakhapatnam',
      cargo: 'Coking Coal',
      distance: '4,680 NM',
      transitTime: '15.0 Days',
      vesselClass: 'Kamsarmax / Capesize',
      origin: { name: 'Hay Point, AUS', x: 880, y: 360 },
      dest: { name: 'Visakhapatnam, IND', x: 670, y: 260 },
      path: 'M 880 360 Q 770 380 670 260',
      color: '#0ea5e9',
    },
    {
      id: 'indo-tanjung',
      name: 'Indonesia (Tanjung Bara) → Haldia',
      cargo: 'Thermal Coal',
      distance: '2,100 NM',
      transitTime: '6.7 Days',
      vesselClass: 'Supramax / Ultramax',
      origin: { name: 'Tanjung Bara, IDN', x: 770, y: 290 },
      dest: { name: 'Haldia, IND', x: 680, y: 235 },
      path: 'M 770 290 Q 720 280 680 235',
      color: '#06b6d4',
    },
    {
      id: 'safrica-richards',
      name: 'South Africa (Richards Bay) → Visakhapatnam',
      cargo: 'Steam Coal & Anthracite',
      distance: '4,400 NM',
      transitTime: '14.1 Days',
      vesselClass: 'Capesize',
      origin: { name: 'Richards Bay, ZAF', x: 550, y: 380 },
      dest: { name: 'Visakhapatnam, IND', x: 670, y: 260 },
      path: 'M 550 380 Q 590 320 670 260',
      color: '#22c55e',
    },
    {
      id: 'brazil-tubarao',
      name: 'Brazil (Tubarao) → Dhamra / Paradip',
      cargo: 'High-Grade Iron Ore Pellets',
      distance: '8,900 NM',
      transitTime: '28.5 Days',
      vesselClass: 'Capesize / VLOC',
      origin: { name: 'Tubarao, BRA', x: 330, y: 350 },
      dest: { name: 'Dhamra, IND', x: 677, y: 240 },
      path: 'M 330 350 Q 480 440 677 240',
      color: '#f59e0b',
    },
  ];

  const eastCoastPorts = [
    { name: 'Paradip', x: 675, y: 245, draft: '14.5m', berth: 'Mechanized Bulk Berth' },
    { name: 'Visakhapatnam', x: 670, y: 260, draft: '16.5m', berth: 'Inner & Outer Harbours' },
    { name: 'Haldia', x: 680, y: 235, draft: '11.5m', berth: 'Dock-lock Bulk Complex' },
    { name: 'Dhamra', x: 677, y: 240, draft: '18.0m', berth: 'Deepwater Capesize Berth' },
    { name: 'Chennai', x: 665, y: 275, draft: '15.0m', berth: 'Coal Terminal' },
  ];

  return (
    <div className="world-map-container" style={{ position: 'relative', width: '100%', maxWidth: '1150px', margin: '0 auto', background: 'rgba(15, 21, 37, 0.75)', borderRadius: '24px', border: '1px solid var(--border-primary)', padding: '24px', backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Strategic Maritime Procurement Corridors</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Live simulation of bulk cargo trade lanes feeding India's East Coast steel mills (SAIL, RINL, Tata Steel, JSPL)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(selectedRoute?.id === r.id ? null : r)}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: selectedRoute?.id === r.id ? r.color : 'rgba(255,255,255,0.1)',
                background: selectedRoute?.id === r.id ? `${r.color}22` : 'rgba(20,28,47,0.8)',
                color: selectedRoute?.id === r.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, display: 'inline-block', marginRight: '4px' }}></span>
              {r.name.split('→')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2.1 / 1', overflow: 'hidden', borderRadius: '16px', background: '#090d19' }}>
        <svg
          viewBox="0 0 1000 500"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="0.8" />
            </pattern>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="500" fill="url(#grid)" />

          {/* Stylized Continents Simplified Shapes */}
          {/* North America */}
          <path d="M 120 100 Q 180 80 240 120 T 260 210 T 180 220 T 130 160 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
          {/* South America */}
          <path d="M 280 250 Q 350 270 340 370 T 270 430 T 250 330 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
          {/* Europe */}
          <path d="M 460 110 Q 520 90 560 120 T 520 180 T 450 160 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
          {/* Africa */}
          <path d="M 470 190 Q 550 200 560 300 T 540 400 T 480 350 T 440 250 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
          {/* Asia & India */}
          <path d="M 570 100 Q 750 80 830 140 T 780 240 T 700 220 L 670 280 L 640 220 T 570 190 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.2" />
          {/* Australia */}
          <path d="M 760 330 Q 880 310 890 380 T 820 420 T 750 380 Z" fill="#141d33" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />

          {/* Maritime Shipping Corridors */}
          {routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <g key={route.id} onClick={() => setSelectedRoute(isSelected ? null : route)} style={{ cursor: 'pointer' }}>
                {/* Route Glow Path */}
                <path
                  d={route.path}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={isSelected ? 4 : 2}
                  strokeOpacity={isSelected ? 0.9 : 0.4}
                  filter={isSelected ? 'url(#glow)' : 'none'}
                />

                {/* Dashed Animated Path */}
                <path
                  d={route.path}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={isSelected ? 3 : 1.6}
                  strokeDasharray="6 6"
                  strokeOpacity={0.8}
                >
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="4s" repeatCount="indefinite" />
                </path>

                {/* Origin Port Node */}
                <circle cx={route.origin.x} cy={route.origin.y} r="4.5" fill={route.color} stroke="#fff" strokeWidth="1.5" />
                <text x={route.origin.x + 8} y={route.origin.y + 4} fill="#94a3b8" fontSize="10" fontFamily="Inter" fontWeight="500">
                  {route.origin.name}
                </text>
              </g>
            );
          })}

          {/* East Coast of India Destination Hub */}
          <circle cx="673" cy="252" r="14" fill="rgba(56, 189, 248, 0.15)">
            <animate attributeName="r" values="12;20;12" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="673" cy="252" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />

          {/* Indian East Coast Ports */}
          {eastCoastPorts.map((port) => (
            <g key={port.name}>
              <circle cx={port.x} cy={port.y} r="2.5" fill="#38bdf8" />
              <text x={port.x - 6} y={port.y - 6} fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="end">
                {port.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Selected Route Info Card Overlay */}
        {selectedRoute && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(10, 14, 26, 0.92)',
              border: `1px solid ${selectedRoute.color}`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
              borderRadius: '12px',
              padding: '14px 18px',
              maxWidth: '360px',
              backdropFilter: 'blur(16px)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedRoute.name}</span>
              <span style={{ fontSize: '10px', color: selectedRoute.color, fontWeight: 700, textTransform: 'uppercase' }}>Active Corridor</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>CARGO</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedRoute.cargo}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>DISTANCE</div>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedRoute.distance}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>EST. TRANSIT</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedRoute.transitTime}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>TYPICAL TONNAGE</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedRoute.vesselClass}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* East Coast Ports Draft & Capability Footnote */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
        {eastCoastPorts.map((p) => (
          <div key={p.name} style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name} Port</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>Draft: {p.draft}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
