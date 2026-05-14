import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  Calendar, 
  Share2, 
  BarChart3, 
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { logout, user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Panel', path: '/' },
    { icon: PenTool, label: 'Editor', path: '/composer' },
    { icon: Calendar, label: 'Calendario', path: '/calendar' },
    { icon: Share2, label: 'Cuentas', path: '/accounts' },
    { icon: BarChart3, label: 'Métricas', path: '/analytics' },
  ];

  return (
    <aside className="w-64 bg-[#fcfbf9] border-r border-[#e8e4e1] flex flex-col h-screen overflow-hidden">
      <div className="p-8">
        <div className="mb-12">
          <h2 className="text-3xl font-black tracking-tighter serif text-[#1a1a1a]">Dermaestetic</h2>
          <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.4em] mt-1 italic">Social Protocol</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest",
                isActive 
                  ? "bg-[#b49b85] text-white shadow-xl shadow-[#b49b85]/20" 
                  : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#b49b85]/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#b49b85]")} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-[#e8e4e1] bg-white/50">
        <div className="flex items-center space-x-3 p-3 mb-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#f5f2ed] border border-[#e8e4e1] flex items-center justify-center text-[#b49b85] text-sm font-bold">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-[#1a1a1a]">{user?.displayName || 'Usuario'}</p>
            <p className="text-[10px] text-[#b49b85] font-bold uppercase tracking-widest">Plan Prestige</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center space-x-3 w-full px-4 py-3 text-[10px] font-bold text-[#6b6b6b] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 opacity-70" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#fcfbf9] text-[#1a1a1a] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-[#e8e4e1] px-10 flex items-center justify-between flex-shrink-0 bg-white/30 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-xl serif font-bold tracking-tight text-[#1a1a1a]">Dermaestetic Dashboard</h1>
          <div className="flex items-center space-x-6">
            <button className="text-[10px] text-[#6b6b6b] hover:text-[#1a1a1a] font-bold uppercase tracking-widest transition-all">Guardar Borrador</button>
            <button className="h-10 px-6 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:shadow-black/10 transition-all hover:scale-[1.02] active:scale-95">
              Sincronización Global
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-transparent to-[#f5f2ed]/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
