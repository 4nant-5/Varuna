import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anchor, Ship, User, LogOut, BarChart3, BookmarkCheck, History, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [isSolid, setIsSolid] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsSolid(true);
      } else {
        setIsSolid(false);
      }
    };

    if (isLanding) {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setIsSolid(true);
    }
  }, [isLanding]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${isSolid || !isLanding ? 'solid' : 'transparent'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Ship size={20} color="#0A0A0A" />
          </div>
          <span>Freight<span style={{ color: 'var(--accent-primary)' }}>Voyager</span></span>
        </Link>
        <span style={{
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          background: 'rgba(255, 61, 0, 0.12)',
          border: '1px solid rgba(255, 61, 0, 0.25)',
          borderRadius: '0',
          color: 'var(--accent-primary)',
          fontWeight: 600,
          display: 'none',
        }} className="desktop-badge">
          SIH26006 • Ministry of Steel
        </span>
      </div>

      <ul className="navbar-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
            About Project
          </Link>
        </li>
        <li>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
            Contact
          </Link>
        </li>
        <li>
          <Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''}>
            FAQs
          </Link>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Charter Console
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={15} />
              <span>Console</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '0', border: '1px solid var(--border-secondary)' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '0', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0A', fontWeight: 700, fontSize: '11px' }}>
                {user?.name?.[0] || 'U'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Log Out" style={{ padding: '6px 8px' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Open Console
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
