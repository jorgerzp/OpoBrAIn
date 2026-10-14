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
  X,
  ArrowRight
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
import { useAuthStore } from '../store/useAuthStore';
import { TopicSelect } from './TopicSelect';
import { BloqueTemaSelector } from './BloqueTemaSelector';
import { TestConfigModal } from './TestConfigModal';
import { BLOQUES_TEMARIO, getTemaById, getEpigrafeById } from '../services/temarioData';
import { statsService } from '../services/statsService';

export const Dashboard = () => {
  const startTest = useTestStore((state) => state.startTest);
  const { isDemoMode, demoTestsCompleted, logout } = useAuthStore();

  // Estadísticas reales del opositor
  const [stats, setStats] = useState(() => statsService.getDashboardSummary());

  // Temas seleccionados (IDs como 'b1-t1', 'b1-t2', etc.)
  const [selectedTopicIds, setSelectedTopicIds] = useState(['b1-t1']);
  // Apartados / Bloques específicos seleccionados dentro de los temas (IDs como 'b1-t1-e1')
  const [selectedEpigrafeIds, setSelectedEpigrafeIds] = useState([
    'b1-t1-e1', 'b1-t1-e2', 'b1-t1-e3', 'b1-t1-e4', 'b1-t1-e5', 'b1-t1-e6'
  ]);
  const [loadingMode, setLoadingMode] = useState(null); // 'oficiales' | 'generar-tema' | 'custom-test' | 'repaso'
  const [showStats, setShowStats] = useState(false);
  
  // Modales de flujo
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showFullSelectorModal, setShowFullSelectorModal] = useState(false);
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);

  // Sincronizar selección de temas y apartados específicos
  const handleSelectionChange = (newTopics, newEpigrafes) => {
    setSelectedTopicIds(newTopics);
    if (newEpigrafes !== undefined) {
      setSelectedEpigrafeIds(newEpigrafes);
    }
  };

  // Restricción acotada de Modo Demo: permite explorar la interfaz completa, pero solo 1 test
  const checkDemoLimit = () => {
    if (isDemoMode && demoTestsCompleted >= 1) {
      setShowConfigModal(false);
      setShowFullSelectorModal(false);
      setShowDemoLimitModal(true);
      return true;
    }
    return false;
  };

  // Bloquear el scroll de fondo y permitir cerrar con tecla Escape o backdrop
  useEffect(() => {
    if (showConfigModal || showFullSelectorModal || showDemoLimitModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowConfigModal(false);
        setShowFullSelectorModal(false);
        setShowDemoLimitModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfigModal, showFullSelectorModal, showDemoLimitModal]);

  // 1. Iniciar batería rápida de 10 preguntas oficiales (sin desplegables)
  const handleStartOficiales = async () => {
    if (checkDemoLimit()) return;
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

  // 2. Iniciar test configurado (Paso 2: con número de preguntas, tiempo y modo de generación)
  const handleStartCustomTest = async ({ 
    numPreguntas, 
    isTimed, 
    timeLimitMinutes, 
    selectedTopicIds: topics, 
    selectedEpigrafeIds: epigrafes,
    modoGeneracion = 'ia'
  }) => {
    if (checkDemoLimit()) return;
    const idsToUse = topics && topics.length > 0 ? topics : selectedTopicIds;
    const epigrafesToUse = epigrafes && epigrafes.length > 0 ? epigrafes : selectedEpigrafeIds;

    try {
      if (modoGeneracion === 'ia') {
        setLoadingMode('generar-tema');
        
        // Obtener el tema principal seleccionado
        const temaObj = getTemaById(idsToUse[0]) || { titulo: 'Temario Oficial C1 AGE', bloqueNombre: 'C1' };
        
        // Extraer los nombres de los epígrafes seleccionados para pasarlos al prompt de la IA
        const nombresEpigrafes = epigrafesToUse
          .map((id) => getEpigrafeById(id)?.nombre)
          .filter(Boolean);

        const questions = await api.generarTestTema(
          temaObj.titulo,
          temaObj.bloqueNombre,
          nombresEpigrafes.length > 0 ? nombresEpigrafes : null,
          numPreguntas
        );

        const detalleApartados = nombresEpigrafes.length > 0 && nombresEpigrafes.length <= 2
          ? ` • ${nombresEpigrafes.join(', ')}`
          : nombresEpigrafes.length > 2
          ? ` • ${nombresEpigrafes.length} apartados específicos`
          : '';

        const tituloSesion = `Test IA: Tema ${temaObj.numero || ''}${detalleApartados} (${questions.length} preg.)`;

        startTest('tema', questions, {
          titulo: tituloSesion,
          isTimed,
          timeLimitMinutes,
          numPreguntas: questions.length,
          selectedTopicIds: idsToUse,
          fuente: 'ia_openrouter',
        });
      } else {
        setLoadingMode('custom-test');
        const questions = api.getPreguntasPorSeleccion({
          selectedTopicIds: idsToUse,
          selectedEpigrafeIds: epigrafesToUse,
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
      }

      setShowConfigModal(false);
      setShowFullSelectorModal(false);
    } catch (err) {
      console.error('Error al iniciar test personalizado:', err);
    } finally {
      setLoadingMode(null);
    }
  };

  // 3. Iniciar generación directa con IA para un tema y sus apartados
  const handleStartAITestDirect = async ({ tema, bloque, epigrafes }) => {
    if (checkDemoLimit()) return;
    try {
      setLoadingMode('generar-tema');
      setShowFullSelectorModal(false);
      const questions = await api.generarTestTema(tema, bloque, epigrafes, 10);
      const sub = epigrafes && epigrafes.length > 0 ? ` (${epigrafes.join(', ')})` : '';
      startTest('tema', questions, {
        titulo: `Test IA: ${tema.substring(0, 40)}...${sub}`,
        numPreguntas: questions.length,
        fuente: 'ia_openrouter',
      });
    } catch (err) {
      console.error('Error en generación directa con IA:', err);
    } finally {
      setLoadingMode(null);
    }
  };

  // 4. Iniciar repaso de errores
  const handleStartRepaso = async () => {
    if (checkDemoLimit()) return;
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
      
      {/* Banner informativo de Modo Demo */}
      {isDemoMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-3xl bg-[#efe7dc] border border-[#d3c2b1] text-[#3e342b] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3e342b] text-white">
                  Modo Demo
                </span>
                <span className="text-xs font-semibold text-[#6f5f52]">
                  {demoTestsCompleted >= 1 
                    ? '• Test de prueba consumido (1 de 1)' 
                    : '• 1 test de prueba disponible'}
                </span>
              </div>
              <p className="text-xs text-[#5e4f43] mt-0.5 leading-snug">
                {demoTestsCompleted >= 1
                  ? 'Has finalizado tu test de prueba. Puedes explorar libremente todo el temario e interfaz, o iniciar sesión para acceso ilimitado.'
                  : 'Puedes explorar toda la plataforma, configurar temas y realizar 1 test de prueba para evaluar OpoBrAIn.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={logout}
              className="py-2 px-4 rounded-xl bg-[#3e342b] hover:bg-[#2c241d] active:scale-95 text-white font-semibold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

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
                selectedEpigrafeIds={selectedEpigrafeIds}
                onSelectionChange={handleSelectionChange}
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
                selectedEpigrafeIds={selectedEpigrafeIds}
                onClose={() => setShowConfigModal(false)}
                onBackToTopics={() => {
                  setShowConfigModal(false);
                  setShowFullSelectorModal(true);
                }}
                onStartTest={handleStartCustomTest}
                isLoading={loadingMode === 'custom-test' || loadingMode === 'generar-tema'}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TEMARIO COMPLETO: Checklist de Bloques, Temas y Apartados */}
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
                selectedEpigrafeIds={selectedEpigrafeIds}
                onSelectionChange={handleSelectionChange}
                onStartAITest={handleStartAITestDirect}
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

      {/* MODAL LÍMITE DE MODO DEMO (1 TEST COMPLETADO) */}
      <AnimatePresence>
        {showDemoLimitModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDemoLimitModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md warm-cream-card rounded-3xl border border-[#d8ccc0] p-6 sm:p-7 shadow-2xl relative text-[#443930] space-y-5 text-center"
            >
              <button
                onClick={() => setShowDemoLimitModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ded3c7] text-[#8a796b] hover:text-[#3e342b] transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-7 h-7 text-amber-200" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a796b]">
                  Límite de Modo Demo
                </span>
                <h3 className="text-xl font-bold text-[#372d25]">
                  Test de Prueba Completado
                </h3>
                <p className="text-xs sm:text-sm text-[#736457] leading-relaxed">
                  Has realizado tu test de prueba de cortesía. Para continuar entrenando con preguntas ilimitadas, accede con tu cuenta.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#ebe3d8] border border-[#d8ccc0] text-left text-xs text-[#635346] space-y-2">
                <div className="font-semibold text-[#3e342b] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#487e5b]" />
                  <span>Con una cuenta en OpoBrAIn obtienes:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] text-[#736457]">
                  <li>Tests ilimitados de los 6 bloques oficiales y 45 temas</li>
                  <li>Generación dinámica con Inteligencia Artificial por epígrafes</li>
                  <li>Batería de fallos personalizada con justificación legislativa</li>
                  <li>Estadísticas de retención y progreso semanal en tiempo real</li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={logout}
                  className="w-full py-3 px-4 bg-[#3e342b] hover:bg-[#2c241d] active:scale-[0.98] text-white font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <span>Iniciar Sesión para Acceso Completo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowDemoLimitModal(false)}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-black/5 text-[#8a796b] hover:text-[#3e342b] font-medium rounded-xl text-xs transition cursor-pointer"
                >
                  Seguir explorando la interfaz y temario
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
