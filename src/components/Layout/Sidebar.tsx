import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfbf9] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Elegante Top Header */}
      <header className="h-20 border-b border-[#e8e4e1] px-10 flex items-center justify-between flex-shrink-0 bg-white/50 backdrop-blur-md sticky top-0 z-10 w-full">
        {/* Marca a la izquierda */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-black tracking-tighter serif text-[#1a1a1a]">Dermaestetic</h2>
          <p className="text-[9px] font-bold text-[#b49b85] uppercase tracking-[0.4em] leading-none mt-1">Social Protocol</p>
        </div>

        {/* Perfil a la derecha */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-[#e8e4e1] shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#f5f2ed] border border-[#e8e4e1] flex items-center justify-center text-[#b49b85] text-xs font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-[#1a1a1a] leading-tight">{user?.displayName || 'Usuario'}</p>
              <p className="text-[9px] text-[#b49b85] font-black uppercase tracking-widest leading-none mt-0.5">Plan Prestige</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-transparent to-[#f5f2ed]/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
