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
  Trash2,
  Gamepad2 as Pinterest
} from 'lucide-react';
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
  { id: 'pinterest', name: 'Pinterest', icon: Pinterest, color: 'bg-red-600' },
];

export function AccountManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

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

  const completeConnection = async (platform: string, code: string) => {
    if (!user) return;
    try {
      // Simulate fetching followers/reach from the newly connected account
      const mockReach = Math.floor(Math.random() * 5000) + 1000;
      const mockEngagement = Math.floor(Math.random() * 5) + 2; // 2-7%
      
      await addDoc(collection(db, `users/${user.uid}/accounts`), {
        platform,
        username: `${user.displayName?.toLowerCase().replace(' ', '_')}_${platform}`,
        displayName: user.displayName,
        profileImageUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}`,
        status: 'active',
        connectedAt: new Date().toISOString(),
        authCode: code,
        metrics: {
          followers: mockReach,
          reach: mockReach * 2,
          engagement: mockEngagement,
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/accounts`);
    } finally {
      setIsConnecting(null);
    }
  };

  const connectAccount = async (platform: string) => {
    if (!user) return;
    setIsConnecting(platform);
    
    try {
      const response = await fetch(`/api/auth/${platform}`);
      if (!response.ok) throw new Error('Error al obtener URL de autenticación');
      const data = await response.json();

      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      const authWindow = window.open(
        data.url,
        'oauth_popup',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!authWindow) {
        alert('Por favor, permite los popups para conectar tu cuenta.');
        setIsConnecting(null);
      }
    } catch (error) {
      console.error(error);
      setIsConnecting(null);
    }
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
                <p className="text-[11px] text-[#6b6b6b] mb-10 leading-relaxed font-bold uppercase tracking-widest italic opacity-60">Sincroniza tu portal de {platform.name} para trascender el contenido analógico.</p>
              )}

              <div className="mt-10">
                {connected ? (
                  <button className="w-full h-12 bg-white text-[#1a1a1a] border-2 border-[#e8e4e1] rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#b49b85] transition-all flex items-center justify-center gap-3 group">
                    Gestionar Esencia <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <button 
                    onClick={() => connectAccount(platform.id)}
                    disabled={!!isConnecting}
                    className="w-full h-14 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-3xl shadow-black/10"
                  >
                    {connecting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Plus className="w-4 h-4 text-[#b49b85]" /> Sincronizar Portal</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
