import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  isSameWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Instagram, 
  Twitter, 
  Linkedin,
  Facebook,
  Music2,
  Filter,
  Calendar as CalendarIcon,
  LayoutGrid,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  date: Date;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';
  time: string;
  title: string;
  content?: string;
}

const initialPosts: Post[] = [
  { id: '1', date: new Date(), platform: 'instagram', time: '10:00 AM', title: 'Lanzamiento Verano', content: 'Preparados para la mejor temporada del año? ☀️' },
  { id: '2', date: new Date(), platform: 'twitter', time: '02:30 PM', title: 'Hilo Técnico', content: '1/10 ¿Cómo escalar tu infraestructura en 2024?' },
  { id: '3', date: new Date(new Date().setDate(new Date().getDate() + 2)), platform: 'linkedin', time: '09:00 AM', title: 'Actualización B2B', content: 'Orgullosos de anunciar nuestra nueva alianza.' },
];

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'text-black' },
];

function DraggablePost({ post }: { post: Post }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
  });
  
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const Icon = platforms.find(p => p.id === post.platform)?.icon || Instagram;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 bg-white border border-[#e8e4e1] rounded-2xl shadow-sm hover:shadow-xl hover:border-[#b49b85]/30 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden",
        isDragging && "opacity-50 scale-105 z-50 shadow-2xl border-[#b49b85]"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 px-1.5 bg-[#fcfbf9] rounded-md border border-[#e8e4e1]">
           <Icon className="w-3 h-3 text-[#1a1a1a] opacity-80" />
        </div>
        <span className="text-[9px] font-black text-[#b49b85] uppercase tracking-widest">{post.time}</span>
      </div>
      <p className="text-[11px] font-bold text-[#1a1a1a] truncate group-hover:text-[#b49b85] transition-colors serif italic">{post.title}</p>
      
      <div className="absolute top-0 right-0 w-1 h-full opacity-20 bg-current transition-opacity group-hover:opacity-100" style={{ color: platforms.find(p => p.id === post.platform)?.color.replace('text-', '') }}></div>
    </div>
  );
}

function DroppableDay({ day, children, isToday, isCurrentMonth }: { day: Date, children: React.ReactNode, isToday: boolean, isCurrentMonth: boolean, key?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[180px] p-4 border-r border-b border-[#e8e4e1] transition-colors relative",
        !isCurrentMonth && "bg-[#fcfbf9]/30 text-[#e8e4e1]",
        isOver && "bg-[#f5f2ed]"
      )}
    >
      <div className="flex justify-between items-center mb-6">
        <span className={cn(
          "text-[10px] font-black w-9 h-9 flex items-center justify-center rounded-2xl transition-all serif italic",
          isToday 
            ? "bg-[#1a1a1a] text-white shadow-xl rotate-3" 
            : "text-[#1a1a1a] hover:bg-[#fcfbf9] border border-transparent hover:border-[#e8e4e1]"
        )}>
          {format(day, 'd')}
        </span>
        {isToday && (
          <div className="w-1.5 h-1.5 bg-[#b49b85] rounded-full animate-pulse" />
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

export function ScheduleView() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeFilters, setActiveFilters] = useState<string[]>(['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok']);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  let startDate, endDate;
  if (view === 'month') {
    startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  } else {
    startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleNext = () => {
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const handlePrev = () => {
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newDate = new Date(over.id as string);
      setPosts(prev => prev.map(post => 
        post.id === active.id ? { ...post, date: newDate } : post
      ));
    }
  };

  const toggleFilter = (platform: string) => {
    setActiveFilters(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const filteredPosts = posts.filter(p => activeFilters.includes(p.platform));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <h1 className="text-4xl font-black serif tracking-tight mb-3">Horizonte de Eventos</h1>
            <p className="text-[10px] font-bold text-[#b49b85] uppercase tracking-[0.2em] italic">Orquestación Multi-Canal de Precisión</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            {/* View Switcher */}
            <div className="flex bg-[#f5f2ed] border border-[#e8e4e1] rounded-full p-1.5 shadow-inner">
               <button 
                onClick={() => setView('month')}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  view === 'month' ? "bg-white text-[#1a1a1a] shadow-xl" : "text-[#b49b85] hover:text-[#1a1a1a]"
                )}
               >
                 <LayoutGrid className="w-3.5 h-3.5" /> Mensual
               </button>
               <button 
                onClick={() => setView('week')}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  view === 'week' ? "bg-white text-[#1a1a1a] shadow-xl" : "text-[#b49b85] hover:text-[#1a1a1a]"
                )}
               >
                 <CalendarIcon className="w-3.5 h-3.5" /> Semanal
               </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center border-2 border-[#e8e4e1] rounded-full bg-white p-1">
              <button 
                onClick={handlePrev}
                className="p-3 hover:bg-[#fcfbf9] rounded-full transition-colors text-[#b49b85]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-10 text-[10px] font-black min-w-48 text-center uppercase tracking-[0.2em] text-[#1a1a1a] serif italic">
                {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM, d', { locale: es })}
              </span>
              <button 
                onClick={handleNext}
                className="p-3 hover:bg-[#fcfbf9] rounded-full transition-colors text-[#b49b85]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button className="h-14 px-10 bg-[#1a1a1a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-black/20 flex items-center gap-3 active:scale-95">
              <Plus className="w-4 h-4" /> Crear Manifestación
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-4 overflow-x-auto pb-6 pt-2 no-scrollbar">
          <div className="flex items-center gap-3 px-6 py-3 bg-[#fcfbf9] border border-[#e8e4e1] rounded-2xl text-[#b49b85] text-[9px] font-black uppercase tracking-[0.2em] italic mr-4">
            <Filter className="w-3.5 h-3.5" /> Refinar Vista
          </div>
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleFilter(p.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                activeFilters.includes(p.id)
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-xl shadow-black/10"
                  : "border-[#e8e4e1] bg-white text-[#6b6b6b] hover:border-[#b49b85]/30 hover:text-[#1a1a1a]"
              )}
            >
              <p.icon className={cn("w-4 h-4", activeFilters.includes(p.id) ? "text-[#b49b85]" : p.color)} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border border-[#e8e4e1] rounded-[60px] overflow-hidden shadow-3xl">
          <div className="grid grid-cols-7 border-b border-[#e8e4e1] bg-[#fcfbf9]/50">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
              <div key={day} className="py-6 text-center text-[9px] font-black text-[#b49b85] uppercase tracking-[0.3em] border-r border-[#e8e4e1] last:border-r-0 italic">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              const dayPosts = filteredPosts.filter(p => isSameDay(p.date, day));
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <DroppableDay 
                  key={day.toISOString()} 
                  day={day} 
                  isToday={isToday}
                  isCurrentMonth={isCurrentMonth}
                >
                  <div className="flex flex-col gap-3">
                    {dayPosts.map((post) => (
                      <div key={post.id} onClick={(e) => {
                        e.stopPropagation();
                        setEditingPost(post);
                      }}>
                        <DraggablePost post={post} />
                      </div>
                    ))}
                  </div>
                </DroppableDay>
              );
            })}
          </div>
        </div>
      </DndContext>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPost(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                      <Edit2 className="w-6 h-6 text-[#635BFF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#111827]">Editar Publicación</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(editingPost.date, 'PPPP', { locale: es })}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingPost(null)}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Título</label>
                    <input 
                      type="text" 
                      defaultValue={editingPost.title}
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-[#635BFF] outline-none text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contenido</label>
                    <textarea 
                      defaultValue={editingPost.content}
                      rows={4}
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-1 focus:ring-[#635BFF] outline-none text-sm font-medium resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Hora</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          defaultValue={editingPost.time}
                          className="w-full h-12 pl-12 pr-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Plataforma</label>
                      <select 
                        defaultValue={editingPost.platform}
                        className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold appearance-none"
                      >
                        {platforms.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setEditingPost(null)}
                    className="flex-1 h-12 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    Guardar Cambios
                  </button>
                  <button className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100 shadow-sm active:scale-95">
                    <Trash2 className="w-5 h-5" />
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
