import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import CommodityTicker from '../components/dashboard/CommodityTicker';
import CharterForm from '../components/dashboard/CharterForm';
import ResultsPanel from '../components/dashboard/ResultsPanel';
import SavedChartersView from '../components/dashboard/SavedChartersView';
import PastChartersView from '../components/dashboard/PastChartersView';
import AnalyticsView from '../components/dashboard/AnalyticsView';
import { api } from '../services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('new-charter');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const resultsRef = useRef(null);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Automatically execute an initial default optimization for Coking Coal so the user sees immediate results!
  useEffect(() => {
    if (!isAuthenticated) return;
    const runInitial = async () => {
      setOptimizing(true);
      try {
        const initialRes = await api.optimizeCharter({
          cargoType: 'Coking Coal',
          quantity: 75000,
          loadPort: 'Port Hedland, Australia',
          dischargePort: 'Paradip, India',
          laycanDays: 14,
          objective: 'cost',
          riskTolerance: 'Balanced',
        });
        setOptimizationResult(initialRes);
      } catch (e) {
        console.error(e);
      } finally {
        setOptimizing(false);
      }
    };
    runInitial();
  }, [isAuthenticated]);

  const handleOptimize = async (formData) => {
    setOptimizing(true);
    try {
      const res = await api.optimizeCharter(formData);
      setOptimizationResult(res);
      // scroll to results panel after state update
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveCharter = async (charterData) => {
    await api.saveCharter(charterData);
  };

  const handleSavePast = async (fixtureData) => {
    const existing = JSON.parse(localStorage.getItem('varuna_executed_charters') || '[]');
    const newEntry = {
      ...fixtureData,
      id: 'EXEC-' + Math.floor(1000 + Math.random() * 9000),
      completedDate: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    localStorage.setItem('varuna_executed_charters', JSON.stringify([newEntry, ...existing]));
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/varuna-logo.png" alt="Varuna" style={{ height: '48px', marginBottom: '16px', opacity: 0.7 }} />
          <div>Loading Varuna Console...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Center Panel */}
      <main className="dashboard-main">
        {activeTab === 'new-charter' && (
          <div>
            <CharterForm onOptimize={handleOptimize} loading={optimizing} />
            <div ref={resultsRef}>
              <ResultsPanel
                result={optimizationResult}
                onSaveCharter={handleSaveCharter}
                onSavePast={handleSavePast}
              />
            </div>
          </div>
        )}

        {activeTab === 'saved-charters' && (
          <SavedChartersView />
        )}

        {activeTab === 'past-charters' && (
          <PastChartersView />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
      </main>

      {/* Rightmost Commodity & Freight Ticker */}
      <CommodityTicker />
    </div>
  );
}
