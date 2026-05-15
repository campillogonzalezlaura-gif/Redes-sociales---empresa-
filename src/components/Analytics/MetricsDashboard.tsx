import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#1a1a1a', '#b49b85', '#e8e4e1', '#6b6b6b', '#f5f2ed'];
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare, 
  Heart, 
  Share2, 
  Download, 
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Music2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';

export function MetricsDashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/accounts`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const totalReach = accounts.reduce((acc, curr) => acc + (curr.metrics?.reach || 0), 0);
  const totalFollowers = accounts.reduce((acc, curr) => acc + (curr.metrics?.followers || 0), 0);
  const avgEngagement = accounts.length > 0 
    ? (accounts.reduce((acc, curr) => acc + (curr.metrics?.engagement || 0), 0) / accounts.length).toFixed(1)
    : "0";
  
  // Create platform distribution data from real accounts
  const platformData = accounts.map((acc, index) => ({
    platform: acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
    engagement: acc.metrics?.engagement || 0,
    reach: acc.metrics?.reach || 0,
    followers: acc.metrics?.followers || 0,
    icon: acc.platform === 'instagram' ? Instagram : 
          acc.platform === 'facebook' ? Facebook : 
          acc.platform === 'twitter' ? Twitter : 
          acc.platform === 'linkedin' ? Linkedin : Music2
  }));

  // Mock historical data for now based on current stats since we don't have historical metrics collection yet
  const engagementData = [
    { name: 'Lun', reach: Math.floor(totalReach * 0.1) },
    { name: 'Mar', reach: Math.floor(totalReach * 0.12) },
    { name: 'Mie', reach: Math.floor(totalReach * 0.15) },
    { name: 'Jue', reach: Math.floor(totalReach * 0.18) },
    { name: 'Vie', reach: Math.floor(totalReach * 0.2) },
    { name: 'Sab', reach: Math.floor(totalReach * 0.15) },
    { name: 'Dom', reach: Math.floor(totalReach * 0.1) },
  ];

  const growthData = [
    { month: 'Mar', followers: Math.floor(totalFollowers * 0.8) },
    { month: 'Abr', followers: Math.floor(totalFollowers * 0.9) },
    { month: 'May', followers: totalFollowers },
  ];

  if (!loading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-[#fcfbf9] rounded-[32px] border border-[#e8e4e1] flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-[32px] border-2 border-[#b49b85] animate-ping opacity-10"></div>
          <AlertCircle className="w-10 h-10 text-[#b49b85]" />
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-black serif italic mb-4">Silencio Predictivo</h2>
          <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.3em] leading-relaxed">
            No hay ecos en el espectro. <br/>Vincule sus portales para comenzar a proyectar y medir su influencia.
          </p>
        </div>
        <Link 
          to="/accounts"
          className="h-14 px-12 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-3xl active:scale-95 flex items-center justify-center"
        >
          Sincronizar Portales →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div>
          <h1 className="text-4xl font-black serif tracking-tight mb-3">Espectro de Datos</h1>
          <div className="flex items-center gap-3">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              accounts.length > 0 ? "bg-green-500" : "bg-red-500"
            )}></span>
            <p className="text-[#b49b85] font-bold uppercase tracking-[0.2em] text-[10px] italic">
              Convergencia Activa en {accounts.length} {accounts.length === 1 ? 'Portal Digital' : 'Portales Digitales'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-[#f5f2ed] border border-[#e8e4e1] rounded-full p-1.5 shadow-inner">
            {['7d', '30d', '90d'].map((range) => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  timeRange === range ? "bg-white text-[#1a1a1a] shadow-xl" : "text-[#b49b85] hover:text-[#1a1a1a]"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="h-12 px-8 border-2 border-[#e8e4e1] bg-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-[#b49b85]/30 transition-all flex items-center gap-3 shadow-sm active:scale-95 text-[#1a1a1a]">
            <Download className="w-4 h-4 text-[#b49b85]" /> Exportar <span className="hidden sm:inline">Manifiesto</span>
          </button>
        </div>
      </header>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Eye, label: 'Resonancia Total', value: totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}k` : totalReach.toString(), trend: '+0%', isPositive: true, color: 'text-[#b49b85]' },
          { icon: Heart, label: 'Engagement Áureo', value: `${avgEngagement}%`, trend: '+0.4%', isPositive: true, color: 'text-[#e8e4e1]' },
          { icon: Users, label: 'Espectadores', value: totalFollowers > 1000 ? `${(totalFollowers / 1000).toFixed(1)}k` : totalFollowers.toString(), trend: '+0%', isPositive: true, color: 'text-[#b49b85]' },
          { icon: MessageSquare, label: 'Intercambios', value: Math.floor(totalReach * 0.05).toString(), trend: '+0%', isPositive: true, color: 'text-[#e8e4e1]' },
        ].map((stat, i) => (
          <div key={i} className="group relative p-10 rounded-[48px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02] hover:shadow-black/[0.05] transition-all duration-700">
            <div className={`w-14 h-14 bg-[#fcfbf9] border border-[#e8e4e1] rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <span className="text-[10px] font-black text-[#b49b85] uppercase tracking-[0.2em] italic">{stat.label}</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-4xl font-black serif tracking-tight text-[#1a1a1a]">{stat.value}</span>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                stat.isPositive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
              )}>
                {stat.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Engagement History Chart */}
        <div className="lg:col-span-8 p-12 rounded-[60px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02] overflow-hidden">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black serif italic tracking-tight mb-2 text-[#1a1a1a]">Fluctuación de Energía</h3>
              <p className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest italic">Interacciones detalladas por frecuencia temporal.</p>
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] ring-4 ring-[#1a1a1a]/5"></div>
                <span className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest">Primario</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#b49b85] ring-4 ring-[#b49b85]/5"></div>
                <span className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest">Secundario</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b49b85" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#b49b85" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#e8e4e1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#b49b85', fontWeight: 900, textAnchor: 'middle' }} 
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#b49b85', fontWeight: 900 }} 
                  dx={-20}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '32px', 
                    border: '1px solid #e8e4e1', 
                    boxShadow: '0 48px 96px -32px rgba(0, 0, 0, 0.15)',
                    padding: '24px',
                    fontFamily: 'inherit'
                  }}
                  itemStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reach" 
                  stroke="#1a1a1a" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLikes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Share / Distribution */}
        <div className="lg:col-span-4 p-12 rounded-[60px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02] flex flex-col">
          <h3 className="text-2xl font-black serif italic tracking-tight text-[#1a1a1a] mb-2 text-center">Peso del Canal</h3>
          <p className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest text-center mb-12 italic underline underline-offset-8 decoration-1 decoration-[#e8e4e1]">Cuota de Mercado Social</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={12}
                    dataKey="reach"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black serif italic">{avgEngagement}%</span>
                <span className="text-[9px] font-black text-[#b49b85] uppercase tracking-widest mt-1">Eficiencia</span>
              </div>
            </div>

            <div className="w-full space-y-6 mt-12 bg-[#fcfbf9] p-8 rounded-[32px] border border-[#e8e4e1]">
              {platformData.map((p, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-transparent group-hover:ring-offset-2 transition-all" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[10px] font-black text-[#6b6b6b] group-hover:text-[#1a1a1a] transition-all uppercase tracking-widest">{p.platform}</span>
                  </div>
                  <span className="text-[10px] font-black text-[#1a1a1a] serif italic">{((p.reach / totalReach) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Follower Growth Chart */}
        <div className="p-12 rounded-[60px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black serif italic tracking-tight text-[#1a1a1a]">Crecimiento de Audiencia</h3>
              <p className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest mt-2 italic">Trayectoria de seguidores totales acumulados.</p>
            </div>
            <div className="w-12 h-12 bg-[#fcfbf9] rounded-2xl flex items-center justify-center border border-[#e8e4e1]">
               <Users className="w-6 h-6 text-[#b49b85]" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#e8e4e1" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#b49b85', fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: '1px solid #e8e4e1', boxShadow: '0 20px 30px -10px rgba(0,0,0,0.05)' }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="followers" 
                  stroke="#1a1a1a" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#1a1a1a', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#b49b85' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reach Comparison by Platform */}
        <div className="p-12 rounded-[60px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black serif italic tracking-tight text-[#1a1a1a]">Benchmarking Alcance</h3>
              <p className="text-[10px] font-black text-[#b49b85] uppercase tracking-widest mt-2 italic">Comparativa de visibilidad por plataforma.</p>
            </div>
            <div className="w-12 h-12 bg-[#fcfbf9] rounded-2xl flex items-center justify-center border border-[#e8e4e1]">
               <Eye className="w-6 h-6 text-[#b49b85]" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#e8e4e1" opacity={0.5} />
                <XAxis 
                  dataKey="platform" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#b49b85', fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#fcfbf9' }}
                  contentStyle={{ borderRadius: '24px', border: '1px solid #e8e4e1', boxShadow: '0 20px 30px -10px rgba(0,0,0,0.05)' }}
                />
                <Bar 
                  dataKey="reach" 
                  radius={[20, 20, 0, 0]} 
                  barSize={32}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#1a1a1a" : "#b49b85"} fillOpacity={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
