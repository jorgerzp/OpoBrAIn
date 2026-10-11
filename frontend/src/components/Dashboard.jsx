import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ChevronRight, 
  Star,
  Loader2,
  TrendingUp,
  BarChart3,
  Sparkles,
  Bot,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';
import { useTestStore } from '../store/useTestStore';
import { TopicSelect } from './TopicSelect';

const mockProgresoData = [
  { dia: 'Lun', aciertos: 42, fallos: 10 },
  { dia: 'Mar', aciertos: 48, fallos: 8 },
  { dia: 'Mié', aciertos: 55, fallos: 9 },
  { dia: 'Jue', aciertos: 51, fallos: 6 },
  { dia: 'Vie', aciertos: 64, fallos: 5 },
  { dia: 'Sáb', aciertos: 78, fallos: 4 },
  { dia: 'Dom', aciertos: 72, fallos: 6 },
];

export const Dashboard = () => {
  const startTest = useTestStore((state) => state.startTest);

  const [temas, setTemas] = useState([]);
  const [selectedTema, setSelectedTema] = useState('');
  const [loadingMode, setLoadingMode] = useState(null); // 'oficiales' | 'generar-tema' | 'repaso'
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    async function cargarTemas() {
      const lista = await api.getTemas();
      setTemas(lista);
      if (lista.length > 0) {
        const primero = lista[0];
        const titulo = typeof primero === 'string' ? primero : (primero.titulo || primero.titulo_tema || '');
        setSelectedTema(titulo);
      }
    }
    cargarTemas();
  }, []);

  // 1. Iniciar batería de 10 preguntas oficiales (sin desplegables)
  const handleStartOficiales = async () => {
    try {
      setLoadingMode('oficiales');
      const questions = await api.getTestOficiales();
      startTest('oficial', questions, { 
        titulo: 'Batería Oficial: 10 Preguntas de Exámenes INAP' 
      });
    } catch (err) {
      console.error('Error al cargar preguntas oficiales:', err);
    } finally {
      setLoadingMode(null);
    }
  };

  // 2. Generar test de 10 preguntas por tema con IA (OpenRouter / Llama 3)
  const handleGenerarTema = async () => {
    const temaToUse = selectedTema || (temas[0]?.titulo || 'Tema 1: La Constitución Española de 1978');
    try {
      setLoadingMode('generar-tema');
      const questions = await api.generarTestTema(temaToUse);
      startTest('tema', questions, { 
        titulo: `Test Oficial C1: ${temaToUse}` 
      });
    } catch (err) {
      console.error('Error al generar test con IA, recurriendo a banco directo:', err);
      const fallback = api.getPreguntasPorTema(temaToUse);
      startTest('tema', fallback, { 
        titulo: `Test C1: ${temaToUse}` 
      });
    } finally {
      setLoadingMode(null);
    }
  };

  // 3. Iniciar repaso de errores
  const handleStartRepaso = async () => {
    try {
      setLoadingMode('repaso');
      const questions = await api.getTestRepaso();
      startTest('repaso', questions, { 
        titulo: 'Batería de Errores - Preguntas a Reforzar' 
      });
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 space-y-8 sm:space-y-10">
      
      {/* SECCIÓN HERO (Clavada a la imagen de referencia) */}
      <div className="text-center space-y-5 max-w-3xl mx-auto">
        {/* Pill Badge DISCOVER */}
        <div>
          <span className="pill-tag px-6 py-1 rounded-full inline-block tracking-[0.2em] text-[11px]">
            DISCOVER
          </span>
        </div>

        {/* Gran Título Blanco */}
        <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-normal tracking-tight text-white leading-[1.12]">
          Start your journey
        </h1>

        {/* Subtítulo translúcido */}
        <p className="text-white/80 text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-lg mx-auto font-light">
          Preparación inteligente para las Oposiciones al Cuerpo General Administrativo del Estado (C1).
          <br className="hidden sm:inline" /> Banco oficial histórico y generación ilimitada de tests con IA.
        </p>

        {/* Botones Principales de Acción en Hero */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleStartOficiales}
            disabled={loadingMode === 'oficiales'}
            className="cream-action-btn w-full sm:w-auto px-7 py-3 text-sm tracking-wide inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {loadingMode === 'oficiales' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#3e342b]" />
                <span>Cargando oficiales...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-[#3e342b]" />
                <span>Batería Oficial (10 Preguntas)</span>
              </>
            )}
          </button>

          <button
            onClick={handleGenerarTema}
            disabled={loadingMode === 'generar-tema'}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/30 text-white font-medium text-xs sm:text-sm tracking-wide inline-flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-sm"
          >
            {loadingMode === 'generar-tema' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando test...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white/90" />
                <span>Test por Temas ({selectedTema ? (selectedTema.match(/tema\s*\d+/i)?.[0] || 'Tema 1') : 'Tema 1'})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LAS 3 TARJETAS INFERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* TARJETA 1: Exámenes Oficiales (SIN DESPLEGABLE) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            {/* Cabecera con Estrellas y Nota 4.8 */}
            <div className="flex items-center gap-2">
              <div className="flex text-[#8a796b]">
                <Star className="w-4 h-4 fill-[#8a796b]" />
                <Star className="w-4 h-4 fill-[#8a796b]" />
                <Star className="w-4 h-4 fill-[#8a796b]" />
                <Star className="w-4 h-4 fill-[#8a796b]" />
                <Star className="w-4 h-4 fill-none" />
              </div>
              <span className="font-semibold text-base text-[#443930]">4.8</span>
            </div>

            {/* Texto principal */}
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-[#372d25]">Exámenes Oficiales</h3>
              <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
                Preguntas reales extraídas directamente de las convocatorias oficiales del INAP.
              </p>
            </div>

            <div className="text-xs text-[#857568] bg-[#ebe3d8] p-3 rounded-xl border border-[#d8ccc0]">
              🎯 <span className="font-semibold text-[#54463a]">Modo Histórico:</span> Mezcla aleatoria de todo el banco de preguntas oficiales registradas en la base de datos.
            </div>
          </div>

          {/* Botón único sin ningún desplegable */}
          <button
            onClick={handleStartOficiales}
            disabled={loadingMode === 'oficiales'}
            className="mt-6 w-full py-3 px-4 bg-[#e5ddd3] hover:bg-[#dbd1c5] text-[#3e342b] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm"
          >
            {loadingMode === 'oficiales' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#3e342b]" />
                <span>Cargando test...</span>
              </>
            ) : (
              <>
                <span>Hacer batería de 10 preguntas oficiales</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* TARJETA 2: Test por Temas (CON SELECT Y GENERACIÓN IA) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            {/* Icono circular idéntico a la imagen */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9a897b] text-white flex items-center justify-center shadow-sm">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#372d25]">Test por Temas</h3>
                <span className="text-[10px] uppercase font-bold text-[#8a796b] tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#9a897b]" /> Generador IA (Llama 3)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
              La IA genera dinámicamente 10 preguntas de nivel experto C1 sobre el tema elegido.
            </p>

            {/* Desplegable Personalizado TopicSelect acorde al diseño web */}
            <div className="pt-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-[#857568] block mb-1.5">
                Seleccionar tema oficial:
              </label>
              <TopicSelect
                temas={temas}
                selectedTema={selectedTema}
                onSelectTema={(tema) => setSelectedTema(tema)}
                disabled={loadingMode === 'generar-tema'}
              />
            </div>
          </div>

          {/* Botón Generar Test con animación de carga / spinner */}
          <button
            onClick={handleGenerarTema}
            disabled={loadingMode === 'generar-tema'}
            className="mt-6 w-full py-3.5 px-4 bg-[#3e342b] hover:bg-[#2c241d] active:scale-[0.98] text-white font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-md cursor-pointer"
          >
            {loadingMode === 'generar-tema' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="animate-pulse">Generando test con IA...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-[#ded3c7]" />
                <span>Hacer test de {selectedTema ? (selectedTema.match(/tema\s*\d+/i)?.[0] || 'este tema') : 'este tema'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* TARJETA 3: Gran Métrica 87% (Batería de Errores) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            <div>
              <div className="text-5xl font-light tracking-tight text-[#3e342b] leading-none">
                87%
              </div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-[#857568] mt-1">
                Tasa de Retención
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#372d25]">Batería de Errores</h3>
              <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
                Preguntas que has fallado previamente. El sistema las fija activamente hasta que las aciertes.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartRepaso}
            disabled={loadingMode === 'repaso'}
            className="mt-6 w-full py-3 px-4 bg-[#3e342b] hover:bg-[#2c241d] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            {loadingMode === 'repaso' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Cargando batería...</span>
              </>
            ) : (
              <>
                <span>Repasar Fallos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Botón discreto para desplegar el Gráfico de Recharts */}
      <div className="pt-2">
        <button
          onClick={() => setShowStats(!showStats)}
          className="pill-outline-btn rounded-full px-5 py-2 text-xs font-medium inline-flex items-center gap-2 mx-auto block"
        >
          <BarChart3 className="w-4 h-4" />
          {showStats ? 'Ocultar Estadísticas de Progreso' : 'Ver Gráfico de Progreso Semanal'}
        </button>

        {showStats && (
          <div className="mt-6 warm-cream-card rounded-3xl p-6 sm:p-8 text-[#443930] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-[#372d25] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8a796b]" /> Rendimiento Semanal
                </h3>
                <p className="text-xs text-[#736457]">
                  Balance de aciertos frente a fallos en tus sesiones
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#54463a]">
                  <span className="w-3 h-3 rounded-full bg-[#8c7a6b] inline-block"></span> Aciertos
                </span>
                <span className="flex items-center gap-1.5 text-[#9e5d52]">
                  <span className="w-3 h-3 rounded-full bg-[#b8766a] inline-block"></span> Fallos
                </span>
              </div>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockProgresoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAciertosWarm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8c7a6b" stopOpacity={0.65}/>
                      <stop offset="95%" stopColor="#8c7a6b" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorFallosWarm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b8766a" stopOpacity={0.55}/>
                      <stop offset="95%" stopColor="#b8766a" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d6cb" opacity={0.7} />
                  <XAxis dataKey="dia" stroke="#8a796b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8a796b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f3eee7', 
                      borderColor: '#d2c2b3',
                      borderRadius: '16px',
                      color: '#3e342b',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="aciertos" stroke="#756456" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAciertosWarm)" />
                  <Area type="monotone" dataKey="fallos" stroke="#b8766a" strokeWidth={2} fillOpacity={1} fill="url(#colorFallosWarm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
