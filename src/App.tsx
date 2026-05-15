import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { BarChart3, Share2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Sidebar';
import { ContentCreator } from './components/Composer/ContentCreator';
import { AccountManager } from './components/Accounts/AccountManager';
import { MetricsDashboard } from './components/Analytics/MetricsDashboard';
import { ScheduleView } from './components/Calendar/ScheduleView';
import { cn } from './lib/utils';
import { db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

// Page Components
function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Accounts subscription
    const qAcc = query(collection(db, `users/${user.uid}/accounts`));
    const unsubAcc = onSnapshot(qAcc, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => doc.data()));
    });

    // Posts subscription
    const qPosts = query(collection(db, `users/${user.uid}/posts`));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPostsCount(snapshot.size);
    });

    // Campaigns subscription
    const qCampaigns = query(collection(db, `users/${user.uid}/campaigns`));
    const unsubCampaigns = onSnapshot(qCampaigns, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAcc();
      unsubPosts();
      unsubCampaigns();
    };
  }, [user]);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim() || !startDate || !endDate || !user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/campaigns`), {
        name: newCampaignName,
        startDate,
        endDate,
        status: 'active',
        createdAt: new Date().toISOString(),
        projections: 0
      });
      setNewCampaignName('');
      setStartDate('');
      setEndDate('');
      setIsCreatingCampaign(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const totalReach = accounts.reduce((acc, curr) => acc + (curr.metrics?.reach || 0), 0);
  const avgEngagement = accounts.length > 0 
    ? (accounts.reduce((acc, curr) => acc + (curr.metrics?.engagement || 0), 0) / accounts.length).toFixed(1)
    : "0";

  const stats = [
    { label: 'Alcance Combinado', value: totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}k` : totalReach.toString(), trend: '+0%', icon: BarChart3 },
    { label: 'Portales conectados', value: accounts.length.toString(), trend: '0%', icon: Share2 },
    { label: 'Manifestaciones', value: postsCount.toString(), trend: '0%', icon: Sparkles },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 serif">Vista de Horizonte</h1>
          <p className="text-[#6b6b6b] font-bold uppercase tracking-widest text-[10px]">Monitoriza tu esencia digital en tiempo real.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 p-1 bg-[#f5f2ed] rounded-full border border-[#e8e4e1]">
          <button className="px-4 py-1.5 bg-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">Hoy</button>
          <button className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b]">Semana</button>
          <button className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6b6b6b]">Mes</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-8 rounded-[32px] border border-[#e8e4e1] bg-white shadow-2xl shadow-black/[0.02] hover:shadow-black/[0.05] transition-all cursor-default group overflow-hidden relative">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em]">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-[#e8e4e1] group-hover:text-[#b49b85] transition-colors" />
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-black serif">{stat.value}</span>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                stat.trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-gray-50 text-[#6b6b6b]"
              )}>{stat.trend}</span>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] scale-150 group-hover:scale-125 transition-transform duration-1000">
               <stat.icon className="w-24 h-24" />
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="p-12 rounded-[48px] border-2 border-dashed border-[#e8e4e1] bg-[#fcfbf9]/50 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl border border-[#e8e4e1] flex items-center justify-center shadow-xl">
             <Share2 className="w-10 h-10 text-[#b49b85] animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black serif italic tracking-tight text-[#1a1a1a] mb-2">Umbral de Sincronización</h3>
            <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Para revelar las emanaciones de su marca y calibrar los ecos sociales, primero debe establecer contacto con sus portales digitales.
            </p>
          </div>
          <Link 
            to="/accounts" 
            className="h-14 px-12 bg-[#1a1a1a] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-3xl shadow-black/10 active:scale-95 flex items-center gap-3"
          >
            Vincular Cuentas Ahora →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="p-10 border border-[#e8e4e1] rounded-[48px] bg-white shadow-2xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-xl serif italic">Campañas en Curso</h3>
            <button 
              onClick={() => setIsCreatingCampaign(true)}
              className="text-[10px] font-black uppercase tracking-widest text-[#b49b85] hover:text-[#1a1a1a] transition-all group flex items-center gap-2"
            >
              Nueva Campaña <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          <AnimatePresence>
            {isCreatingCampaign && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-6 bg-[#fcfbf9] rounded-3xl border border-[#e8e4e1] space-y-4"
              >
                <input 
                  autoFocus
                  placeholder="Nombre de la Campaña..."
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full bg-white border border-[#e8e4e1] rounded-2xl h-12 px-5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#b49b85] transition-all"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#b49b85] ml-2">Inicio</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-[#e8e4e1] rounded-2xl h-10 px-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#b49b85] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#b49b85] ml-2">Final</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-[#e8e4e1] rounded-2xl h-10 px-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#b49b85] transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCreateCampaign}
                    className="flex-1 h-10 bg-[#1a1a1a] text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Establecer Protocolo
                  </button>
                  <button 
                    onClick={() => setIsCreatingCampaign(false)}
                    className="px-6 h-10 border border-[#e8e4e1] text-[#6b6b6b] rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Anular
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <div className="py-12 text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="opacity-40 space-y-4">
                  <BarChart3 className="w-12 h-12 mx-auto stroke-[0.5px]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No hay campañas activas en este ciclo</p>
                </div>
                {!isCreatingCampaign && (
                  <button 
                    onClick={() => setIsCreatingCampaign(true)}
                    className="mx-auto h-12 px-8 bg-[#b49b85] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#a38a74] transition-all shadow-xl shadow-[#b49b85]/20 flex items-center gap-3 active:scale-95"
                  >
                    Crear campaña <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center gap-6 p-5 hover:bg-[#fcfbf9] rounded-[24px] border border-transparent hover:border-[#e8e4e1] transition-all cursor-pointer group">
                    <div className="w-14 h-14 bg-[#fcfbf9] rounded-2xl flex items-center justify-center border border-[#e8e4e1] group-hover:bg-white transition-all">
                       <ImageIcon className="w-6 h-6 text-[#b49b85] opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm tracking-tight text-[#1a1a1a]">{campaign.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-widest italic">
                          {campaign.status === 'active' ? 'En Progreso' : 'Finalizada'} • {campaign.projections || 0} Emanaciones
                        </p>
                        {campaign.startDate && campaign.endDate && (
                          <>
                            <span className="text-[#e8e4e1]">•</span>
                            <p className="text-[9px] font-black text-[#6b6b6b] uppercase tracking-tighter">
                              {campaign.startDate} — {campaign.endDate}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-[#1a1a1a] serif italic">
                      98%
                    </div>
                  </div>
                ))}
                {!isCreatingCampaign && (
                  <button 
                    onClick={() => setIsCreatingCampaign(true)}
                    className="w-full mt-4 h-12 border-2 border-dashed border-[#e8e4e1] rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#b49b85] hover:border-[#b49b85]/30 hover:text-[#1a1a1a] transition-all flex items-center justify-center gap-2"
                  >
                    + Agregar nueva campaña
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="p-10 border border-white/10 rounded-[48px] bg-[#1a1a1a] text-[#fcfbf9] overflow-hidden relative group shadow-3xl">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-[#b49b85]" />
            </div>
            <h3 className="text-2xl font-black mb-3 serif italic tracking-tight">Alquimia de Contenido</h3>
            <p className="text-[#6b6b6b] text-sm mb-10 max-w-[280px] leading-relaxed font-bold uppercase tracking-widest text-[10px]">Deja que nuestra inteligencia refine tu mensaje y lo proyecte al infinito.</p>
            <Link 
              to="/composer"
              className="h-12 px-8 bg-[#b49b85] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-[#b49b85]/30 hover:bg-[#a38a74] transition-all active:scale-95 inline-flex items-center justify-center"
            >
              Comenzar Curación
            </Link>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] grayscale transition-all duration-[2000ms] group-hover:opacity-[0.05] group-hover:grayscale-0 pointer-events-none scale-150">
            <div className="text-[200px] font-black serif italic select-none">AI</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Login() {
  const { user, signIn } = useAuth();
  
  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9]">
      <div className="p-16 bg-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] rounded-[60px] border border-[#e8e4e1] max-w-md w-full text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#b49b85] to-transparent"></div>
        
        <div className="mb-12">
          <h2 className="text-4xl font-black serif tracking-tighter text-[#1a1a1a]">Dermaestetic</h2>
          <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.3em] mt-2 underline underline-offset-8">Social Protocol</p>
        </div>

        <p className="text-[#6b6b6b] mb-12 leading-relaxed text-sm italic serif">Eleva tu presencia digital con la convergencia de la estética y la inteligencia artificial.</p>
        
        <button
          onClick={() => signIn()}
          className="w-full h-14 bg-[#1a1a1a] text-white rounded-full font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-3xl shadow-black/20 active:scale-95 mb-8"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 brightness-0 invert opacity-40 group-hover:opacity-100 transition-opacity" />
          Acceder al Santuario
        </button>
        
        <div className="flex items-center justify-center gap-3">
           <div className="w-8 h-px bg-[#e8e4e1]"></div>
           <p className="text-[9px] text-[#b49b85] uppercase tracking-widest font-black">Cifrado de Alto Nivel</p>
           <div className="w-8 h-px bg-[#e8e4e1]"></div>
        </div>

        <div className="absolute -bottom-20 -right-20 opacity-[0.02] text-[200px] font-black serif select-none rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-[3000ms]">DERMA</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/composer" element={<ProtectedRoute><ContentCreator /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><ScheduleView /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AccountManager /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><MetricsDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


