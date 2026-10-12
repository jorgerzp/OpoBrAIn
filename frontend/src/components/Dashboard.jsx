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
  Award,
  Layers,
  Sliders,
  CheckCircle2,
  X
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
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useTestStore } from '../store/useTestStore';
import { TopicSelect } from './TopicSelect';
import { BloqueTemaSelector } from './BloqueTemaSelector';
import { TestConfigModal } from './TestConfigModal';
import { BLOQUES_TEMARIO } from '../services/temarioData';
import { statsService } from '../services/statsService';

export const Dashboard = () => {
  const startTest = useTestStore((state) => state.startTest);

  // Estadísticas reales del opositor
  const [stats, setStats] = useState(() => statsService.getDashboardSummary());

  // Temas seleccionados (IDs como 'b1-t1', 'b1-t2', etc.)
  const [selectedTopicIds, setSelectedTopicIds] = useState(['b1-t1']);
  const [loadingMode, setLoadingMode] = useState(null); // 'oficiales' | 'generar-tema' | 'repaso'
  const [showStats, setShowStats] = useState(false);
  
  // Modales de flujo
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showFullSelectorModal, setShowFullSelectorModal] = useState(false);

  // Bloquear el scroll de fondo y permitir cerrar con tecla Escape o backdrop
  useEffect(() => {
    if (showConfigModal || showFullSelectorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowConfigModal(false);
        setShowFullSelectorModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfigModal, showFullSelectorModal]);

  // 1. Iniciar batería rápida de 10 preguntas oficiales (sin desplegables)
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

  // 2. Iniciar test configurado (Paso 2: con número de preguntas y tiempo seleccionados)
  const handleStartCustomTest = async ({ numPreguntas, isTimed, timeLimitMinutes, selectedTopicIds: topics }) => {
    try {
      setLoadingMode('custom-test');
      const idsToUse = topics && topics.length > 0 ? topics : selectedTopicIds;
      
      // Obtener preguntas reales basadas estrictamente en los bloques y temas seleccionados
      const questions = api.getPreguntasPorSeleccion({
        selectedTopicIds: idsToUse,
        numPreguntas,
      });

      const totalTemas = idsToUse.length;
      const tituloSesion = totalTemas === 45
        ? `Simulacro General C1 (${numPreguntas} preguntas)`
        : `Test Oficial C1 (${numPreguntas} preguntas • ${totalTemas} temas)`;

      startTest('tema', questions, {
        titulo: tituloSesion,
        isTimed,
        timeLimitMinutes,
        numPreguntas,
        selectedTopicIds: idsToUse,
      });

      setShowConfigModal(false);
      setShowFullSelectorModal(false);
    } catch (err) {
      console.error('Error al iniciar test personalizado:', err);
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
          <br className="hidden sm:inline" /> 6 bloques oficiales, 45 temas y preguntas reales con normativa legislativa.
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
            onClick={() => setShowConfigModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/30 text-white font-medium text-xs sm:text-sm tracking-wide inline-flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-sm"
          >
            <Sliders className="w-4 h-4 text-white/90" />
            <span>Configurar Test por Bloques ({selectedTopicIds.length} temas)</span>
          </button>
        </div>
      </div>

      {/* LAS 3 TARJETAS INFERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* TARJETA 1: Exámenes Oficiales (SIN DESPLEGABLE, SIN PUNTUACIÓN DE ESTRELLAS) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3e342b] text-white flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5 text-[#f4efe8]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8a796b] tracking-wider block">
                  Convocatorias AGE
                </span>
                <span className="text-xs font-bold text-[#3e342b]">
                  Exámenes Oficiales INAP
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-[#372d25]">Exámenes Oficiales</h3>
              <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
                Preguntas reales extraídas directamente de las convocatorias oficiales del INAP.
              </p>
            </div>

            <div className="text-xs text-[#857568] bg-[#ebe3d8] p-3 rounded-xl border border-[#d8ccc0]">
              🎯 <span className="font-semibold text-[#54463a]">Modo Histórico:</span> Batería aleatoria de 10 preguntas oficiales con baremo oficial del Estado.
            </div>
          </div>

          <button
            onClick={handleStartOficiales}
            disabled={loadingMode === 'oficiales'}
            className="mt-6 w-full py-3 px-4 bg-[#e5ddd3] hover:bg-[#dbd1c5] text-[#3e342b] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm cursor-pointer"
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

        {/* TARJETA 2: Test por Temas y Bloques (DESPLEGABLE JERÁRQUICO CON CHECKLIST Y TIEMPO) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9a897b] text-white flex items-center justify-center shadow-sm">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#372d25]">Test por Temas</h3>
                <span className="text-[10px] uppercase font-bold text-[#8a796b] tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#9a897b]" /> 6 Bloques • 45 Temas C1
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
              Elige bloques completos o temas específicos. Configura el número de preguntas y el temporizador de examen.
            </p>

            {/* Desplegable Jerárquico: Primer nivel Bloques, Segundo nivel Temas con Checklist */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-[#857568]">
                  Bloque y temas oficiales:
                </label>
                <button
                  type="button"
                  onClick={() => setShowFullSelectorModal(true)}
                  className="text-[11px] font-bold text-[#3e342b] hover:underline cursor-pointer"
                >
                  Ver temario completo
                </button>
              </div>

              <TopicSelect
                selectedTopicIds={selectedTopicIds}
                onSelectionChange={(newTopics) => setSelectedTopicIds(newTopics)}
                onOpenConfigModal={() => setShowConfigModal(true)}
              />
            </div>
          </div>

          {/* Botón que conduce al Paso 2: Pantalla de selección de preguntas y tiempo */}
          <button
            onClick={() => setShowConfigModal(true)}
            disabled={selectedTopicIds.length === 0}
            className="mt-6 w-full py-3.5 px-4 bg-[#3e342b] hover:bg-[#2c241d] active:scale-[0.98] text-white font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#ded3c7]" />
            <span>Configurar preguntas y tiempo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* TARJETA 3: Gran Métrica Real (Batería de Errores con estadísticas reales) */}
        <div className="warm-cream-card rounded-3xl p-7 flex flex-col justify-between text-[#443930]">
          <div className="space-y-4">
            <div>
              <div className="text-5xl font-light tracking-tight text-[#3e342b] leading-none">
                {stats.tasaRetencion}%
              </div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-[#857568] mt-1">
                Tasa de Acierto Real
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#372d25]">Batería de Errores</h3>
              <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
                {stats.fallosPendientesCount > 0
                  ? `Tienes ${stats.fallosPendientesCount} preguntas falladas en tu historial para consolidar.`
                  : 'Sin fallos pendientes. Has respondido con éxito tus preguntas de práctica.'}
              </p>
            </div>

            <div className="text-[11px] text-[#78695d] bg-[#ebe3d8] p-2.5 rounded-xl border border-[#d8ccc0] flex items-center justify-between">
              <span>Aciertos: <strong>{stats.totalAciertos}</strong></span>
              <span>•</span>
              <span>Fallos: <strong>{stats.totalFallos}</strong></span>
            </div>
          </div>

          <button
            onClick={handleStartRepaso}
            disabled={loadingMode === 'repaso'}
            className="mt-6 w-full py-3 px-4 bg-[#3e342b] hover:bg-[#2c241d] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            {loadingMode === 'repaso' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Cargando batería...</span>
              </>
            ) : (
              <>
                <span>{stats.fallosPendientesCount > 0 ? `Repasar Fallos (${stats.fallosPendientesCount})` : 'Repasar Batería de Errores'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Botón discreto para desplegar el Gráfico de Recharts con DATOS REALES */}
      <div className="pt-2">
        <button
          onClick={() => setShowStats(!showStats)}
          className="pill-outline-btn rounded-full px-5 py-2 text-xs font-medium inline-flex items-center gap-2 mx-auto block cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          {showStats ? 'Ocultar Estadísticas de Progreso' : 'Ver Gráfico de Progreso Semanal'}
        </button>

        {showStats && (
          <div className="mt-6 warm-cream-card rounded-3xl p-6 sm:p-8 text-[#443930] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-[#372d25] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8a796b]" /> Rendimiento Semanal Real
                </h3>
                <p className="text-xs text-[#736457]">
                  Balance de aciertos frente a fallos registrado en tus sesiones
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#54463a]">
                  <span className="w-3 h-3 rounded-full bg-[#8c7a6b] inline-block"></span> Aciertos ({stats.totalAciertos})
                </span>
                <span className="flex items-center gap-1.5 text-[#9e5d52]">
                  <span className="w-3 h-3 rounded-full bg-[#b8766a] inline-block"></span> Fallos ({stats.totalFallos})
                </span>
              </div>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.semanaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* PANTALLA / MODAL PASO 2: Elegir Número de Preguntas y Tiempo con Desplegable */}
      <AnimatePresence>
        {showConfigModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowConfigModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-3xl warm-cream-card rounded-3xl border border-[#d8ccc0] shadow-2xl overflow-hidden relative"
            >
              <TestConfigModal
                selectedTopicIds={selectedTopicIds}
                onClose={() => setShowConfigModal(false)}
                onBackToTopics={() => {
                  setShowConfigModal(false);
                  setShowFullSelectorModal(true);
                }}
                onStartTest={handleStartCustomTest}
                isLoading={loadingMode === 'custom-test'}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TEMARIO COMPLETO: Checklist de Bloques y Temas */}
      <AnimatePresence>
        {showFullSelectorModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFullSelectorModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-3xl warm-cream-card rounded-3xl border border-[#d8ccc0] shadow-2xl overflow-hidden relative"
            >
              <BloqueTemaSelector
                selectedTopicIds={selectedTopicIds}
                onSelectionChange={(newTopics) => setSelectedTopicIds(newTopics)}
                onClose={() => setShowFullSelectorModal(false)}
                onProceedToConfig={() => {
                  setShowFullSelectorModal(false);
                  setShowConfigModal(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
