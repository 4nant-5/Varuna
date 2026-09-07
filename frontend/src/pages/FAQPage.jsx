import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'What is the core objective of SIH26006 for the Ministry of Steel?',
      a: 'The objective is to establish an intelligent decision-support system that forecasts dry bulk freight rates and identifies optimal vessel chartering strategies (Spot Voyage, Period Time Charter, or COA) for raw materials—specifically coking coal, thermal coal, and iron ore—imported from overseas mining centers (Australia, Indonesia, South Africa, Brazil) to ports on India\'s East Coast (Paradip, Visakhapatnam, Haldia, Dhamra, Chennai).',
    },
    {
      q: 'How does the AI/ML freight rate forecasting model work?',
      a: 'Varuna utilizes an XGBoost ensemble regression pipeline trained on historical Baltic Dry Indices (BDI, BCI, BPI, BSI), Singapore VLSFO/MGO bunker pricing, macroeconomic commodity benchmarks (Iron Ore 62% Fe, Premium Hard Coking Coal), vessel fleet supply-demand metrics, and seasonal monsoon patterns. It produces forward rate forecasts along with upper and lower statistical confidence bands.',
    },
    {
      q: 'When should a steel mill choose Spot Charter vs. Time Charter vs. COA?',
      a: '• Spot Voyage Charter is recommended during anticipated freight market softening or when securing single parcels with minimal long-term market exposure.\n• Period Time Charter (3–12 months) is recommended when forward freight rates are forecasted to spike or bunker fuel curves are in steep backwardation, locking in lower operating daily hire rates.\n• Contract of Affreightment (COA) is ideal for high regular annual volumes (e.g. 500,000+ tons of coking coal for SAIL/RINL), commanding volume discounts and guaranteed vessel tonnage without vessel operational liability.',
    },
    {
      q: 'How are East Coast of India port draft restrictions accounted for?',
      a: 'The platform integrates real-time berth specifications: Paradip (14.5m draft), Visakhapatnam (16.5m draft), Haldia (11.5m tidal lock), and Dhamra (18.0m deepwater). When a user specifies cargo tonnage, the model automatically cross-checks maximum permissible drafts to prevent costly lighterage, double handling, or grounding penalties.',
    },
    {
      q: 'How is Time Charter Equivalent (TCE) calculated?',
      a: 'TCE ($/day) represents the net economic return of a voyage. The engine calculates: TCE = (Gross Freight Revenue - Bunker Fuel Costs - Port Disbursement Charges - Canal Fees) / Total Voyage Duration (Steaming Days + Port Days). This allows instant comparison between voyage charters and time charter market fixtures.',
    },
    {
      q: 'Can saved charters and sensitivity scenarios be exported or monitored?',
      a: 'Yes. Every generated optimization can be saved directly to "Saved Charters" for tender review or tracked in "Past Charters" to evaluate realized cost savings against benchmark Baltic market rates.',
    },
  ];

  return (
    <div className="public-page" style={{ maxWidth: '880px', margin: '0 auto', padding: '100px 24px 60px' }}>
      <div className="page-header">
        <div className="hero-badge">Knowledge Base</div>
        <h1>Frequently Asked Questions</h1>
        <p>
          Technical and operational guidance on the Varuna charter optimization platform.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="faq-item glass-card"
              style={{
                background: isOpen ? 'rgba(15, 15, 15, 0.9)' : 'rgba(15, 21, 37, 0.65)',
                borderColor: isOpen ? 'var(--border-active)' : 'var(--border-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  color: isOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HelpCircle size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </button>

              {isOpen && (
                <div style={{ padding: '0 24px 20px 54px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Have a question not addressed here?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          Contact our nodal coordination team or consult the interactive charter console directly.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/contact" className="btn btn-secondary btn-sm">Contact Support</Link>
          <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Launch Console</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
