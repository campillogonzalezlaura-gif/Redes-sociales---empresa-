import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter as TwitterIcon, 
  Music2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  MoreVertical,
  Trash2
} from 'lucide-react';

const PinterestLogo = ({ className }: { className?: string }) => (
  <span className={cn("font-serif font-black italic select-none leading-none", className, "flex items-center justify-center")}>
    <span className={className?.includes('w-8') ? 'text-4xl' : 'text-2xl'}>P</span>
  </span>
);
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'twitter', name: 'Twitter/X', icon: TwitterIcon, color: 'bg-black' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'bg-black' },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestLogo, color: 'bg-red-600' },
];

export function AccountManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [manualInputPlatform, setManualInputPlatform] = useState<any | null>(null);
  const [manualUsername, setManualUsername] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/accounts`));
    return onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/accounts`);
    });
  }, [user]);

  // Listen for OAuth success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
       if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
         return;
       }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { platform, code } = event.data;
        completeConnection(platform, code);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const completeConnection = async (platform: string, username?: string) => {
    if (!user) return;
    try {
      // Simulate fetching followers/reach from the newly connected account
      const mockReach = Math.floor(Math.random() * 5000) + 1000;
      const mockEngagement = Math.floor(Math.random() * 5) + 2; // 2-7%
      
      await addDoc(collection(db, `users/${user.uid}/accounts`), {
        platform,
        username: username || `${user.displayName?.toLowerCase().replace(' ', '_')}_${platform}`,
        displayName: user.displayName,
        profileImageUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}`,
        status: 'active',
        connectedAt: new Date().toISOString(),
        authCode: 'manual',
        metrics: {
          followers: mockReach,
          reach: mockReach * 2,
          engagement: mockEngagement,
        }
      });
      setManualInputPlatform(null);
      setManualUsername('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/accounts`);
    } finally {
      setIsConnecting(null);
    }
  };

  const connectAccount = async (platform: any) => {
    if (!user) return;
    setManualInputPlatform(platform);
  };

  const disconnectAccount = async (accountId: string) => {
    if (!user) return;
    if (!confirm('¿Estás seguro de que quieres desconectar esta cuenta?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/accounts`, accountId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/accounts/${accountId}`);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header>
        <h1 className="text-4xl font-black serif tracking-tight mb-3">Portales Conectados</h1>
        <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em] italic underline underline-offset-8 decoration-1 decoration-[#e8e4e1]">Administración de Esencias Digitales Multi-Canal</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {platforms.map((platform) => {
          const connected = accounts.find(a => a.platform === platform.id);
          const connecting = isConnecting === platform.id;

          return (
            <div 
              key={platform.id}
              className={cn(
                "p-10 rounded-[48px] border transition-all relative overflow-hidden group shadow-2xl shadow-black/[0.02] bg-white hover:shadow-black/[0.05]",
                connected ? "border-[#e8e4e1]" : "border-[#e8e4e1] border-dashed bg-[#fcfbf9]/50"
              )}
            >
              <div className="flex items-start justify-between mb-10">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10", platform.color)}>
                   {/* @ts-ignore */}
                  <platform.icon className="w-8 h-8" />
                </div>
                {connected && (
                  <button 
                    onClick={() => disconnectAccount(connected.id)}
                    className="p-3 text-[#b49b85] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="font-black text-2xl mb-2 tracking-tight serif italic text-[#1a1a1a]">{platform.name}</h3>
              
              {connected ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-[#fcfbf9] rounded-[24px] border border-[#e8e4e1]">
                    <img src={connected.profileImageUrl} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-xl" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-widest truncate">@{connected.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                         <span className="text-[9px] font-bold text-[#b49b85] uppercase tracking-[0.2em] italic">Transmisión Activa</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-[#b49b85] font-black uppercase tracking-[0.2em] italic ml-1">
                    Establecido • {new Date(connected.connectedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#6b6b6b] mb-10 leading-relaxed font-bold uppercase tracking-widest italic opacity-60">Establece tu portal de {platform.name} para trascender el contenido analógico.</p>
              )}

              <div className="mt-10">
                {connected ? (
                  <button className="w-full h-12 bg-white text-[#1a1a1a] border-2 border-[#e8e4e1] rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#b49b85] transition-all flex items-center justify-center gap-3 group">
                    Gestionar Esencia <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <button 
                    onClick={() => connectAccount(platform)}
                    disabled={!!isConnecting}
                    className="w-full h-14 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-3xl shadow-black/10"
                  >
                    {connecting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Plus className="w-4 h-4 text-[#b49b85]" /> Conectar ID</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {manualInputPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualInputPlatform(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", manualInputPlatform.color)}>
                    <manualInputPlatform.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111827]">{manualInputPlatform.name}</h3>
                    <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-widest leading-none mt-1">Identidad Digital</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-2">ID de Usuario / Username</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="tu_cuenta"
                        value={manualUsername}
                        onChange={(e) => setManualUsername(e.target.value)}
                        className="w-full h-14 pl-10 pr-5 bg-[#fcfbf9] border border-[#e8e4e1] rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#b49b85] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setManualInputPlatform(null)}
                    className="flex-1 h-12 border border-[#e8e4e1] rounded-full text-[9px] font-black uppercase tracking-widest text-[#6b6b6b] hover:bg-gray-50 transition-all"
                  >
                    Cerrar
                  </button>
                  <button 
                    onClick={() => completeConnection(manualInputPlatform.id, manualUsername)}
                    disabled={!manualUsername}
                    className="flex-[2] h-12 bg-[#1a1a1a] text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                  >
                    Vincular Portal →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
