import React, { useState } from 'react';
import {
  Radio,
  Send,
  FileText,
  Anchor,
  Navigation,
  UserCheck,
  Compass,
  Printer,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PhoneCall,
  Mail,
  AlertTriangle,
  Waves,
  Building2,
} from 'lucide-react';

export default function DispatcherConsole({ dispatcherInfo, charterData }) {
  const [orderSent, setOrderSent] = useState(false);
  const [norAcknowledged, setNorAcknowledged] = useState(false);
  const [showFixtureNote, setShowFixtureNote] = useState(false);

  // Default dispatcher data if not passed or partially passed
  const dispatcher = dispatcherInfo || {
    dispatcher_name: 'Capt. Rajesh Nair',
    title: 'Senior Marine Dispatcher & Chartering Controller',
    desk: 'East Coast Maritime Dispatch Desk (Paradip & Dhamra Sector)',
    organization: 'Ministry of Steel Logistics Support Unit / SAIL',
    contact_phone: '+91 (06722) 222-108 / +91 94370 88210',
    vhf_channel: 'VHF Ch 16 (Hailing) / Ch 68 (Cargo Operations) / Ch 12 (VTS)',
    call_sign: 'VT9841',
    email: 'dispatch.paradip@steel-charter.gov.in',
    terminal: 'Paradip Port Authority - Iron Ore Berth 2 (IOB-2)',
    pilot_station: "Paradip Fairway Buoy (20° 15.2' N, 086° 44.5' E)",
    berth_draft_limit: '18.5 Meters (High Tide)',
    discharge_rate_guarantee: '35,000 MT / WWD SHINC',
    demurrage_rate_day: 22000,
    dispatch_rate_day: 11000,
  };

  const handleSendOrders = () => {
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 5000);
  };

  const handleAcknowledgeNor = () => {
    setNorAcknowledged(true);
    setTimeout(() => setNorAcknowledged(false), 5000);
  };

  return (
    <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', border: '1px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Radar Watermark */}
      <div style={{ position: 'absolute', right: '-40px', top: '-40px', opacity: 0.04, pointerEvents: 'none' }}>
        <Compass size={320} color="#FF3D00" />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Radio size={16} className="animate-pulse" /> Port Dispatcher & Marine Operations Console
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fff' }}>
            Port Dispatch & Stevedoring Clearance Desk
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Authorized dispatch controllers coordinating vessel pilotage, berth allocation, NOR tenders, and demurrage economics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid var(--success)', padding: '6px 14px', borderRadius: '0', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '0', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 8px var(--success)' }}></span>
          VTS Clearance Desk Active
        </div>
      </div>

      {/* Feedback Banners */}
      {orderSent && (
        <div style={{ padding: '12px 18px', background: 'rgba(255, 61, 0, 0.15)', border: '1px solid var(--accent-primary)', borderRadius: '0', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          Voyage Charter Party Orders transmitted via Inmarsat-C satellite link to Master & Dispatch Desk. Sat-ID: INM-C-88492.
        </div>
      )}

      {norAcknowledged && (
        <div style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', borderRadius: '0', color: 'var(--success)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          Notice of Readiness (NOR) formally logged. Free Pratique validated by Port Health Authority. Laytime clock initiated.
        </div>
      )}

      {/* 2-Column Dispatch Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '22px' }}>
        {/* Left: Dispatch Officer & Comm Links */}
        <div style={{ padding: '20px', background: 'rgba(10, 10, 10, 0.7)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0', background: 'linear-gradient(135deg, #0284c7, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '18px', border: '2px solid var(--accent-primary)' }}>
              RN
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{dispatcher.dispatcher_name}</span>
                <ShieldCheck size={16} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>{dispatcher.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{dispatcher.organization}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={14} color="var(--accent-primary)" /> VHF Working Channels:
              </span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{dispatcher.vhf_channel}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={14} color="var(--accent-primary)" /> Call Sign:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>{dispatcher.call_sign}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneCall size={14} color="var(--accent-primary)" /> Hotline / Mobile:
              </span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{dispatcher.contact_phone}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--accent-primary)" /> Dispatch Email:
              </span>
              <span style={{ fontWeight: 600, color: '#93c5fd' }}>{dispatcher.email}</span>
            </div>
          </div>
        </div>

        {/* Right: Berth Allocation, NOR & Despatch Economics */}
        <div style={{ padding: '20px', background: 'rgba(10, 10, 10, 0.7)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Anchor size={16} color="var(--accent-primary)" /> Operational Berth & Laytime Terms
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', fontSize: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>DESIGNATED TERMINAL</div>
              <div style={{ fontWeight: 700, color: '#fff', marginTop: '2px' }}>{dispatcher.terminal}</div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>MAX BERTH DRAFT</div>
              <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>{dispatcher.berth_draft_limit}</div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>DISCHARGE RATE GUARANTEE</div>
              <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>{dispatcher.discharge_rate_guarantee}</div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '0' }}>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>PILOT STATION COORDS</div>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '2px' }}>{dispatcher.pilot_station}</div>
            </div>
          </div>

          {/* Despatch vs Demurrage Strip */}
          <div style={{ padding: '10px 14px', background: 'rgba(255, 61, 0, 0.05)', border: '1px solid rgba(255, 61, 0, 0.2)', borderRadius: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Demurrage Penalty: </span>
              <strong style={{ color: '#f87171' }}>${dispatcher.demurrage_rate_day.toLocaleString()} / day</strong>
            </div>
            <div style={{ height: '14px', width: '1px', background: 'var(--border-secondary)' }}></div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }}>Despatch Incentive: </span>
              <strong style={{ color: 'var(--success)' }}>${dispatcher.dispatch_rate_day.toLocaleString()} / day</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Action Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={handleSendOrders}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 18px' }}
        >
          <Send size={15} /> Transmit Voyage Orders (Sat-C)
        </button>

        <button
          onClick={handleAcknowledgeNor}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 18px' }}
        >
          <CheckCircle2 size={15} /> Acknowledge NOR & Log Free Pratique
        </button>

        <button
          onClick={() => setShowFixtureNote(!showFixtureNote)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 18px' }}
        >
          <FileText size={15} /> {showFixtureNote ? 'Hide Fixture Note' : 'Generate Fixture Note'}
        </button>
      </div>

      {/* Collapsible Fixture Note Preview */}
      {showFixtureNote && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#0a0f1d', borderRadius: '0', border: '1px dashed var(--accent-primary)', fontSize: '12px', fontFamily: 'var(--font-mono)', lineHeight: 1.7, color: '#FAFAFA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>MINISTRY OF STEEL & SAIL — RECAP FIXTURE NOTE</span>
            <button onClick={() => window.print()} style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <Printer size={13} /> Print / Export PDF
            </button>
          </div>
          <div>DATE OF FIXTURE: {new Date().toLocaleDateString()}</div>
          <div>CHARTERERS: STEEL AUTHORITY OF INDIA LTD (SAIL) / MINISTRY OF STEEL</div>
          <div>DISPATCH DESK: {dispatcher.desk} (CONTROLLER: {dispatcher.dispatcher_name.toUpperCase()})</div>
          <div>CARGO: {charterData?.cargoType || 'COKING COAL (BULK)'} — QTY: {charterData?.quantity?.toLocaleString() || '75,000'} MT +/- 10% MOLOO</div>
          <div>DISCHARGE PORT: {dispatcher.terminal}</div>
          <div>DISCHARGE RATE: {dispatcher.discharge_rate_guarantee}</div>
          <div>DEMURRAGE / DESPATCH: USD {dispatcher.demurrage_rate_day.toLocaleString()} / USD {dispatcher.dispatch_rate_day.toLocaleString()} PER DAY PRO RATA</div>
          <div>GOVERNING LAW: INDIAN MARITIME ARBITRATION COUNCIL (IMAC) / NEW DELHI</div>
        </div>
      )}
    </div>
  );
}
