import { 
  Sparkles, 
  Send, 
  Calendar as CalendarIcon, 
  Image as ImageIcon, 
  Type,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Music2,
  Trash2,
  Share2,
  Plus,
  X,
  Clock,
  Check,
  Heart,
  MessageSquare,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { generateSocialContent, generateAIVisual, AISuggestion } from '../../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-black' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'text-black' },
];

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  file: File;
}

export function ContentCreator() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/accounts`));
    return onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/accounts`);
    });
  }, [user]);

  const totalReach = accounts.reduce((acc, curr) => acc + (curr.metrics?.reach || 0), 0);
  const avgEngagement = accounts.length > 0 
    ? (accounts.reduce((acc, curr) => acc + (curr.metrics?.engagement || 0), 0) / accounts.length).toFixed(1)
    : "0";

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
  
  // Media Upload State
  const [media, setMedia] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scheduling State
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setIsGeneratingImage(true);
    setAiSuggestions(null);
    
    // Generate Text and Image in parallel
    const textPromise = generateSocialContent(topic, selectedPlatforms[0] || 'all platforms')
      .then(suggestion => {
        setAiSuggestions(suggestion);
        if (!content.trim()) {
          setContent(suggestion.copy);
        }
      })
      .catch(error => {
        console.error("AI Text Error:", error);
        setAiSuggestions({
          title: "Dermaestetic: La Elegancia de la Ciencia",
          copy: "Descubre la convergencia entre la innovación dermatológica y el bienestar absoluto. Nuestra nueva línea redefine el concepto de medicina estética con resultados que trascienden el tiempo.\n\nExperimenta el protocolo Dermaestetic.",
          hashtags: ["Dermaestetic", "LuxurySkincare", "EstéticaAvanzada", "BellezaConCiencia", "OmniSocial"]
        });
      });

    const imagePromise = generateAIVisual(topic)
      .then(imageUrl => {
        const newMedia: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          url: imageUrl,
          type: 'image',
          file: new File([], 'ai-generated.png', { type: 'image/png' })
        };
        setMedia(prev => [newMedia, ...prev]);
      })
      .catch(error => {
        console.error("AI Image Error:", error);
      })
      .finally(() => {
        setIsGeneratingImage(false);
      });

    await Promise.allSettled([textPromise, imagePromise]);
    setIsGenerating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: MediaFile[] = (Array.from(files) as File[]).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      type: (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
      file
    }));

    setMedia(prev => [...prev, ...newMedia]);
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const [previewPlatform, setPreviewPlatform] = useState('instagram');

  const getPreviewIcon = () => {
    const p = platforms.find(p => p.id === previewPlatform);
    return p ? p.icon : Instagram;
  };

  const handleNext = () => {
    const currentIndex = platforms.findIndex(p => p.id === previewPlatform);
    const nextIndex = (currentIndex + 1) % platforms.length;
    setPreviewPlatform(platforms[nextIndex].id);
  };

  const handlePublishNow = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/posts`), {
        content,
        topic,
        platforms: selectedPlatforms,
        status: 'published',
        createdAt: new Date().toISOString(),
        media: media.map(m => ({ type: m.type, url: m.url }))
      });
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/posts`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!user || !scheduleDate || !scheduleTime) {
      alert('Por favor selecciona fecha y hora');
      return;
    }
    setIsGenerating(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/posts`), {
        content,
        topic,
        platforms: selectedPlatforms,
        status: 'scheduled',
        scheduledFor: `${scheduleDate}T${scheduleTime}`,
        createdAt: new Date().toISOString(),
        media: media.map(m => ({ type: m.type, url: m.url }))
      });
      setIsScheduling(false);
      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/posts`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-2 border-[#b49b85] animate-ping opacity-20"></div>
          <Check className="w-10 h-10 text-[#b49b85]" />
        </div>
        <div>
          <h2 className="text-4xl font-black serif italic mb-4">Manifestación Completada</h2>
          <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
            Tu mensaje ha sido cifrado y proyectado a través de los portales seleccionados con éxito.
          </p>
        </div>
        <button 
          onClick={() => setIsSuccess(false)}
          className="h-14 px-12 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-3xl active:scale-95"
        >
          Crear Nueva Revelación
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-8">
        {/* Campaign Input */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em]">Entrada de Campaña</h2>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest italic">Omni-Insight Engine</span>
             </div>
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Concepto artesanal de tu campaña..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-16 px-6 bg-white border border-[#e8e4e1] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#b49b85] focus:border-[#b49b85] transition-all shadow-sm text-sm font-medium"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className="absolute right-3 top-3 h-10 px-6 min-w-[140px] bg-[#b49b85] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#a38a74] disabled:bg-gray-100 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#b49b85]/20 active:scale-95"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Creando...</span>
                </div>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Crear con IA</>
              )}
            </button>
          </div>
        </section>

        {/* Master Editor */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em]">Narrativa Maestra</h2>
              <button 
                onClick={() => setContent('')} 
                className="flex items-center gap-2 p-2 rounded-xl bg-[#fcfbf9] border border-[#e8e4e1] text-[#b49b85] hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all text-[9px] font-black uppercase tracking-widest group"
                title="Limpiar contenido"
              >
                <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                Limpiar
              </button>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#b49b85]">
               <span className="opacity-50">LETRAS: {content.length}</span>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe la esencia de tu historia..."
              className="w-full h-96 p-8 bg-white border border-[#e8e4e1] rounded-[40px] focus:outline-none focus:ring-1 focus:ring-[#b49b85] focus:border-[#b49b85] resize-none transition-all shadow-xl shadow-black/[0.02] text-sm leading-relaxed serif italic text-[#1a1a1a]"
            />
            
            {/* Media Gallery in Editor */}
            {media.length > 0 && (
              <div className="absolute bottom-28 left-8 right-8 flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
                {media.map((m) => (
                  <div key={m.id} className="relative group flex-shrink-0 animate-in fade-in slide-in-from-bottom-2">
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-24 h-24 rounded-2xl object-cover border border-[#e8e4e1] shadow-xl" alt="" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-[#1a1a1a] flex items-center justify-center border border-[#e8e4e1] shadow-xl">
                        <Music2 className="text-[#b49b85] w-8 h-8" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeMedia(m.id)}
                      className="absolute -top-2 -right-2 bg-white shadow-xl rounded-full p-1.5 hover:scale-110 transition-transform"
                    >
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="absolute bottom-8 right-8 flex gap-3">
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-6 py-3 bg-[#fcfbf9] border border-[#e8e4e1] rounded-2xl hover:bg-white transition-all text-[#b49b85] text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md"
               >
                  <ImageIcon className="w-4 h-4" />
                  Archivo Visual
               </button>
               <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
               />
            </div>
          </div>
        </section>

        {/* Platforms & Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="flex flex-col">
            <h2 className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em] mb-4">Canales de Curación</h2>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all text-[10px] font-bold uppercase tracking-widest flex-1 min-w-[120px] justify-center",
                    selectedPlatforms.includes(p.id)
                      ? "border-[#b49b85] bg-[#b49b85] text-white shadow-xl shadow-[#b49b85]/20"
                      : "border-[#e8e4e1] bg-white text-[#6b6b6b] hover:border-[#b49b85]/30 hover:text-[#1a1a1a]"
                  )}
                >
                  <p.icon className="w-3.5 h-3.5" />
                  {p.name}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col">
            <h2 className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em] mb-4">Programación Temporal</h2>
            <div className="flex-1">
              <button 
                onClick={() => setIsScheduling(!isScheduling)}
                className={cn(
                  "w-full h-14 flex items-center justify-between px-6 rounded-2xl border-2 transition-all text-[10px] font-bold uppercase tracking-widest",
                  isScheduling ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-xl shadow-black/10" : "bg-white border-[#e8e4e1] text-[#6b6b6b] shadow-sm hover:border-[#b49b85]/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4" />
                  {isScheduling ? "Ajustando Horizonte" : "Emisión Instantánea"}
                </div>
                {isScheduling && <Clock className="w-4 h-4 animate-pulse text-[#b49b85]" />}
              </button>
              
              <AnimatePresence>
                {isScheduling && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="date" 
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-2 border-[#e8e4e1] focus:border-[#b49b85] outline-none text-[10px] font-bold uppercase tracking-widest bg-white transition-all"
                      />
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-2 border-[#e8e4e1] focus:border-[#b49b85] outline-none text-[10px] font-bold uppercase tracking-widest bg-white transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Global Action Bar */}
        {accounts.length === 0 ? (
          <div className="bg-[#fcfbf9] border border-[#e8e4e1] border-dashed rounded-[40px] px-8 py-6 flex items-center justify-between group hover:border-[#b49b85]/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#e8e4e1] flex items-center justify-center shadow-sm">
                <AlertCircle className="w-6 h-6 text-[#b49b85]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-widest">Sin Portales Sincronizados</p>
                <p className="text-[9px] font-bold text-[#b49b85] uppercase tracking-widest italic mt-0.5">Vincule sus cuentas para calibrar la Alquimia de Datos</p>
              </div>
            </div>
            <Link 
              to="/accounts" 
              className="h-10 px-6 bg-[#1a1a1a] text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
            >
              Vincular Ahora →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center bg-white border border-[#e8e4e1] rounded-[40px] px-8 py-6 gap-8 shadow-2xl shadow-black/[0.03]">
             <div className="flex flex-col min-w-[100px]">
               <span className="text-[9px] font-bold text-[#b49b85] uppercase tracking-[0.2em] mb-1 whitespace-nowrap">Alcance Distinguido</span>
               <span className="text-2xl font-black serif tracking-tight">
                 {totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}k` : totalReach.toString()}
               </span>
             </div>
             <div className="flex flex-col min-w-[150px] flex-1">
               <span className="text-[9px] font-bold text-[#b49b85] uppercase tracking-[0.2em] mb-1">Elegancia Algorítmica</span>
               <div className="flex items-center space-x-3">
                 <span className="text-2xl font-black serif text-[#b49b85]">{avgEngagement}%</span>
                 <div className="flex-1 h-1.5 bg-[#f5f2ed] rounded-full overflow-hidden max-w-[120px]">
                   <div style={{ width: `${avgEngagement}%` }} className="h-full bg-[#1a1a1a] rounded-full"></div>
                 </div>
               </div>
             </div>
             <div className="w-full sm:w-auto ml-auto">
                {isScheduling ? (
                  <button 
                    onClick={handleSchedule}
                    className="w-full sm:w-auto h-14 px-10 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-black/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Preservar en el Tiempo
                  </button>
                ) : (
                  <button 
                    onClick={handlePublishNow}
                    className="w-full sm:w-auto h-14 px-10 bg-[#b49b85] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#a38a74] transition-all shadow-2xl shadow-[#b49b85]/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Send className="w-4 h-4" />
                    Manifestar Ahora
                  </button>
                )}
             </div>
          </div>
        )}

      </div>

      <div className="lg:col-span-5 flex flex-col space-y-10 h-full">
        {/* Realistic Mobile Preview */}
        <div className="bg-[#f5f2ed]/50 p-6 sm:p-10 rounded-[60px] border-2 border-white flex-1 flex flex-col items-center sticky top-10 shadow-inner">
          <div className="w-full flex items-center justify-between mb-10 overflow-x-auto no-scrollbar">
            <div className="flex space-x-8 border-b border-[#e8e4e1]/50 flex-1">
              {platforms.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setPreviewPlatform(p.id)}
                  className={cn(
                    "pb-4 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap",
                    previewPlatform === p.id ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#b49b85] hover:text-[#1a1a1a]"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={previewPlatform}
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 100 }}
              className="w-full max-w-[340px] bg-white rounded-[50px] shadow-[0_45px_100px_rgba(0,0,0,0.15)] overflow-hidden border-[8px] border-[#1a1a1a] relative"
            >
              {/* Speaker/Notch area */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-start pt-2">
                <div className="w-16 h-1 bg-gray-100 rounded-full"></div>
              </div>

              <div className="pt-6">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#fcfbf9] border border-[#e8e4e1] p-[2px] shadow-sm">
                      <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-[7px] font-black text-white uppercase tracking-tighter">DERMA</div>
                    </div>
                    <div>
                      <p className="text-[11px] font-black tracking-tight text-[#1a1a1a]">dermaestetic</p>
                      <p className="text-[9px] text-[#b49b85] font-bold uppercase tracking-widest italic">Aesthetic Vision</p>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-[#e8e4e1]" />
                </div>

                {/* Media */}
                <div className={cn(
                  "bg-gray-50 flex items-center justify-center text-gray-200 relative group/preview overflow-hidden",
                  previewPlatform === 'tiktok' ? "aspect-[9/16]" : "aspect-square"
                )}>
                  {media.length > 0 ? (
                    <div className="w-full h-full">
                      {media[0].type === 'image' ? (
                        <img src={media[0].url} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/preview:scale-110" alt="" />
                      ) : (
                        <video src={media[0].url} className="w-full h-full object-cover" controls />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-700"></div>

                      {media.length > 1 && (
                        <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-xl text-white text-[9px] px-3 py-1.5 rounded-full font-black tracking-widest border border-white/20">
                          {media.length} ELEMENTOS
                        </div>
                      )}
                    </div>
                  ) : isGeneratingImage ? (
                    <div className="flex flex-col items-center gap-6 animate-pulse">
                        <div className="w-20 h-20 rounded-full border-4 border-t-[#b49b85] border-transparent animate-spin"></div>
                        <div className="space-y-2 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b49b85]">Manifestando Imagen</p>
                          <p className="text-[8px] font-bold text-[#b49b85]/40 uppercase tracking-widest italic">Axioma Visual en Progreso...</p>
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Share2 className="w-16 h-16 stroke-[0.2px] text-[#b49b85]/30 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#b49b85]/50">Curación Visual</span>
                    </div>
                  )}
                  
                  {previewPlatform === 'tiktok' && (
                    <div className="absolute bottom-6 right-6 flex flex-col gap-6 scale-90">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl"><Heart className="w-6 h-6 text-white" /></div>
                        <span className="text-[10px] text-white font-bold mt-1 shadow-sm">1.2k</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl"><MessageSquare className="w-6 h-6 text-white" /></div>
                        <span className="text-[10px] text-white font-bold mt-1 shadow-sm">48</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl"><Share2 className="w-6 h-6 text-white" /></div>
                        <span className="text-[10px] text-white font-bold mt-1 shadow-sm">340</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactions */}
                <div className="p-6">
                  {previewPlatform !== 'tiktok' && (
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex space-x-6">
                        <button className="hover:scale-110 transition-transform"><Heart className="w-6 h-6 text-[#1a1a1a] stroke-[1.5px]" /></button>
                        <button className="hover:scale-110 transition-transform"><MessageSquare className="w-6 h-6 text-[#1a1a1a] stroke-[1.5px]" /></button>
                        <button className="hover:scale-110 transition-transform"><Send className="w-6 h-6 text-[#1a1a1a] stroke-[1.5px]" /></button>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#b49b85] shadow-[0_0_10px_rgba(180,155,133,0.5)]"></div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <p className="text-[12px] leading-[1.6] text-[#1a1a1a] serif italic">
                      <span className="font-black not-italic mr-3 text-sm tracking-tight">dermaestetic</span> 
                      {content || 'Escribe para visualizar la esencia de tu narrativa en tiempo real...'}
                    </p>
                    {aiSuggestions?.hashtags && (
                      <p className="text-[10px] text-[#b49b85] font-black uppercase tracking-widest flex flex-wrap gap-2">
                        {aiSuggestions.hashtags.map(t => <span key={t} className="hover:text-[#1a1a1a] cursor-pointer transition-colors">#{t}</span>)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* AI Insight Card */}
        {aiSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 bg-[#1a1a1a] text-[#fcfbf9] rounded-[48px] shadow-3xl relative overflow-hidden group border border-white/10"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-[#b49b85] font-black mb-8 text-[10px] uppercase tracking-[0.3em]">
                <Sparkles className="w-4 h-4" /> Axioma Estratégico IA
              </div>
              <div className="space-y-8">
                <div>
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] display-block mb-2">Composición Recomendada</span>
                  <p className="text-2xl font-black serif italic tracking-tight">{aiSuggestions.title}</p>
                </div>
                <button 
                  onClick={() => setContent(aiSuggestions.copy)}
                  className="w-full h-14 bg-[#b49b85] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#a38a74] transition-all shadow-2xl shadow-black/40 active:scale-95"
                >
                  Adoptar Visión
                </button>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-[150px] font-black serif italic transition-transform duration-1000 group-hover:scale-110 pointer-events-none">DERMA</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
