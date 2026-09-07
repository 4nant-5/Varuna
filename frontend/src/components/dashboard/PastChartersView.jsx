import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, CheckCircle2, Award, Calendar, Ship, UserCheck } from 'lucide-react';

export default function PastChartersView() {
  const [pastCharters, setPastCharters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPast = async () => {
      try {
        const data = await api.getPastCharters();
        const localExec = localStorage.getItem('fv_executed_charters');
        if (localExec) {
          const parsed = JSON.parse(localExec);
          setPastCharters([...parsed, ...data]);
        } else {
          setPastCharters(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPast();
  }, []);

  const totalSaved = pastCharters.reduce((acc, curr) => acc + (curr.realizedSavings || 0), 0);

  const getVesselImg = (vc) => {
    const s = (vc || '').toLowerCase();
    if (s.includes('cape')) return '/ships/capesize.jpg';
    if (s.includes('pana') || s.includes('kamsar')) return '/ships/panamax.jpg';
    if (s.includes('supra') || s.includes('ultra')) return '/ships/supramax.jpg';
    if (s.includes('vloc')) return '/ships/vloc.jpg';
    return '/ships/handymax.jpg';
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            <History size={16} /> Historical Audit Trail
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Past Executed Charters</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Historical record of completed maritime bulk charters, verified dispatcher clearances, and realized cost savings.
          </p>
        </div>

        {/* Realized Savings KPI Banner */}
        <div style={{ padding: '12px 20px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid var(--success)', borderRadius: '0', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Cumulative Savings</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            +${totalSaved.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="charters-list">
        {pastCharters.map((item) => (
          <div key={item.id} className="charter-card glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Ship Thumbnail */}
              <div style={{ width: '80px', height: '52px', borderRadius: '0', overflow: 'hidden', background: '#020617', border: '1px solid var(--border-secondary)', flexShrink: 0 }}>
                <img src={getVesselImg(item.vesselClass)} alt={item.vesselClass} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', padding: '2px 8px', background: 'rgba(56,189,248,0.1)', borderRadius: '0' }}>
                    {item.id}
                  </span>
                  <span className="charter-status completed">Discharged & Settled</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {item.vesselName || 'MV Bulk Pioneer'} ({item.vesselClass})
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                  {item.quantity?.toLocaleString()} MT • {item.cargoType}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{item.loadPort} → <strong style={{ color: 'var(--accent-primary)' }}>{item.dischargePort}</strong></span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={12} color="var(--accent-primary)" /> Dispatcher: {item.dispatcherName || 'Capt. Rajesh Nair'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ACTUAL VS BENCHMARK</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ${item.actualFreight?.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>${item.benchmarkRate?.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                  Saved +${item.realizedSavings?.toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-secondary)', paddingLeft: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>VOYAGE TIME</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.voyageDays} Days
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {item.completedDate || 'Aug 2026'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
