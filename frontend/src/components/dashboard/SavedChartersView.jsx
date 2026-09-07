import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookmarkCheck, Trash2, ArrowRight, Ship, ExternalLink, Radio, UserCheck } from 'lucide-react';

export default function SavedChartersView({ onSelectCharter }) {
  const [charters, setCharters] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCharters = async () => {
    try {
      const data = await api.getSavedCharters();
      setCharters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharters();
  }, []);

  const handleDelete = (id) => {
    const updated = charters.filter((c) => c.id !== id);
    setCharters(updated);
    localStorage.setItem('varuna_saved_charters', JSON.stringify(updated));
  };

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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
          <BookmarkCheck size={16} /> Strategy Portfolio
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Saved Charter Requirements</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
          Formulated trade options ready for tender issuance, port controller clearance, and tender committee approval.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading saved fixtures...</div>
      ) : charters.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <BookmarkCheck size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>No Saved Charters Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Run an optimization in the Craft Procurement tab and click "Save Strategy".
          </p>
        </div>
      ) : (
        <div className="charters-list">
          {charters.map((ch) => (
            <div key={ch.id} className="charter-card glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Ship Thumbnail */}
                <div style={{ width: '80px', height: '52px', borderRadius: '0', overflow: 'hidden', background: '#020617', border: '1px solid var(--border-secondary)', flexShrink: 0 }}>
                  <img src={getVesselImg(ch.vesselClass)} alt={ch.vesselClass} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', padding: '2px 8px', background: 'rgba(56,189,248,0.1)', borderRadius: '0' }}>
                      {ch.id}
                    </span>
                    <span className="charter-status saved">{ch.strategy || 'Spot Voyage Charter'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {ch.vesselClass} • {ch.quantity?.toLocaleString()} MT
                    </span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    {ch.cargoType}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{ch.loadPort} → <strong style={{ color: 'var(--accent-primary)' }}>{ch.dischargePort}</strong></span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} color="var(--accent-primary)" /> Dispatcher: Capt. Rajesh Nair (Paradip Desk)
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>RATE / TONNE</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    ${ch.ratePerTonne?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--success)' }}>
                    Est. Savings: ${ch.savings?.toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDelete(ch.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', padding: '8px' }}
                    title="Delete Saved Trade"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
