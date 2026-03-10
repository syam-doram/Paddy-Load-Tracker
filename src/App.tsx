  
// Area filter for Bags by Paddy Type
import React, { useState, useEffect } from 'react';
// ...existing code...

import { Capacitor } from '@capacitor/core';
import { 
  Truck, 
  Plus, 
  ChevronRight, 
  Calendar, 
  User, 
  Package, 
  ArrowLeft, 
  CheckCircle2, 
  Trash2,
  Loader2,
  History,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Users,
  Sun,
  Moon,
  LogOut,
  UserCircle,
  FactoryIcon,
  TractorIcon,
  BusIcon
} from 'lucide-react';
import { Menu, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Area,
  Legend,
  LabelList,
  Line
} from 'recharts';
import { Lorry, FarmerLoad, LorryDetail, User as UserType, MarketEntry } from './types';
import MarketEntryPage from './MarketEntryPage';

// Helper to get YYYY-MM-DD in local time
function getLocalYMD(dateObj: Date) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const today = getLocalYMD(new Date());

export default function App() {
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [user, setUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('paddy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'dashboard' | 'lorry-detail' | 'tractor-detail' | 'truck-detail' | 'new-lorry' | 'new-tractor' | 'new-truck' | 'analytics' | 'labour-management' | 'market' | 'market-entry' | 'login' | 'register' | 'onboarding'>(() => {
    const saved = localStorage.getItem('paddy_user');
    if (saved) {
      const u = JSON.parse(saved);
      return u.onboarded ? 'dashboard' : 'onboarding';
    }
    return 'login';
  });
  const [tractors, setTractors] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [lorries, setLorries] = useState<Lorry[]>([]);
  const [selectedLorryId, setSelectedLorryId] = useState<number | null>(null);
  const [currentLorry, setCurrentLorry] = useState<LorryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [stats, setStats] = useState<any>(null);
  const [labours, setLabours] = useState<any[]>([]);
  const [labourTitles, setLabourTitles] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('paddy_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [authForm, setAuthForm] = useState({ username: '', password: '', full_name: '' });
  const [authError, setAuthError] = useState('');
  const [newLorryForm, setNewLorryForm] = useState({ lorry_number: '', driver_name: '', vehicle_type: '' });
  const [newLoadForm, setNewLoadForm] = useState({ farmer_name: '', bag_count: '', labour_title: '', moisture_percent: '', weight_qlt: '', paddy_type: '', area: '' });
  const [newLabourForm, setNewLabourForm] = useState({ name: '', title_name: '' });
  const [marketEntries, setMarketEntries] = useState<MarketEntry[]>([]);
  const [sideOpen, setSideOpen] = useState(false);
  const [newMarketForm, setNewMarketForm] = useState({ name: '', price: '', unit: '/qtl', change_percent: '', region: '', trend: '' });
  const isToday = selectedDate === today;

  const getApiUrl = (endpoint: string) => {
    if (Capacitor.isNativePlatform()) {
      return `http://10.0.2.2:3000${endpoint}`;
    }
    return endpoint;
  };

  useEffect(() => {
    if (user && user.onboarded) {
      fetchLorries();
      fetchStats();
      fetchLabourTitles();
      fetchLabours();
      fetchMarkets();
    }
  }, [selectedDate, user]);

  const fetchMarkets = async () => {
    try {
      const res = await fetch(getApiUrl('/api/markets'));
      const data = await res.json();
      setMarketEntries(data);
    } catch (err) {
      console.error('Failed to fetch markets', err);
    }
  };

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      localStorage.setItem('paddy_theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (selectedLorryId) {
      fetchLorryDetail(selectedLorryId);
    }
  }, [selectedLorryId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authForm.username, password: authForm.password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setUser(data);
      localStorage.setItem('paddy_user', JSON.stringify(data));
      setView(data.onboarded ? 'dashboard' : 'onboarding');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      if (!res.ok) throw new Error('Username already exists');
      const data = await res.json();
      setUser(data);
      localStorage.setItem('paddy_user', JSON.stringify(data));
      setView('onboarding');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleOnboard = async () => {
    if (!user) return;
    try {
      await fetch(getApiUrl('/api/onboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const updatedUser = { ...user, onboarded: 1 };
      setUser(updatedUser);
      localStorage.setItem('paddy_user', JSON.stringify(updatedUser));
      setView('dashboard');
    } catch (err) {
      console.error("Onboarding failed", err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('paddy_user');
    setView('login');
  };

  const fetchLorries = async () => {
    setLoading(true);
    try {
      if (vehicleType === 'Tractor') {
        const res = await fetch(getApiUrl('/api/tractors'));
        const data = await res.json();
        setTractors(data);
        setLorries([]);
        setTrucks([]);
      } else if (vehicleType === 'Truck') {
        const res = await fetch(getApiUrl('/api/trucks'));
        const data = await res.json();
        setTrucks(data);
        setLorries([]);
        setTractors([]);
      } else {
        const res = await fetch(getApiUrl(`/api/lorries?date=${selectedDate}`));
        const data = await res.json();
        setLorries(data);
        setTractors([]);
        setTrucks([]);
      }
    } catch (err) {
      console.error("Failed to fetch lorries/tractors/trucks", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(getApiUrl('/api/stats'));
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchLabours = async () => {
    try {
      const res = await fetch(getApiUrl('/api/labours'));
      const data = await res.json();
      setLabours(data);
    } catch (err) {
      console.error("Failed to fetch labours", err);
    }
  };

  const fetchLabourTitles = async () => {
    try {
      const res = await fetch(getApiUrl('/api/labour-titles'));
      const data = await res.json();
      setLabourTitles(data);
    } catch (err) {
      console.error("Failed to fetch labour titles", err);
    }
  };

  const handleCreateLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(getApiUrl('/api/labours'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLabourForm)
      });
      setNewLabourForm({ name: '', title_name: '' });
      fetchLabours();
      fetchLabourTitles();
    } catch (err) {
      console.error("Failed to create labour", err);
    }
  };

  const handleDeleteLabour = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/labours/${id}`), { method: 'DELETE' });
      fetchLabours();
      fetchLabourTitles();
    } catch (err) {
      console.error("Failed to delete labour", err);
    }
  };

  const fetchLorryDetail = async (id: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/lorries/${id}`));
      const data = await res.json();
      setCurrentLorry(data);
    } catch (err) {
      console.error("Failed to fetch lorry detail", err);
    }
  };

  const handleCreateLorry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Always set vehicle_type from form or fallback to selected vehicleType
      const vehicle_type = newLorryForm.vehicle_type || vehicleType;
      let res, data;
      if (vehicle_type === 'Tractor') {
        res = await fetch(getApiUrl('/api/tractors'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lorry_number: newLorryForm.lorry_number, driver_name: newLorryForm.driver_name, date: selectedDate })
        });
        data = await res.json();
        setView('dashboard');
        setNewLorryForm({ lorry_number: '', driver_name: '', vehicle_type: '' });
        fetchLorries();
        fetchStats();
      } else {
        res = await fetch(getApiUrl('/api/lorries'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newLorryForm, vehicle_type, date: selectedDate })
        });
        data = await res.json();
        setSelectedLorryId(data.id);
        setView('lorry-detail');
        setNewLorryForm({ lorry_number: '', driver_name: '', vehicle_type: '' });
        fetchLorries();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to create lorry/tractor", err);
    }
  };

  const handleCreateTractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/tractors'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lorry_number: newLorryForm.lorry_number, driver_name: newLorryForm.driver_name, date: selectedDate })
      });
      const data = await res.json();
      setSelectedLorryId(data.id);
      setView('tractor-detail');
      setNewLorryForm({ lorry_number: '', driver_name: '', vehicle_type: '' });
      fetchLorries();
      fetchStats();
    } catch (err) {
      console.error("Failed to create tractor", err);
    }
  };

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/trucks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lorry_number: newLorryForm.lorry_number, driver_name: newLorryForm.driver_name, date: selectedDate })
      });
      const data = await res.json();
      setSelectedLorryId(data.id);
      setView('truck-detail');
      setNewLorryForm({ lorry_number: '', driver_name: '', vehicle_type: '' });
      fetchLorries();
      fetchStats();
    } catch (err) {
      console.error("Failed to create truck", err);
    }
  };

  const handleAddLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLorryId) return;
    try {
      await fetch(getApiUrl(`/api/lorries/${selectedLorryId}/loads`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmer_name: newLoadForm.farmer_name, 
          bag_count: parseInt(newLoadForm.bag_count),
          labour_title: newLoadForm.labour_title,
          moisture_percent: newLoadForm.moisture_percent ? parseFloat(newLoadForm.moisture_percent) : null,
          weight_qlt: newLoadForm.weight_qlt ? parseFloat(newLoadForm.weight_qlt) : null,
          paddy_type: newLoadForm.paddy_type || null,
          area: newLoadForm.area || null
        })
      });
      setNewLoadForm({ farmer_name: '', bag_count: '', labour_title: '', moisture_percent: '', weight_qlt: '', paddy_type: '', area: '' });
      fetchLorryDetail(selectedLorryId);
      fetchLorries();
      fetchStats();
    } catch (err) {
      console.error("Failed to add load", err);
    }
  };

  const handleDeleteLoad = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/loads/${id}`), { method: 'DELETE' });
      if (selectedLorryId) fetchLorryDetail(selectedLorryId);
      fetchLorries();
      fetchStats();
    } catch (err) {
      console.error("Failed to delete load", err);
    }
  };

  const handleUpdateStatus = async (status: 'loading' | 'completed') => {
    if (!selectedLorryId) return;
    try {
      await fetch(getApiUrl(`/api/lorries/${selectedLorryId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchLorryDetail(selectedLorryId);
      fetchLorries();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: newMarketForm.name,
        price: parseFloat(newMarketForm.price) || 0,
        unit: newMarketForm.unit || '/qtl',
        change_percent: newMarketForm.change_percent ? parseFloat(newMarketForm.change_percent) : 0,
        region: newMarketForm.region || null,
      };
      if (newMarketForm.trend) {
        // accept comma separated numbers
        payload.trend = newMarketForm.trend.split(',').map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
      }

      const res = await fetch(getApiUrl('/api/markets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create market entry');
      setNewMarketForm({ name: '', price: '', unit: '/qtl', change_percent: '', region: '', trend: '' });
      fetchMarkets();
      setSideOpen(false);
      setView('dashboard'); // Route to dashboard after adding market entry
    } catch (err) {
      console.error('Failed to create market', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      {user && user.onboarded && (
        <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => setSideOpen(true)} className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100">
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Truck className="text-white w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-zinc-700 ml-4">
                {(() => {
                  switch(view) {
                    case 'dashboard': return 'Dashboard';
                    case 'lorry-detail': return 'Lorry Detail';
                    case 'tractor-detail': return 'Tractor Detail';
                    case 'truck-detail': return 'Truck Detail';
                    case 'new-lorry': return 'New Lorry';
                    case 'new-truck': return 'New Truck';
                    case 'new-tractor': return 'New Tractor';
                    case 'analytics': return 'Analytics';
                    case 'labour-management': return 'Labour Management';
                    case 'market': return 'Market';
                    case 'market-entry': return 'Market Entry';
                    case 'login': return 'Login';
                    case 'register': return 'Register';
                    case 'onboarding': return 'Onboarding';
                    default: return '';
                  }
                })()}
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button 
                onClick={() => setView('dashboard')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  [
                    'dashboard',
                    'lorry-detail',
                    'tractor-detail',
                    'truck-detail',
                    'new-lorry',
                    'new-truck',
                    'new-tractor'
                  ].includes(view)
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Truck className="w-4 h-4" />
                Records
              </button>
              <button 
                onClick={() => setView('market')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  view === 'market' 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Market
              </button>
              <button 
                onClick={() => setView('analytics')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  view === 'analytics' 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button 
                onClick={() => setView('labour-management')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  view === 'labour-management' 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Labours
              </button>
            </nav>

            <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-md border border-zinc-200">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <input
                type="date"
                className="bg-transparent text-sm font-medium outline-none border-none focus:ring-0"
                value={selectedDate}
                max={today}
                onChange={e => setSelectedDate(e.target.value)}
                aria-label="Select date"
              />
            </div>
          </div>
        </header>
      )}

      {/* Dashboard: Show Lorries, Tractors, Trucks */}
      {view === 'dashboard' && (
        <main className="max-w-5xl mx-auto w-full flex-1 px-4 py-6">
          <h2 className="text-xl font-bold mb-4">Vehicle Records</h2>
          <div className="mb-6">
            <label className="mr-2 font-medium">Vehicle Type:</label>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All</option>
              <option value="Lorry">Lorry</option>
              <option value="Tractor">Tractor</option>
              <option value="Truck">Truck</option>
            </select>
          </div>
          {/* Lorries Table */}
          {vehicleType === '' && lorries.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Lorries</h3>
              <ul className="divide-y">
                {lorries.map(lorry => (
                  <li key={lorry.id} className="py-2 flex justify-between items-center">
                    <span>{lorry.lorry_number} - {lorry.driver_name}</span>
                    <button onClick={() => { setSelectedLorryId(lorry.id); setView('lorry-detail'); }} className="text-blue-600 hover:underline">View</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Tractors Table */}
          {(vehicleType === 'Tractor' || (vehicleType === '' && tractors.length > 0)) && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Tractors</h3>
              <ul className="divide-y">
                {tractors.map(tractor => (
                  <li key={tractor.id} className="py-2 flex justify-between items-center">
                    <span>{tractor.lorry_number} - {tractor.driver_name}</span>
                    <button onClick={() => { setSelectedLorryId(tractor.id); setView('tractor-detail'); }} className="text-blue-600 hover:underline">View</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Trucks Table */}
          {(vehicleType === 'Truck' || (vehicleType === '' && trucks.length > 0)) && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Trucks</h3>
              <ul className="divide-y">
                {trucks.map(truck => (
                  <li key={truck.id} className="py-2 flex justify-between items-center">
                    <span>{truck.lorry_number} - {truck.driver_name}</span>
                    <button onClick={() => { setSelectedLorryId(truck.id); setView('truck-detail'); }} className="text-blue-600 hover:underline">View</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      )}

      <AnimatePresence>
        {sideOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="fixed left-0 top-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 z-40 flex flex-col shadow-2xl overflow-y-auto"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
            onClick={() => {}}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <h3 className="font-extrabold text-xl text-white tracking-wide">Menu</h3>
              <button onClick={() => setSideOpen(false)} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            {/* Profile Section */}
            {user && (
              <div className="flex flex-col items-center gap-2 px-6 py-6 border-b border-zinc-800">
                <UserCircle className="w-12 h-12 text-emerald-400 mb-1" />
                <div className="font-bold text-base text-white">{user.full_name}</div>
                <div className="text-xs text-zinc-400">@{user.username}</div>
                <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-red-400 hover:underline mt-2 font-bold"><LogOut className="w-4 h-4" /> Logout</button>
              </div>
            )}
            <nav className="flex-1 flex flex-col gap-1 px-2 py-6">
              <button onClick={() => { setView('dashboard'); setSideOpen(false); }} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left font-medium transition-colors ${view === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}><Truck className="w-5 h-5" /> Home</button>
              <button onClick={() => { setView('market'); setSideOpen(false); }} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left font-medium transition-colors ${view === 'market' ? 'bg-emerald-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}><LayoutDashboard className="w-5 h-5" /> Market</button>
              <button onClick={() => { setView('analytics'); setSideOpen(false); }} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left font-medium transition-colors ${view === 'analytics' ? 'bg-emerald-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}><BarChart3 className="w-5 h-5" /> Analytics</button>
              <button onClick={() => { setView('labour-management'); setSideOpen(false); }} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left font-medium transition-colors ${view === 'labour-management' ? 'bg-emerald-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}><Users className="w-5 h-5" /> Labours</button>
              <button onClick={() => { setView('market-entry'); setSideOpen(false); }} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left font-medium transition-colors ${view === 'market-entry' ? 'bg-emerald-600 text-white' : 'text-zinc-200 hover:bg-zinc-800'}`}><Plus className="w-5 h-5" /> Add Market Entry</button>
            </nav>
            <div className="px-6 py-8 border-t border-zinc-800 flex flex-col items-center gap-4">
              <h1 className="text-lg font-extrabold tracking-tight text-white">Paddy Load Tracker</h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Harvest Logistics System</p>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="p-2 rounded-md text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" /> Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col">
        <AnimatePresence mode="wait">
                    {view === 'market-entry' && (
                      <MarketEntryPage 
                        handleCreateMarket={handleCreateMarket}
                        newMarketForm={newMarketForm}
                        setNewMarketForm={setNewMarketForm}
                      />
                    )}
          {view === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm w-full max-w-md">
                <div className="flex justify-center mb-6">
                  <div className="bg-emerald-600 p-3 rounded-2xl">
                    <Truck className="text-white w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Labour Login</h2>
                <p className="text-zinc-500 text-center mb-8">Access the Paddy Harvest Logistics system.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Username</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                    <input 
                      required
                      type="password"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                  >
                    Login
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-zinc-500">
                  New here? <button onClick={() => setView('register')} className="text-emerald-600 font-bold hover:underline">Register as Labour</button>
                </p>
              </div>
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-2">Labour Registration</h2>
                <p className="text-zinc-500 text-center mb-8">Join the logistics team today.</p>
                
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Full Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                      value={authForm.full_name}
                      onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Username</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                    <input 
                      required
                      type="password"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    Register
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-zinc-500">
                  Already registered? <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline">Login</button>
                </p>
              </div>
            </motion.div>
          )}

          {view === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 shadow-sm w-full max-w-2xl text-center">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black mb-4">Welcome, {user?.full_name}!</h2>
                <p className="text-zinc-500 text-lg mb-12 max-w-md mx-auto">
                  You've successfully joined the Paddy Harvest Logistics team. Let's get you started with your dashboard.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Truck className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm">Track Lorries</h4>
                    <p className="text-xs text-zinc-400">Record every lorry that arrives for loading.</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Package className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm">Bag Counts</h4>
                    <p className="text-xs text-zinc-400">Log bag counts for each farmer accurately.</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <BarChart3 className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm">Analytics</h4>
                    <p className="text-xs text-zinc-400">View daily summaries and harvest trends.</p>
                  </div>
                </div>

                <button 
                  onClick={handleOnboard}
                  className="bg-zinc-900 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
                >
                  Go to My Dashboard
                </button>
              </div>
            </motion.div>
          )}
{view === "dashboard" && (
  <motion.div
    key="dashboard"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-6"
  >
    {/* Vehicle Type Selector as Cards (Dashboard only) */}
    {view === 'dashboard' && (
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <label className="block text-sm font-bold mb-4 text-zinc-700">Choose Vehicle Type:</label>
        <div className="flex gap-4 flex-wrap mb-4">
          {['All Vehicles','Truck', 'Tractor', 'Lorry'].map(type => (
            <div
              key={type}
              className={`cursor-pointer flex flex-col items-center justify-center border-2 rounded-xl px-6 py-4 shadow transition-all duration-150 ${vehicleType === type ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-white hover:border-emerald-300'}`}
              onClick={() => {
                setVehicleType(type);
              }}
            >
              <span className="mb-2">
                {type === 'All Vehicles' && <FactoryIcon className="w-8 h-8 text-blue-500" />}
                {type === 'Truck' && <Truck className="w-8 h-8 text-blue-500" />}
                {type === 'Tractor' && <TractorIcon className="w-8 h-8 text-green-500" />}
                {type === 'Lorry' && <BusIcon className="w-8 h-8 text-orange-500" />}
              </span>
              <span className="font-bold text-zinc-700">{type}</span>
            </div>
          ))}
          <div className="flex justify-between items-end">
      {isToday && (
        <button
          onClick={() => {
            if (vehicleType === 'Truck') {
              setView('new-truck');
              setNewLorryForm(f => ({ ...f, vehicle_type: 'Truck' }));
            } else if (vehicleType === 'Tractor') {
              setView('new-tractor');
              setNewLorryForm(f => ({ ...f, vehicle_type: 'Tractor' }));
            } else if (vehicleType === 'Lorry') {
              setView('new-lorry');
              setNewLorryForm(f => ({ ...f, vehicle_type: 'Lorry' }));
            }
          }}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <Plus className="w-4 h-4" />
          New {vehicleType && vehicleType !== 'All Vehicles' ? vehicleType : 'Lorry'}
        </button>
        
      )}
    </div>
        </div>
        {isToday && vehicleType && (
          <div className="flex items-center gap-3 mt-2 mb-2">
            {vehicleType === 'Truck' && <Truck className="w-8 h-8 text-blue-500" />} 
            {vehicleType === 'Tractor' && <TractorIcon  className="w-8 h-8 text-green-500" />} 
            {vehicleType === 'Lorry' && <Truck className="w-8 h-8 text-orange-500" />} 
            {vehicleType === 'All Vehicles' && <FactoryIcon className="w-8 h-8 text-blue-500" />}
            <span className="text-2xl font-extrabold text-zinc-800">Today {vehicleType}</span>
          </div>
        )}
        {!isToday && vehicleType && (
          <div className="flex items-center gap-3 mt-2 mb-2">
            {vehicleType === 'Truck' && <Truck className="w-8 h-8 text-blue-500" />} 
            {vehicleType === 'Tractor' && <Package className="w-8 h-8 text-green-500" />} 
            {vehicleType === 'Lorry' && <Truck className="w-8 h-8 text-orange-500" />} 
            {vehicleType === 'All Vehicles' && <Truck className="w-8 h-8 text-emerald-500" />}
            <span className="text-2xl font-extrabold text-zinc-800">{vehicleType} Dashboard</span>
          </div>
        )}
      </div>
    )}
    

    {loading ? (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Loading records...</p>
      </div>
    ) : vehicleType === 'Tractor' ? (
      tractors.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center">
          <div className="bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <TractorIcon className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">
            No tractors recorded
          </h3>
          <p className="text-zinc-500 mb-6">
            Start by adding a new tractor to track paddy bag loading.
          </p>
          {isToday && (
            <button
              onClick={() => setView("new-tractor")}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Add your first tractor for today
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tractors.map((tractor) => (
            <div
              key={tractor.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <TractorIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">
                      {tractor.lorry_number}
                    </h4>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {tractor.driver_name || "No driver assigned"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {tractor.status || 'loading'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    ) : !lorries || lorries.length === 0 ? (
      <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center">
        <div className="bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">
          No lorries recorded
        </h3>
        <p className="text-zinc-500 mb-6">
          Start by adding a new lorry to track paddy bag loading.
        </p>
        {isToday && (
          <button
            onClick={() => setView("new-lorry")}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Add your first lorry for today
          </button>
        )}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lorries
          .filter(lorry => vehicleType === 'All Vehicles' || lorry.vehicle_type === vehicleType)
          .map((lorry) => (
          <div
            key={lorry.id}
            onClick={() => {
              setSelectedLorryId(lorry.id);
              setCurrentLorry({ ...lorry, loads: lorry.loads || [] });
              setView("lorry-detail");
            }}
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    lorry.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">
                    {lorry.lorry_number}
                  </h4>
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {lorry.driver_name || "No driver assigned"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                  lorry.status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {lorry.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600">
                  <span className="text-zinc-900 font-bold">
                    {lorry.total_bags ?? 0}
                  </span>{" "}
                  Bags Loaded
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
)}

          {view === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Live Market Rates</h2>
                  <p className="text-zinc-500">Latest paddy market prices and weekly trends.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => fetchMarkets()} className="text-sm text-zinc-500 hover:text-zinc-800">Refresh</button>
                  <button className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100">
                    <Bell className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketEntries.map((m) => (
                  <div key={m.id} className="bg-white border border-zinc-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-zinc-900">{m.name}</h4>
                        <p className="text-xs text-zinc-400">{m.region || 'Local'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">₹{m.price.toLocaleString()}</div>
                        <div className={`text-xs font-bold ${m.change_percent && m.change_percent > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{m.change_percent ? `${m.change_percent > 0 ? '+' : ''}${m.change_percent}%` : ''}</div>
                      </div>
                    </div>
                    {m.trend && m.trend.length > 0 && (
                      <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={m.trend.map((v, idx) => ({ day: idx, v }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Bar dataKey="v" fill="#10b981" barSize={8} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
                {marketEntries.length === 0 && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-8 col-span-full text-center text-zinc-400">
                    No market data available yet.
                  </div>
                )}
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Weekly Trend (Average)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={(marketEntries[0]?.trend || []).map((v: number, i: number) => ({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] || `D${i+1}`, value: v }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={0.2} fill="#10b981" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Harvest Analytics</h2>
                <p className="text-zinc-500">Overview of loading progress and farmer contributions.</p>
              </div>

              {stats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                          <Package className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Bags</h3>
                      </div>
                      <p className="text-4xl font-black text-zinc-900">{stats.totalBags}</p>
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
                        <TrendingUp className="w-3 h-3" /> All time record
                      </div>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <Truck className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Lorries</h3>
                      </div>
                      <p className="text-4xl font-black text-zinc-900">{stats.totalLorries}</p>
                      <p className="text-zinc-400 text-xs mt-2">Dispatched across all dates</p>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                          <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Unique Farmers</h3>
                      </div>
                      <p className="text-4xl font-black text-zinc-900">{stats.totalFarmers}</p>
                      <p className="text-zinc-400 text-xs mt-2">Contributing to the harvest</p>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6">Daily Summary Table</h3>
                    <div className="overflow-x-auto mb-8">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="pb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Date</th>
                            <th className="pb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Lorries Dispatched</th>
                            <th className="pb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Total Bags Loaded</th>
                            <th className="pb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Avg Bags/Lorry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {[...stats.dailyStats].reverse().map((day: any) => (
                            <tr key={day.date} className="hover:bg-zinc-50 transition-colors">
                              <td className="py-4 font-medium text-zinc-900">{day.date}</td>
                              <td className="py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  <Truck className="w-3 h-3" /> {day.lorries}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <Package className="w-3 h-3" /> {day.bags}
                                </span>
                              </td>
                              <td className="py-4 text-sm font-mono text-zinc-500">
                                {day.lorries > 0 ? (day.bags / day.lorries).toFixed(1) : '0.0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                  </div>
{/* Paddy Type vs Bags Count Graph with Area Filter */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-md font-bold">Bags by Paddy Type</h4>
                        {Array.isArray(stats.paddyTypeStats) && stats.paddyTypeStats.length > 0 && (
                          <select
                            className="ml-auto bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                          >
                            <option value="All">All Areas</option>
                            {Array.from(new Set(stats.paddyTypeStats.map(row => row.area || 'Unknown'))).map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      {Array.isArray(stats.paddyTypeStats) && stats.paddyTypeStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={360}>
                          {(() => {
                            // 1. Get last 7 days (week) dates
                            const today = new Date();
                            const weekDates: string[] = [];
                            for (let i = 6; i >= 0; i--) {
                              const d = new Date(today);
                              d.setDate(today.getDate() - i);
                              weekDates.push(d.toISOString().slice(0, 10));
                            }
                            // 2. Get all unique paddy types
                            // For the new chart: single blue bar, green line, dual Y axes, value labels, rounded bars, modern dark style
                            // 1. Sum all bags for each date (bar), and sum all bags for the week (line)
                            const chartData = weekDates.map(date => {
                              // Sum bags for this date
                              const bags = stats.paddyTypeStats
                                .filter((r: any) => r.date === date || r.date === undefined) // fallback if no date
                                .reduce((sum: number, r: any) => sum + (Number(r.bags) || 0), 0);
                              // For the line, use a moving sum (simulate a trend)
                              // Here, just use bags * random factor for demo, replace with real trend if available
                              return {
                                date,
                                bags,
                                trend: bags * (0.8 + 0.4 * Math.random()) // Simulated trend
                              };
                            });
                            return (
                              <ComposedChart
                                data={chartData}
                                margin={{ top: 0, right: 0, bottom: 30, left: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3a4252" />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 14, fill: '#b3bed7' }}
                                  dy={10}
                                  tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                                  }}
                                />
                                <YAxis
                                  yAxisId="left"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 14, fill: '#b3bed7' }}
                                  width={48}
                                />
                                <YAxis
                                  yAxisId="right"
                                  orientation="right"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 14, fill: '#b3bed7' }}
                                  width={32}
                                />
                                <Tooltip
                                  cursor={{ stroke: '#3a4252', strokeWidth: 2 }}
                                  contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #2d3748',
                                    background: '#232b3b',
                                    color: '#fff',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                                    padding: '12px'
                                  }}
                                  labelStyle={{ color: '#b3bed7' }}
                                />
                                <Bar
                                  yAxisId="right"
                                  dataKey="bags"
                                  fill="#3b82f6"
                                  barSize={36}
                                  radius={[10, 10, 10, 10]}
                                >
                                  <LabelList dataKey="bags" position="top" fill="#3b82f6" fontSize={18} fontWeight={700} />
                                </Bar>
                                <Line
                                  yAxisId="left"
                                  type="monotone"
                                  dataKey="trend"
                                  stroke="#22d3ee"
                                  strokeWidth={3}
                                  dot={false}
                                  activeDot={{ r: 7 }}
                                />
                              </ComposedChart>
                            );
                          })()}
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-zinc-400 text-center py-8">No paddy type data available. Add farmer loads with a paddy type to see this graph.</div>
                      )}
                    </div>
                     <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Daily Loading Volume</h3>
                        <div className="flex gap-4 text-xs font-medium">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                            <span className="text-zinc-500">Bags</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                            <span className="text-zinc-500">Lorries</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={stats.dailyStats} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <defs>
                              <linearGradient id="colorBags" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#888' }}
                              tickFormatter={(val) => val.split('-').slice(1).join('/')}
                              dy={10}
                            />
                            <YAxis 
                              yAxisId="left"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#888' }} 
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#888' }} 
                            />
                            <Tooltip 
                              cursor={{ stroke: '#f0f0f0', strokeWidth: 2 }}
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid #e4e4e7', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                              }}
                            />
                            <Area 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="bags" 
                              name="Bags"
                              stroke="#10b981" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorBags)" 
                            />
                            <Bar 
                              yAxisId="right"
                              dataKey="lorries" 
                              name="Lorries" 
                              barSize={40}
                              radius={[6, 6, 0, 0]} 
                              fill="#3b82f6" 
                              opacity={0.8}
                            >
                              <LabelList dataKey="lorries" position="top" style={{ fontSize: '10px', fill: '#3b82f6', fontWeight: 'bold' }} />
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   

                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-6">Top Contributing Farmers</h3>
                      <div className="space-y-4">
                        {stats.topFarmers.map((farmer: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                {idx + 1}
                              </div>
                              <span className="font-bold text-zinc-900">{farmer.farmer_name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black text-emerald-600">{farmer.bags}</span>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Bags</span>
                            </div>
                          </div>
                        ))}
                        {stats.topFarmers.length === 0 && (
                          <div className="py-20 text-center text-zinc-400 italic">
                            No harvest data available yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-6">Labour Group Performance</h3>
                      <div className="space-y-4">
                        {stats.labourPerformance?.map((group: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                                {idx + 1}
                              </div>
                              <div>
                                <span className="font-bold text-zinc-900 block">{group.labour_title}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {labours
                                    .filter(l => l.title_name === group.labour_title)
                                    .slice(0, 3)
                                    .map(l => (
                                      <span key={l.id} className="text-[8px] text-zinc-400">
                                        {l.name}
                                      </span>
                                    ))}
                                  {labours.filter(l => l.title_name === group.labour_title).length > 3 && (
                                    <span className="text-[8px] text-zinc-400">...</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black text-blue-600">{group.bags}</span>
                              <span className="text-[10px] font-bold uppercase text-zinc-400 ml-1">Bags</span>
                            </div>
                          </div>
                        ))}
                        {(!stats.labourPerformance || stats.labourPerformance.length === 0) && (
                          <div className="py-20 text-center text-zinc-400 italic">
                            No labour data available yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>Calculating statistics...</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'labour-management' && (
            <motion.div 
              key="labour-management"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Labour Management</h2>
                  <p className="text-zinc-500">Manage labour names and their group titles.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm sticky top-24">
                    <h3 className="text-lg font-bold mb-6">Add New Labour</h3>
                    <form onSubmit={handleCreateLabour} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Labour Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="e.g. John Doe"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                          value={newLabourForm.name}
                          onChange={(e) => setNewLabourForm({ ...newLabourForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Title Name (Group)</label>
                        <input 
                          required
                          type="text"
                          placeholder="e.g. Morning Shift A"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                          value={newLabourForm.title_name}
                          onChange={(e) => setNewLabourForm({ ...newLabourForm, title_name: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">This title will be used to group labours during loading.</p>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                      >
                        Add Labour
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Name</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Title / Group</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {labours.map((labour) => (
                          <tr key={labour.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-zinc-900">{labour.name}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {labour.title_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteLabour(labour.id)}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {labours.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-zinc-400 italic">
                              No labours added yet. Add your first labour to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {view === 'new-lorry' && (
            <motion.div 
              key="new-lorry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-2">New {newLorryForm.vehicle_type || vehicleType || 'Lorry'} Entry</h2>
                <p className="text-zinc-500 mb-8">Enter the {newLorryForm.vehicle_type || vehicleType || 'lorry'} details to start recording bag counts.</p>
                <form onSubmit={handleCreateLorry} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{newLorryForm.vehicle_type || vehicleType ? `${newLorryForm.vehicle_type || vehicleType} Number` : 'Lorry Number'}</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. ABC-1234"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.lorry_number}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, lorry_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Driver Name</label>
                    <input 
                      type="text"
                      placeholder="Enter driver name"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.driver_name}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, driver_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Vehicle Type</label>
                    <select
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.vehicle_type}
                      onChange={e => setNewLorryForm({ ...newLorryForm, vehicle_type: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                  >
                    Start Loading
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'new-tractor' && (
            <motion.div 
              key="new-tractor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-2">New Tractor Entry</h2>
                <p className="text-zinc-500 mb-8">Enter the tractor details to start recording bag counts.</p>
                <form onSubmit={handleCreateTractor} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Tractor Number</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. TRACTOR-1234"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.lorry_number}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, lorry_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Driver Name</label>
                    <input 
                      type="text"
                      placeholder="Enter driver name"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.driver_name}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, driver_name: e.target.value })}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-green-700 text-white py-4 rounded-xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-200"
                  >
                    Start Loading
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'new-truck' && (
            <motion.div 
              key="new-truck"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-2">New Truck Entry</h2>
                <p className="text-zinc-500 mb-8">Enter the truck details to start recording bag counts.</p>
                <form onSubmit={handleCreateTruck} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Truck Number</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. TRUCK-5678"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.lorry_number}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, lorry_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Driver Name</label>
                    <input 
                      type="text"
                      placeholder="Enter driver name"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      value={newLorryForm.driver_name}
                      onChange={(e) => setNewLorryForm({ ...newLorryForm, driver_name: e.target.value })}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
                  >
                    Start Loading
                  </button>
                </form>
              </div>
            </motion.div>
          )}
 {view === 'truck-detail' && currentLorry && (
            <motion.div 
              key="truck-detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  
                  <div className="flex gap-2">
                    {currentLorry.status === 'loading' ? (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus('loading')}
                        className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-300 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Reopen Loading
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {currentLorry.vehicle_type === 'Truck' && <Truck className="w-7 h-7 text-blue-500" />}
                        {currentLorry.vehicle_type === 'Tractor' && <TractorIcon className="w-7 h-7 text-green-500" />}
                        {currentLorry.vehicle_type === 'Lorry' && <BusIcon className="w-7 h-7 text-orange-500" />}
                        <h2 className="text-3xl font-black tracking-tight">{currentLorry.lorry_number || currentLorry.truck_number || currentLorry.tractor_number || 'No Number'}</h2>
                      </div>
                      <p className="text-zinc-500 flex items-center gap-2 mt-1">
                        <span className="font-bold uppercase tracking-wider text-xs bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">{currentLorry.vehicle_type || 'Lorry'}</span>
                        <User className="w-4 h-4" /> {currentLorry.driver_name || currentLorry.truck_driver || currentLorry.tractor_driver || 'No driver assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Bags</p>
                      <p className="text-4xl font-black text-emerald-600">
                        {currentLorry.loads.reduce((acc, curr) => acc + curr.bag_count, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2">Farmer Load Records</h3>
                    {currentLorry.loads.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 italic">
                        No bags recorded yet. Use the form to add loads.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {currentLorry.loads.map((load) => (
                          <div key={load.id} className="py-4 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-zinc-900">{load.farmer_name || load.truck_farmer_name || load.tractor_farmer_name || 'No Farmer Name'}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-zinc-500 font-mono">ID: #{load.id.toString().padStart(4, '0')}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                                  <Users className="w-3 h-3" /> {load.labour_title || load.truck_labour_title || load.tractor_labour_title || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-lg font-black text-zinc-900">{load.bag_count}</p>
                                <p className="text-[10px] font-bold uppercase text-zinc-400">Bags</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteLoad(load.id)}
                                className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`bg-white border border-zinc-200 rounded-2xl p-6 sticky top-24 ${currentLorry.status === 'completed' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add Farmer Load
                  </h3>
                    <form onSubmit={handleAddLoad} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Farmer Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="Enter farmer name"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all"
                          value={newLoadForm.farmer_name}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, farmer_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Bag Count</label>
                        <input 
                          required
                          type="number"
                          min="1"
                          placeholder="0"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.bag_count}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, bag_count: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Loading Labours (Title)</label>
                        <select 
                          required
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all appearance-none"
                          value={newLoadForm.labour_title}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, labour_title: e.target.value })}
                        >
                          <option value="">Select Labour Title</option>
                          {labourTitles.map(title => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                        {newLoadForm.labour_title && (
                          <div className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> Group Members:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {labours
                                .filter(l => l.title_name === newLoadForm.labour_title)
                                .map(l => (
                                  <span key={l.id} className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600">
                                    {l.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Area</label>
                        <input 
                          type="text"
                          placeholder="e.g. East Village"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.area}
                          onChange={e => setNewLoadForm({ ...newLoadForm, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Paddy Type</label>
                        <input 
                          type="text"
                          placeholder="e.g. Sona Masoori"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.paddy_type}
                          onChange={e => setNewLoadForm({ ...newLoadForm, paddy_type: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Moisture %</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 14.5"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.moisture_percent}
                          onChange={e => setNewLoadForm({ ...newLoadForm, moisture_percent: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Weight (Qtl)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 8.25"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.weight_qlt}
                          onChange={e => setNewLoadForm({ ...newLoadForm, weight_qlt: e.target.value })}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Add to Truck
                      </button>
                    </form>
                  {currentLorry.status === 'completed' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-6 text-center">
                      <p className="text-sm font-bold text-zinc-600">Truck is marked as completed. Reopen to add more loads.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
           {view === 'tractor-detail' && currentLorry && (
            <motion.div 
              key="tractor-detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
        
                  <div className="flex gap-2">
                    {currentLorry.status === 'loading' ? (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus('loading')}
                        className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-300 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Reopen Loading
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {currentLorry.vehicle_type === 'Truck' && <Truck className="w-7 h-7 text-blue-500" />}
                        {currentLorry.vehicle_type === 'Tractor' && <TractorIcon className="w-7 h-7 text-green-500" />}
                        {currentLorry.vehicle_type === 'Lorry' && <BusIcon className="w-7 h-7 text-orange-500" />}
                        <h2 className="text-3xl font-black tracking-tight">{currentLorry.lorry_number}</h2>
                      </div>
                      <p className="text-zinc-500 flex items-center gap-2 mt-1">
                        <span className="font-bold uppercase tracking-wider text-xs bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">{currentLorry.vehicle_type || 'Lorry'}</span>
                        <User className="w-4 h-4" /> {currentLorry.driver_name || 'No driver assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Bags</p>
                      <p className="text-4xl font-black text-emerald-600">
                        {currentLorry.loads.reduce((acc, curr) => acc + curr.bag_count, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2">Farmer Load Records</h3>
                    {currentLorry.loads.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 italic">
                        No bags recorded yet. Use the form to add loads.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {currentLorry.loads.map((load) => (
                          <div key={load.id} className="py-4 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-zinc-900">{load.farmer_name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-zinc-500 font-mono">ID: #{load.id.toString().padStart(4, '0')}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                                  <Users className="w-3 h-3" /> {load.labour_title || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-lg font-black text-zinc-900">{load.bag_count}</p>
                                <p className="text-[10px] font-bold uppercase text-zinc-400">Bags</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteLoad(load.id)}
                                className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`bg-white border border-zinc-200 rounded-2xl p-6 sticky top-24 ${currentLorry.status === 'completed' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add Farmer Load
                  </h3>
                    <form onSubmit={handleAddLoad} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Farmer Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="Enter farmer name"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all"
                          value={newLoadForm.farmer_name}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, farmer_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Bag Count</label>
                        <input 
                          required
                          type="number"
                          min="1"
                          placeholder="0"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.bag_count}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, bag_count: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Loading Labours (Title)</label>
                        <select 
                          required
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all appearance-none"
                          value={newLoadForm.labour_title}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, labour_title: e.target.value })}
                        >
                          <option value="">Select Labour Title</option>
                          {labourTitles.map(title => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                        {newLoadForm.labour_title && (
                          <div className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> Group Members:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {labours
                                .filter(l => l.title_name === newLoadForm.labour_title)
                                .map(l => (
                                  <span key={l.id} className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600">
                                    {l.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Area</label>
                        <input 
                          type="text"
                          placeholder="e.g. East Village"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.area}
                          onChange={e => setNewLoadForm({ ...newLoadForm, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Paddy Type</label>
                        <input 
                          type="text"
                          placeholder="e.g. Sona Masoori"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.paddy_type}
                          onChange={e => setNewLoadForm({ ...newLoadForm, paddy_type: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Moisture %</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 14.5"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.moisture_percent}
                          onChange={e => setNewLoadForm({ ...newLoadForm, moisture_percent: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Weight (Qtl)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 8.25"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.weight_qlt}
                          onChange={e => setNewLoadForm({ ...newLoadForm, weight_qlt: e.target.value })}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Add to Tractor
                      </button>
                    </form>
                  {currentLorry.status === 'completed' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-6 text-center">
                      <p className="text-sm font-bold text-zinc-600">Tractor is marked as completed. Reopen to add more loads.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {view === 'lorry-detail' && currentLorry && (
            <motion.div 
              key="lorry-detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="flex gap-2">
                    {currentLorry.status === 'loading' ? (
                      <button 
                        onClick={() => handleUpdateStatus('completed')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus('loading')}
                        className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-300 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Reopen Loading
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {currentLorry.vehicle_type === 'Truck' && <Truck className="w-7 h-7 text-blue-500" />}
                        {currentLorry.vehicle_type === 'Tractor' && <TractorIcon className="w-7 h-7 text-green-500" />}
                        {currentLorry.vehicle_type === 'Lorry' && <BusIcon className="w-7 h-7 text-orange-500" />}
                        <h2 className="text-3xl font-black tracking-tight">{currentLorry.lorry_number}</h2>
                      </div>
                      <p className="text-zinc-500 flex items-center gap-2 mt-1">
                        <span className="font-bold uppercase tracking-wider text-xs bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">{currentLorry.vehicle_type || 'Lorry'}</span>
                        <User className="w-4 h-4" /> {currentLorry.driver_name || 'No driver assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Bags</p>
                      <p className="text-4xl font-black text-emerald-600">
                        {currentLorry.loads.reduce((acc, curr) => acc + curr.bag_count, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2">Farmer Load Records</h3>
                    {currentLorry.loads.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 italic">
                        No bags recorded yet. Use the form to add loads.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {currentLorry.loads.map((load) => (
                          <div key={load.id} className="py-4 flex justify-between items-center group">
                            <div>
                              <p className="font-bold text-zinc-900">{load.farmer_name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-zinc-500 font-mono">ID: #{load.id.toString().padStart(4, '0')}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                                  <Users className="w-3 h-3" /> {load.labour_title || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-lg font-black text-zinc-900">{load.bag_count}</p>
                                <p className="text-[10px] font-bold uppercase text-zinc-400">Bags</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteLoad(load.id)}
                                className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`bg-white border border-zinc-200 rounded-2xl p-6 sticky top-24 ${currentLorry.status === 'completed' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    Add Farmer Load
                  </h3>
                    <form onSubmit={handleAddLoad} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Farmer Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="Enter farmer name"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all"
                          value={newLoadForm.farmer_name}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, farmer_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Bag Count</label>
                        <input 
                          required
                          type="number"
                          min="1"
                          placeholder="0"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.bag_count}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, bag_count: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Loading Labours (Title)</label>
                        <select 
                          required
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all appearance-none"
                          value={newLoadForm.labour_title}
                          onChange={(e) => setNewLoadForm({ ...newLoadForm, labour_title: e.target.value })}
                        >
                          <option value="">Select Labour Title</option>
                          {labourTitles.map(title => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                        {newLoadForm.labour_title && (
                          <div className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> Group Members:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {labours
                                .filter(l => l.title_name === newLoadForm.labour_title)
                                .map(l => (
                                  <span key={l.id} className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600">
                                    {l.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Area</label>
                        <input 
                          type="text"
                          placeholder="e.g. East Village"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.area}
                          onChange={e => setNewLoadForm({ ...newLoadForm, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Paddy Type</label>
                        <input 
                          type="text"
                          placeholder="e.g. Sona Masoori"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.paddy_type}
                          onChange={e => setNewLoadForm({ ...newLoadForm, paddy_type: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Moisture %</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 14.5"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.moisture_percent}
                          onChange={e => setNewLoadForm({ ...newLoadForm, moisture_percent: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Weight (Qtl)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 8.25"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 transition-all font-mono text-lg"
                          value={newLoadForm.weight_qlt}
                          onChange={e => setNewLoadForm({ ...newLoadForm, weight_qlt: e.target.value })}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        Add to Lorry
                      </button>
                    </form>
                  {currentLorry.status === 'completed' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-6 text-center">
                      <p className="text-sm font-bold text-zinc-600">Lorry is marked as completed. Reopen to add more loads.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-zinc-200 py-6 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-zinc-400 text-xs font-medium">
          <p>© 2026 Paddy Harvest Logistics</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Online</span>
            <span>v1.0.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


