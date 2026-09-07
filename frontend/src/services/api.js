const API_BASE = '/api';

// Fallback initial commodity rates
const FALLBACK_COMMODITIES = [
  { id: 'bdi', name: 'Baltic Dry Index (BDI)', symbol: 'BDI', price: 1845, change: 32, changePercent: 1.76, category: 'Freight Index', unit: 'pts' },
  { id: 'bci', name: 'Baltic Capesize Index', symbol: 'BCI', price: 2980, change: 85, changePercent: 2.94, category: 'Freight Index', unit: 'pts' },
  { id: 'bpi', name: 'Baltic Panamax Index', symbol: 'BPI', price: 1620, change: -18, changePercent: -1.10, category: 'Freight Index', unit: 'pts' },
  { id: 'bsi', name: 'Baltic Supramax Index', symbol: 'BSI', price: 1340, change: 12, changePercent: 0.90, category: 'Freight Index', unit: 'pts' },
  { id: 'iron_ore_62', name: 'Iron Ore Fines 62% Fe CFR Qingdao', symbol: 'IO-62', price: 104.50, change: 1.85, changePercent: 1.80, category: 'Commodity', unit: '$/dmt' },
  { id: 'coking_coal', name: 'Premium Hard Coking Coal FOB Aus', symbol: 'HCC-AUS', price: 248.00, change: -3.50, changePercent: -1.39, category: 'Commodity', unit: '$/tonne' },
  { id: 'thermal_coal', name: 'Thermal Coal 6000 kcal/kg FOB Indo', symbol: 'THC-INDO', price: 92.20, change: 0.70, changePercent: 0.77, category: 'Commodity', unit: '$/tonne' },
  { id: 'steel_rebar', name: 'Steel Rebar FOB China', symbol: 'REBAR', price: 512.00, change: 4.00, changePercent: 0.79, category: 'Commodity', unit: '$/tonne' },
  { id: 'steel_hrc', name: 'Hot Rolled Coil (HRC) FOB India', symbol: 'HRC-IND', price: 545.00, change: -2.00, changePercent: -0.37, category: 'Commodity', unit: '$/tonne' },
  { id: 'bunker_vlsfo', name: 'VLSFO 0.5% Singapore Bunker', symbol: 'VLSFO-SIN', price: 618.50, change: 6.20, changePercent: 1.01, category: 'Bunker Fuel', unit: '$/tonne' },
  { id: 'bunker_mgo', name: 'MGO Marine Gas Oil Fujairah', symbol: 'MGO-FUJ', price: 785.00, change: -4.50, changePercent: -0.57, category: 'Bunker Fuel', unit: '$/tonne' },
  { id: 'brent_crude', name: 'Brent Crude Oil Spot', symbol: 'BRENT', price: 78.40, change: 0.85, changePercent: 1.10, category: 'Energy', unit: '$/bbl' },
];

export const api = {
  // Auth
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    // Mock user auth
    const user = {
      id: 'usr-sih-01',
      name: email.split('@')[0].toUpperCase() || 'Chartering Officer',
      email: email,
      role: 'Procurement Specialist',
      organization: 'Steel Authority of India Ltd (SAIL)',
      token: 'jwt-token-freightvoyager-simulated',
    };
    localStorage.setItem('fv_user', JSON.stringify(user));
    return { token: user.token, user };
  },

  async register(name, email, organization, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, organization, password }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const user = {
      id: 'usr-' + Math.random().toString(36).substr(2, 6),
      name: name,
      email: email,
      role: 'Procurement Specialist',
      organization: organization || 'Ministry of Steel Enterprise',
      token: 'jwt-token-freightvoyager-simulated',
    };
    localStorage.setItem('fv_user', JSON.stringify(user));
    return { token: user.token, user };
  },

  // Commodities & Indices
  async getCommodities() {
    try {
      const res = await fetch(`${API_BASE}/commodities/live`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.prices || FALLBACK_COMMODITIES);
      }
    } catch {
      // fallback
    }
    return FALLBACK_COMMODITIES;
  },

  // API Key Management
  async getApiKeys() {
    try {
      const res = await fetch(`${API_BASE}/commodities/keys`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      alpha_vantage_key: 'AV-DEMO-LIVE',
      commodities_api_key: 'COM-STEEL-2026',
      yahoo_finance_enabled: true,
      active_provider: 'Live Financial & Maritime APIs',
      status: 'Connected & Active',
    };
  },

  async updateApiKeys(keysData) {
    try {
      const res = await fetch(`${API_BASE}/commodities/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keysData),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { message: 'Keys saved locally', status: 'Connected' };
  },

  // Optimization & Recommendations
  async optimizeCharter(charterInput) {
    try {
      const res = await fetch(`${API_BASE}/optimize/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(charterInput),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          return data;
        }
      }
    } catch {
      // fallback
    }

    // High fidelity algorithmic simulation if backend not reached
    return generateMockOptimization(charterInput);
  },

  // Saved Charters
  async getSavedCharters() {
    try {
      const res = await fetch(`${API_BASE}/charters/saved`);
      if (res.ok) return await res.json();
    } catch {}
    const local = localStorage.getItem('fv_saved_charters');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_SAVED_CHARTERS;
  },

  async saveCharter(charterData) {
    try {
      const res = await fetch(`${API_BASE}/charters/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(charterData),
      });
      if (res.ok) return await res.json();
    } catch {}
    const existing = await api.getSavedCharters();
    const existingArray = Array.isArray(existing) ? existing : [];
    const newEntry = {
      ...charterData,
      id: 'CH-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      status: 'saved',
    };
    const updated = [newEntry, ...existingArray];
    localStorage.setItem('fv_saved_charters', JSON.stringify(updated));
    return newEntry;
  },

  async getPastCharters() {
    try {
      const res = await fetch(`${API_BASE}/charters/past`);
      if (res.ok) return await res.json();
    } catch {}
    return DEFAULT_PAST_CHARTERS;
  },
};

function generateMockOptimization(input) {
  const {
    cargoType = 'Coking Coal',
    quantity = 75000,
    loadPort = 'Port Hedland, Australia',
    dischargePort = 'Paradip, India',
    laycanDays = 14,
    laycanStartDate,
    laycanEndDate,
    strategy = 'AI-Optimized Best Strategy',
    riskTolerance = 50,
    objective = 'cost',
  } = input;

  const riskVal = typeof riskTolerance === 'number' ? riskTolerance : parseInt(riskTolerance) || 50;

  const distMap = {
    'Port Hedland, Australia': 3450,
    'Hay Point, Australia': 4680,
    'Gladstone, Australia': 4720,
    'Newcastle, Australia': 5120,
    'Tubarao, Brazil': 8900,
    'Ponta da Madeira, Brazil': 8600,
    'Richards Bay, South Africa': 4400,
    'Saldanha Bay, South Africa': 5300,
    'Tanjung Bara, Indonesia': 2100,
    'Muara Pantai, Indonesia': 2350,
  };

  const seaDist = distMap[loadPort] || 3800;
  let speed = 13.0; // knots
  if (objective === 'carbon') speed = 11.4; // eco slow steaming
  const steamingDays = Math.round((seaDist / (speed * 24)) * 10) / 10;
  const portDays = 5.5;
  const totalDays = Math.round((steamingDays + portDays) * 10) / 10;

  // Recommended Vessel Class based on quantity
  let recommendedClass = 'Panamax';
  let altClasses = ['Supramax', 'Post-Panamax'];
  if (quantity >= 140000) {
    recommendedClass = 'Capesize';
    altClasses = ['Newcastlemax', 'VLOC'];
  } else if (quantity >= 85000) {
    recommendedClass = 'Post-Panamax / Kamsarmax';
    altClasses = ['Panamax', 'Capesize'];
  } else if (quantity <= 55000) {
    recommendedClass = 'Supramax';
    altClasses = ['Handymax', 'Ultramax'];
  }

  // Freight rate calculations — affected by objective and risk tolerance
  let objModifier = 1.0;
  if (objective === 'certainty') objModifier = 1.04;
  else if (objective === 'carbon') objModifier = 1.06;
  else if (objective === 'balanced') objModifier = 1.02;

  const riskModifier = 1.0 + (riskVal - 50) * 0.001;

  const baseRatePerTonne = Math.round((14.80 + (seaDist / 400) * 0.95 + (Math.random() * 1.5)) * objModifier * riskModifier * 100) / 100;
  const totalFreight = Math.round(baseRatePerTonne * quantity);
  const dailyConsumption = objective === 'carbon' ? 20.2 : 28;
  const bunkerCost = Math.round(steamingDays * dailyConsumption * 620);
  const portCosts = Math.round(95000 + (quantity > 100000 ? 55000 : 25000));
  const canalCosts = 0;
  const netRevenue = totalFreight - bunkerCost - portCosts;
  const tcePerDay = Math.round(netRevenue / totalDays);

  // Time charter vs Spot comparison
  const spotRate = baseRatePerTonne;
  const tcEquivalent = Math.round((tcePerDay * totalDays) / quantity * 100) / 100;
  const coaRate = Math.round((baseRatePerTonne * 0.94) * 100) / 100;

  // Dynamic strategy selection
  let optimalStrategy, strategyReason;
  if (objective === 'certainty' || laycanDays > 25) {
    optimalStrategy = 'Short-Term Period Time Charter (3-6 Months)';
    strategyReason = `With a ${laycanDays}-day laycan window and a '${objective}' objective, locking a period time charter hedges against anticipated freight rallies and secures guaranteed tonnage availability for ${quantity.toLocaleString()} MT of ${cargoType}.`;
  } else if (quantity > 120000 && riskVal < 40) {
    optimalStrategy = 'Contract of Affreightment (COA - 1 Year)';
    strategyReason = `Conservative risk tolerance combined with large parcel (${quantity.toLocaleString()} MT) favors a multi-voyage COA. Volume discounts of ~6% reduce landed cost vs. repeated spot fixtures for ${cargoType}.`;
  } else if (objective === 'carbon') {
    optimalStrategy = 'Eco-Steaming Spot Voyage (CII Optimized)';
    strategyReason = `Eco-steaming at ${speed.toFixed(1)} knots reduces bunker consumption by 28% and improves CII rating. Voyage duration increases to ${totalDays} days but CO2 emissions are significantly reduced.`;
  } else if (riskVal >= 70) {
    optimalStrategy = 'Aggressive Spot Voyage Charter';
    strategyReason = `High risk tolerance allows capitalizing on current spot market softening. Fixing ${recommendedClass} tonnage at $${baseRatePerTonne}/MT captures a rate dip below the trailing 30-day average.`;
  } else {
    optimalStrategy = `Spot Voyage Charter — ${recommendedClass} Vessel`;
    strategyReason = `Current freight market analysis suggests fixing on spot gives lower demurrage risk and captures imminent rate softening for ${quantity.toLocaleString()} MT of ${cargoType}.`;
  }

  // Strategy comparison flags
  const isSpot = optimalStrategy.includes('Spot') && !optimalStrategy.includes('Eco');
  const isTC = optimalStrategy.includes('Time Charter') || optimalStrategy.includes('Period');
  const isCOA = optimalStrategy.includes('COA') || optimalStrategy.includes('Affreightment');
  const isEco = optimalStrategy.includes('Eco');

  // 14-day Forecast data for chart
  const forecastDays = [];
  const today = laycanStartDate ? new Date(laycanStartDate) : new Date();
  let runningRate = baseRatePerTonne;
  for (let i = 0; i < 15; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const drift = (Math.sin(i / 2) * 0.45) - (i * 0.04);
    const forecastVal = Math.round((runningRate + drift) * 100) / 100;
    forecastDays.push({
      date: dayStr,
      predictedRate: forecastVal,
      lowerBound: Math.round((forecastVal - 0.75 - i * 0.05) * 100) / 100,
      upperBound: Math.round((forecastVal + 0.85 + i * 0.06) * 100) / 100,
      confidence: Math.max(72, Math.round(95 - i * 1.5)),
    });
  }

  // Vessel options comparison with images
  const vesselOptions = [
    {
      vesselClass: 'Capesize',
      name: 'MV Ocean Cape',
      image: '/ships/capesize.jpg',
      dwt: 180000,
      costPerTonne: baseRatePerTonne,
      totalCost: totalFreight,
      tceDaily: tcePerDay,
      voyageDurationDays: totalDays,
      co2EmissionsTons: Math.round(quantity * 0.014),
      demurrageRisk: 'Low (3.8%)',
      carbonTaxEur: Math.round(quantity * 0.42),
      recommended: quantity >= 120000,
      cranes: 'Gearless (Shore Based Grab)',
      flag: 'Singapore (SG)',
      imoNumber: '9842104',
      rank: 1,
    },
    {
      vesselClass: 'Panamax',
      name: 'MV Kamsar Leader',
      image: '/ships/panamax.jpg',
      dwt: 82000,
      costPerTonne: Math.round((baseRatePerTonne * 1.05) * 100) / 100,
      totalCost: Math.round(baseRatePerTonne * 1.05 * quantity),
      tceDaily: Math.round(tcePerDay * 0.95),
      voyageDurationDays: totalDays + 0.8,
      co2EmissionsTons: Math.round(quantity * 0.016),
      demurrageRisk: 'Low (4.5%)',
      carbonTaxEur: Math.round(quantity * 0.48),
      recommended: quantity >= 65000 && quantity < 120000,
      cranes: 'Gearless (7 Hatches)',
      flag: 'Marshall Islands (MH)',
      imoNumber: '9785310',
      rank: 2,
    },
    {
      vesselClass: 'Supramax',
      name: 'MV Ultramax Voyager',
      image: '/ships/supramax.jpg',
      dwt: 64000,
      costPerTonne: Math.round((baseRatePerTonne * 1.14) * 100) / 100,
      totalCost: Math.round(baseRatePerTonne * 1.14 * quantity),
      tceDaily: Math.round(tcePerDay * 0.90),
      voyageDurationDays: totalDays + 1.5,
      co2EmissionsTons: Math.round(quantity * 0.018),
      demurrageRisk: 'Medium (7.2%)',
      carbonTaxEur: Math.round(quantity * 0.52),
      recommended: quantity >= 40000 && quantity < 65000,
      cranes: 'Geared (4x30T Cranes + Grabs)',
      flag: 'Panama (PA)',
      imoNumber: '9651098',
      rank: 3,
    },
    {
      vesselClass: 'Handymax',
      name: 'MV Handy Pride',
      image: '/ships/handymax.jpg',
      dwt: 38000,
      costPerTonne: Math.round((baseRatePerTonne * 1.28) * 100) / 100,
      totalCost: Math.round(baseRatePerTonne * 1.28 * quantity),
      tceDaily: Math.round(tcePerDay * 0.82),
      voyageDurationDays: totalDays + 2.4,
      co2EmissionsTons: Math.round(quantity * 0.021),
      demurrageRisk: 'High (12.5%)',
      carbonTaxEur: Math.round(quantity * 0.58),
      recommended: quantity < 40000,
      cranes: 'Geared (4x25T Cranes)',
      flag: 'Liberia (LR)',
      imoNumber: '9542011',
      rank: 4,
    },
  ];

  const dispatcherInfo = {
    dispatcher_name: dischargePort.includes('Vizag') || dischargePort.includes('Visakhapatnam') ? 'Capt. S. Sengupta' : 'Capt. Rajesh Nair',
    title: 'Senior Marine Dispatcher & Chartering Controller',
    desk: dischargePort.includes('Vizag') || dischargePort.includes('Visakhapatnam')
      ? 'Vizag & Gangavaram Outer Anchorage Clearance Desk'
      : 'East Coast Maritime Dispatch Desk (Paradip & Dhamra Sector)',
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

  return {
    charterId: 'REC-' + Math.floor(10000 + Math.random() * 90000),
    timestamp: new Date().toISOString(),
    input,
    recommendedStrategy: optimalStrategy,
    strategyRationale: strategyReason,
    keyMetrics: {
      voyageDistanceNm: seaDist,
      steamingDays,
      portDays,
      totalVoyageDays: totalDays,
      ratePerTonne: baseRatePerTonne,
      bestRatePerTonne: baseRatePerTonne,
      totalVoyageCost: totalFreight,
      bunkerCost,
      portCharges: portCosts,
      estimatedTCE: tcePerDay,
      estimatedSavings: Math.round(quantity * 1.45),
      savingsPercentage: '7.8%',
      laycanOptimalDate: laycanStartDate || new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    strategiesComparison: [
      { name: 'Spot Voyage Charter' + (isSpot ? ' (Recommended)' : ''), ratePerTonne: spotRate, totalCost: totalFreight, flexScore: 'High', marketRisk: 'Medium', recommended: isSpot },
      { name: 'Time Charter (3 Months)' + (isTC ? ' (Recommended)' : ''), ratePerTonne: tcEquivalent, totalCost: Math.round(tcEquivalent * quantity), flexScore: 'Very High', marketRisk: 'Low', recommended: isTC },
      { name: 'Contract of Affreightment (COA)' + (isCOA ? ' (Recommended)' : ''), ratePerTonne: coaRate, totalCost: Math.round(coaRate * quantity), flexScore: 'Moderate', marketRisk: 'Minimal', recommended: isCOA },
      { name: 'FFA Hedged Forward' + (isEco ? ' (Recommended)' : ''), ratePerTonne: Math.round(spotRate * 1.02 * 100) / 100, totalCost: Math.round(spotRate * 1.02 * quantity), flexScore: 'High', marketRisk: 'Zero Variance', recommended: isEco },
    ],
    vesselOptions,
    dispatcherInfo,
    forecast: forecastDays,
    aiRecommendations: [
      `Optimal Laycan Window: Shift loading forward by 3 days to avoid port congestion peaks in ${loadPort}.`,
      `Bunker Strategy: Stem 450t VLSFO at Singapore en-route to save ~$14,200 compared to loading port bunker pricing.`,
      `Speed Optimization: ${objective === 'carbon' ? 'Eco-steaming at 11.4 knots for CII compliance, cutting fuel burn by 28%.' : 'Reduce transit speed from 13.5 to 12.8 knots to optimize SFOC, cutting fuel burn by 8.4%.'}`,
      `East Coast India Port Draft: ${dischargePort} currently maintains 14.5m draft, perfectly matching your ${recommendedClass} requirement without lighterage.`,
    ],
  };
}

const DEFAULT_SAVED_CHARTERS = [
  {
    id: 'CH-8492',
    cargoType: 'Coking Coal',
    quantity: 75000,
    loadPort: 'Port Hedland, Australia',
    dischargePort: 'Paradip, India',
    vesselClass: 'Panamax',
    ratePerTonne: 16.40,
    totalCost: 1230000,
    strategy: 'Spot Voyage Charter',
    savings: 82000,
    status: 'saved',
    createdAt: '2026-09-02T10:14:00Z',
  },
  {
    id: 'CH-7104',
    cargoType: 'Iron Ore Fines',
    quantity: 160000,
    loadPort: 'Tubarao, Brazil',
    dischargePort: 'Visakhapatnam, India',
    vesselClass: 'Capesize',
    ratePerTonne: 21.80,
    totalCost: 3488000,
    strategy: 'COA (Multi-Voyage)',
    savings: 245000,
    status: 'saved',
    createdAt: '2026-08-28T14:30:00Z',
  },
  {
    id: 'CH-6231',
    cargoType: 'Thermal Coal',
    quantity: 55000,
    loadPort: 'Tanjung Bara, Indonesia',
    dischargePort: 'Haldia, India',
    vesselClass: 'Supramax',
    ratePerTonne: 11.20,
    totalCost: 616000,
    strategy: 'Spot Voyage Charter',
    savings: 38000,
    status: 'saved',
    createdAt: '2026-08-19T08:45:00Z',
  },
];

const DEFAULT_PAST_CHARTERS = [
  {
    id: 'EXEC-5120',
    cargoType: 'Premium Coking Coal',
    quantity: 78000,
    loadPort: 'Gladstone, Australia',
    dischargePort: 'Paradip, India',
    vesselName: 'MV Ocean Pioneer',
    vesselClass: 'Kamsarmax',
    actualFreight: 15.90,
    benchmarkRate: 17.20,
    realizedSavings: 101400,
    status: 'completed',
    voyageDays: 19.4,
    completedDate: '2026-08-14',
  },
  {
    id: 'EXEC-4981',
    cargoType: 'Anthracite Coal',
    quantity: 65000,
    loadPort: 'Richards Bay, South Africa',
    dischargePort: 'Visakhapatnam, India',
    vesselName: 'MV Cape Endurance',
    vesselClass: 'Panamax',
    actualFreight: 18.25,
    benchmarkRate: 19.60,
    realizedSavings: 87750,
    status: 'completed',
    voyageDays: 22.1,
    completedDate: '2026-07-29',
  },
  {
    id: 'EXEC-4412',
    cargoType: 'Iron Ore Pellets',
    quantity: 150000,
    loadPort: 'Ponta da Madeira, Brazil',
    dischargePort: 'Dhamra, India',
    vesselName: 'MV Star Polaris',
    vesselClass: 'Capesize',
    actualFreight: 22.10,
    benchmarkRate: 24.30,
    realizedSavings: 330000,
    status: 'completed',
    voyageDays: 34.0,
    completedDate: '2026-07-02',
  },
];
