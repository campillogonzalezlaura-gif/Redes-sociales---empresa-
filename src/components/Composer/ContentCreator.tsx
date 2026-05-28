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
import { generateSocialContent, generateAIVisual, generateHashtagsForImage, AISuggestion } from '../../services/aiService';
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
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // Media Upload State
  const [media, setMedia] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [isSuccess, setIsSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setIsGeneratingImage(true);
    setAiSuggestions(null);
    setHashtags([]);
    
    // Generate Text and Image in parallel
    const textPromise = generateSocialContent(topic, selectedPlatforms[0] || 'all platforms')
      .then(suggestion => {
        setAiSuggestions(suggestion);
        if (suggestion.hashtags) {
          setHashtags(suggestion.hashtags);
        }
        if (!content.trim()) {
          setContent(suggestion.copy);
        }
      })
      .catch(error => {
        console.error("AI Text Error:", error);
        const fallback = {
          title: "Dermaestetic: La Elegancia de la Ciencia",
          copy: "Descubre la convergencia entre la innovación dermatológica y el bienestar absoluto. Nuestra nueva línea redefine el concepto de medicina estética con resultados que trascienden el tiempo.\n\nExperimenta el protocolo Dermaestetic.",
          hashtags: ["Dermaestetic", "LuxurySkincare", "EstéticaAvanzada", "BellezaConCiencia", "OmniSocial"]
        };
        setAiSuggestions(fallback);
        setHashtags(fallback.hashtags);
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
    <div className="max-w-3xl mx-auto w-full space-y-8 pb-12 animate-in fade-in duration-700">
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
          {(media.length > 0 || isGeneratingImage) && (
            <div className="absolute bottom-28 left-8 right-8 flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-[#e8e4e1]/50 shadow-inner items-center">
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
                    className="absolute -top-2 -right-2 bg-white shadow-xl rounded-full p-1.5 hover:scale-110 transition-transform border border-gray-100"
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
              {isGeneratingImage && (
                <div className="w-24 h-24 rounded-2xl bg-[#fcfbf9] border border-[#e8e4e1]/50 border-dashed flex flex-col items-center justify-center gap-2 flex-shrink-0 animate-pulse">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-[#b49b85]" />
                    <Sparkles className="w-2.5 h-2.5 text-[#b49b85] absolute -top-1 -right-1" />
                  </div>
                  <span className="text-[7px] font-black tracking-[0.15em] uppercase text-[#b49b85] text-center px-1">Creando IA...</span>
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-8 right-8 flex gap-3 flex-wrap">
             <button 
              type="button"
              disabled={isGeneratingImage}
              onClick={async () => {
                const promptSource = topic || content.substring(0, 100);
                if (!promptSource) {
                  alert('Por favor escribe un concepto en la campaña o un adelanto en la narrativa para inspirar la imagen.');
                  return;
                }
                setIsGeneratingImage(true);
                try {
                  const imageUrl = await generateAIVisual(promptSource);
                  const newMedia: MediaFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    url: imageUrl,
                    type: 'image',
                    file: new File([], 'ai-generated.png', { type: 'image/png' })
                  };
                  setMedia(prev => [newMedia, ...prev]);

                  const imageTags = await generateHashtagsForImage(promptSource);
                  if (imageTags && imageTags.length > 0) {
                    setHashtags(prev => {
                      const merged = [...prev, ...imageTags];
                      return Array.from(new Set(merged));
                    });
                  }
                } catch (error) {
                  console.error("Manual AI visual generation error:", error);
                } finally {
                  setIsGeneratingImage(false);
                }
              }}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-[#e8e4e1] rounded-2xl hover:border-[#b49b85] hover:text-[#1a1a1a] transition-all text-[#b49b85] text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md disabled:opacity-50"
             >
                {isGeneratingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b49b85]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#b49b85]" />
                )}
                Imagen IA
             </button>
          </div>
        </div>

        {/* Dynamic Hashtags Panel */}
        {hashtags.length > 0 && (
          <div className="mt-4 p-6 bg-[#fcfbf9] border border-[#e8e4e1] rounded-3xl animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b49b85] flex items-center gap-1.5">
                Hashtags sugeridos para el concepto e imagen:
              </span>
              <button
                type="button"
                onClick={() => {
                  const tagString = "\n\n" + hashtags.map(t => `#${t}`).join(' ');
                  setContent(prev => prev.trim() + tagString);
                }}
                className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] hover:text-[#b49b85] transition-colors"
              >
                Insertar todos +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setContent(prev => {
                      const trimmed = prev.trim();
                      if (trimmed.includes(`#${tag}`)) return prev;
                      return trimmed ? `${trimmed} #${tag}` : `#${tag}`;
                    });
                  }}
                  className="px-3 py-1.5 bg-white border border-[#e8e4e1] rounded-full text-[10px] font-bold text-[#6b6b6b] hover:border-[#b49b85] hover:text-[#1a1a1a] transition-all hover:scale-[1.02] active:scale-95"
                >
                  #{tag} +
                </button>
              ))}
            </div>
          </div>
        )}
      </section>



      {/* AI Insight Card */}
      {aiSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 bg-[#1a1a1a] text-[#fcfbf9] rounded-[40px] shadow-3xl relative overflow-hidden group border border-white/10"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-[#b49b85] font-black mb-8 text-[10px] uppercase tracking-[0.3em]">
              <Sparkles className="w-4 h-4" /> Axioma Estratégico IA
            </div>
            <div className="space-y-8">
              <div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] block mb-2">Composición Recomendada</span>
                <p className="text-2xl font-black serif italic tracking-tight">{aiSuggestions.title}</p>
              </div>
              <button 
                onClick={() => setContent(aiSuggestions.copy)}
                className="w-full sm:w-auto px-10 h-14 bg-[#b49b85] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#a38a74] transition-all shadow-2xl shadow-black/40 active:scale-95"
              >
                Adoptar Visión →
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-[150px] font-black serif italic transition-transform duration-1000 group-hover:scale-110 pointer-events-none">DERMA</div>
        </motion.div>
      )}

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
              <button 
                onClick={handlePublishNow}
                className="w-full sm:w-auto h-14 px-10 bg-[#b49b85] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#a38a74] transition-all shadow-2xl shadow-[#b49b85]/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <Send className="w-4 h-4" />
                Manifestar Ahora
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
