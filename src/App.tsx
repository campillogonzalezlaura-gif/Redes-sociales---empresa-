import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Sidebar';
import { ContentCreator } from './components/Composer/ContentCreator';

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
          <Route path="/" element={<ProtectedRoute><ContentCreator /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


