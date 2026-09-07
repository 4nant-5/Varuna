import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: 'Steel Authority of India (SAIL)',
    subject: 'Chartering Optimization Inquiry',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="public-page" style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 24px 60px' }}>
      <div className="page-header">
        <div className="hero-badge">Get In Touch</div>
        <h1>Contact the Varuna Team</h1>
        <p>
          Collaborate with the intelligent charter forecasting engineering team or request API integration for your procurement division.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Contact Info */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Procurement Support & Research</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '0', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Ministry of Steel Nodal Desk</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Udyog Bhawan, Rafi Marg, New Delhi, 110011
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '0', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Email Inquiry</div>
                <div style={{ fontSize: '13px', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  sih26006.steel@gov.in
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '0', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Maritime Charter Hotline</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  +91 (011) 2306-2580 (Ext: 4410)
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Associated Steel Undertakings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              SAIL • RINL • NMDC • KIOCL • MSTC Limited
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-card" style={{ padding: '32px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle2 size={54} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Transmission Received</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Thank you. Your inquiry has been routed to the maritime procurement technical desk.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn btn-secondary btn-sm">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Direct Procurement Dispatch</h3>

              <div className="input-group">
                <label>Officer / Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Verma"
                  required
                />
              </div>

              <div className="input-group">
                <label>Official Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@organization.gov.in"
                  required
                />
              </div>

              <div className="input-group">
                <label>Entity / Plant</label>
                <select
                  className="input-field"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                >
                  <option value="SAIL">Steel Authority of India Ltd (SAIL)</option>
                  <option value="RINL">Rashtriya Ispat Nigam Ltd (RINL - Vizag)</option>
                  <option value="NMDC">National Mineral Development Corp (NMDC)</option>
                  <option value="TATA">Tata Steel (Kalinganagar / Jamshedpur)</option>
                  <option value="JSPL">Jindal Steel & Power Ltd (Angul)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Message / Inquiries</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Specify cargo parcel requirements, tender questions, or integration requests..."
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <Send size={16} />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
