import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { Navigation, Map as MapIcon, Anchor, Wind, Droplets, Thermometer, Clock, Activity, Zap } from 'lucide-react';

// Common ports for dropdowns
const PORTS = [
  "Port Hedland, Australia",
  "Hay Point, Australia",
  "Gladstone, Australia",
  "Newcastle, Australia",
  "Tubarao, Brazil",
  "Ponta da Madeira, Brazil",
  "Richards Bay, South Africa",
  "Saldanha Bay, South Africa",
  "Tanjung Bara, Indonesia",
  "Muara Pantai, Indonesia",
  "Paradip, India",
  "Dhamra, India",
  "Haldia, India",
  "Visakhapatnam, India"
];

export default function RouteOptimizationView() {
  const [origin, setOrigin] = useState("Port Hedland, Australia");
  const [destination, setDestination] = useState("Paradip, India");
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-5, 100]); // Default center between Aus and India
  
  useEffect(() => {
    // Initial fetch
    calculateRoute();
  }, []);

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const data = await api.optimizeRoute(origin, destination, 13.5);
      if (data) {
        setRouteData(data);
        
        // Auto-center map if we have waypoints
        if (data.waypoints && data.waypoints.length > 0) {
          const midPoint = data.waypoints[Math.floor(data.waypoints.length / 2)];
          setMapCenter(midPoint);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)' }}>
      
      {/* Left Panel: Controls & ML Predictions */}
      <div style={{ 
        width: '380px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        overflowY: 'auto',
        paddingRight: '10px'
      }}>
        
        {/* Controls */}
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-secondary)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={20} color="var(--accent-primary)" />
            Route Optimizer
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Origin Port</label>
            <select 
              className="input-field" 
              value={origin} 
              onChange={e => setOrigin(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(15,15,15,0.6)', border: '1px solid var(--border-secondary)', color: '#fff', borderRadius: '6px' }}
            >
              {PORTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Destination Port</label>
            <select 
              className="input-field" 
              value={destination} 
              onChange={e => setDestination(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(15,15,15,0.6)', border: '1px solid var(--border-secondary)', color: '#fff', borderRadius: '6px' }}
            >
              {PORTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
            onClick={calculateRoute}
            disabled={loading}
          >
            {loading ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Activity size={18} />}
            {loading ? 'Calculating Mesh...' : 'Optimize Maritime Route'}
          </button>
        </div>

        {/* ML Predictions Panel */}
        {routeData && (
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-secondary)', flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>ML Engine Predictions</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapIcon size={12} /> DISTANCE
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{routeData.distance_nm.toLocaleString()} nm</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> TRANSIT ETA
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{routeData.estimated_sea_days} days</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> EST. FUEL
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{routeData.total_fuel_mt.toLocaleString()} MT</div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={12} /> WEATHER
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: routeData.weather_forecast === 'Clear' ? 'var(--success)' : 'var(--warning)' }}>
                  {routeData.weather_forecast}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ML Confidence Score</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success)' }}>{routeData.confidence_score}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${routeData.confidence_score}%`, height: '100%', background: 'var(--success)', borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '12px', lineHeight: '1.5' }}>
                The Varuna maritime AI model analyzes historic AIS tracks, live ocean currents, and weather buoy data to compute the Pareto-optimal route minimizing CII emissions and bunker burn.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Leaflet Map */}
      <div style={{ 
        flex: 1, 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-secondary)',
        background: '#000',
        position: 'relative'
      }}>
        {/* We add a unique key to MapContainer so it re-centers when route changes */}
        <MapContainer 
          key={`${mapCenter[0]}-${mapCenter[1]}`}
          center={mapCenter} 
          zoom={4} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Dark premium tile layer from CartoDB */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
          
          {routeData && routeData.waypoints && routeData.waypoints.length > 0 && (
            <>
              {/* Animated Route Line */}
              <Polyline 
                positions={routeData.waypoints} 
                pathOptions={{ 
                  color: '#2196F3', 
                  weight: 3, 
                  opacity: 0.8,
                  dashArray: '10, 10',
                  lineCap: 'round',
                  lineJoin: 'round',
                  className: 'animated-route'
                }} 
              />
              
              {/* Origin Marker */}
              <CircleMarker 
                center={routeData.waypoints[0]} 
                radius={8}
                pathOptions={{ color: '#fff', fillColor: '#2196F3', fillOpacity: 1, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <span style={{ fontWeight: 'bold', color: '#000' }}>{routeData.origin}</span>
                </Tooltip>
              </CircleMarker>

              {/* Destination Marker */}
              <CircleMarker 
                center={routeData.waypoints[routeData.waypoints.length - 1]} 
                radius={8}
                pathOptions={{ color: '#fff', fillColor: '#4CAF50', fillOpacity: 1, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <span style={{ fontWeight: 'bold', color: '#000' }}>{routeData.destination}</span>
                </Tooltip>
              </CircleMarker>
            </>
          )}
        </MapContainer>
        
        {/* CSS for animating the dasharray so it looks like it's flowing */}
        <style dangerouslySetInnerHTML={{__html: `
          .animated-route {
            animation: dash 30s linear infinite;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
        `}} />
      </div>
    </div>
  );
}
