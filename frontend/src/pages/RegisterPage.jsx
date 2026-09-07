import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ship, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('Steel Authority of India Ltd (SAIL)');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, organization, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--accent-gradient)', borderRadius: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Ship size={24} color="#0A0A0A" />
          </div>
          <h1>Officer Registration</h1>
          <p className="auth-subtitle">Join the Maritime Procurement Intelligence Network</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '0', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name & Designation</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S. Mukherjee (DGM Procurement)"
              required
            />
          </div>

          <div className="input-group">
            <label>Government / Corporate Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mukherjee@sail.gov.in"
              required
            />
          </div>

          <div className="input-group">
            <label>Affiliated PSU / Enterprise</label>
            <select
              className="input-field"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            >
              <option value="Steel Authority of India Ltd (SAIL)">Steel Authority of India Ltd (SAIL)</option>
              <option value="Rashtriya Ispat Nigam Ltd (RINL)">Rashtriya Ispat Nigam Ltd (RINL - Vizag)</option>
              <option value="NMDC Limited">NMDC Limited</option>
              <option value="KIOCL Limited">KIOCL Limited</option>
              <option value="Tata Steel">Tata Steel</option>
              <option value="Jindal Steel & Power (JSPL)">Jindal Steel & Power (JSPL)</option>
              <option value="Ministry of Steel Desk">Ministry of Steel Desk</option>
            </select>
          </div>

          <div className="input-group">
            <label>Create Security Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Creating Credentials...' : 'Create Account & Access Console'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Already have an officer account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
