import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  HelpCircle, 
  Sliders, 
  ArrowLeft, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  X
} from 'lucide-react';
import { BLOQUES_TEMARIO } from '../services/temarioData';

export const TestConfigModal = ({
  selectedTopicIds = [],
  onBackToTopics,
  onStartTest,
  onClose,
  isLoading = false,
}) => {
  // Configuración de número de preguntas
  const [numPreguntas, setNumPreguntas] = useState(10);
  const [customNum, setCustomNum] = useState('');

  // Configuración de tiempo
  const [isTimed, setIsTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  // Opciones predefinidas de preguntas
  const PREGUNTAS_PRESETS = [10, 20, 25, 30, 50, 100];

  // Opciones del desplegable de tiempo
  const TIEMPO_OPCIONES = [
    { value: 10, label: '10 minutos (Ritmo rápido)' },
    { value: 15, label: '15 minutos (Recomendado para 10-15 preguntas)' },
    { value: 20, label: '20 minutos' },
    { value: 30, label: '30 minutos (Media sesión)' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '60 minutos (1 hora)' },
    { value: 90, label: '90 minutos (Simulacro oficial INAP C1)' },
    { value: 120, label: '120 minutos (2 horas)' },
  ];

  // Resumen de bloques seleccionados
  const resumenBloques = React.useMemo(() => {
    const bloquesMap = new Map();
    selectedTopicIds.forEach((id) => {
      for (const b of BLOQUES_TEMARIO) {
        const tema = b.temas.find((t) => t.id === id);
        if (tema) {
          if (!bloquesMap.has(b.id)) {
            bloquesMap.set(b.id, {
              numeroRomano: b.numeroRomano,
              nombre: b.nombre,
              temas: [],
            });
          }
          bloquesMap.get(b.id).temas.push(tema.numero);
          break;
        }
      }
    });
    return Array.from(bloquesMap.values());
  }, [selectedTopicIds]);

  const handleCustomChange = (val) => {
    setCustomNum(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0 && n <= 100) {
      setNumPreguntas(n);
    }
  };

  const handleStart = () => {
    onStartTest({
      numPreguntas,
      isTimed,
      timeLimitMinutes: isTimed ? timeLimitMinutes : null,
      selectedTopicIds,
    });
  };

  const tiempoPorPreguntaSegundos = isTimed 
    ? Math.round((timeLimitMinutes * 60) / numPreguntas) 
    : null;

  return (
    <div className="flex flex-col h-[88vh] max-h-[680px] w-full text-[#3e342b] overflow-hidden bg-[#fbf9f5]">
      
      {/* 1. CABECERA FIJA SUPERIOR (Siempre visible, con botón X de cierre) */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-[#ded3c7] bg-[#f7f2ea] flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#3e342b] text-white uppercase tracking-wider">
              Paso 2 de 2
            </span>
            <span className="text-xs font-semibold text-[#8a796b] tracking-wider uppercase">
              Configuración de Sesión
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-[#342a22] truncate">
            Personaliza tu Test
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBackToTopics}
            className="text-xs text-[#736457] hover:text-[#3e342b] px-3 py-1.5 rounded-xl bg-white hover:bg-[#ede5dc] border border-[#d8ccc0] transition flex items-center gap-1.5 cursor-pointer font-semibold shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temas</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#ede5dc] text-[#4d4035] border border-[#d8ccc0] text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Cerrar esta ventana (Esc)"
            >
              <X className="w-4 h-4 text-[#736457]" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CUERPO SCROLLABLE (Todo el contenido se ajusta de forma limpia sin desbordar la pantalla) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
        
        {/* Resumen de Contenidos Seleccionados */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#ebe3d8] border border-[#d8ccc0] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#55463a] uppercase tracking-wider text-[11px]">
              Temario seleccionado ({selectedTopicIds.length} temas en {resumenBloques.length} bloques):
            </span>
            <button
              type="button"
              onClick={onBackToTopics}
              className="text-[11px] font-semibold text-[#3e342b] hover:underline cursor-pointer"
            >
              Modificar temas
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resumenBloques.map((b, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-white/95 text-[#3e342b] border border-[#d8ccc0] font-medium"
              >
                <strong>{b.numeroRomano}:</strong> {b.temas.length === 1 ? `Tema ${b.temas[0]}` : `${b.temas.length} temas`}
              </span>
            ))}
          </div>
        </div>

        {/* SECCIÓN 1: NÚMERO DE PREGUNTAS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-[#342a22] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#8a796b]" />
              <span>Número de preguntas del test:</span>
            </label>
            <span className="text-xs font-extrabold text-[#3e342b] bg-white px-2.5 py-0.5 rounded-lg border border-[#d8ccc0]">
              {numPreguntas} preguntas
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PREGUNTAS_PRESETS.map((p) => {
              const isSelected = numPreguntas === p && !customNum;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setNumPreguntas(p);
                    setCustomNum('');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#3e342b] text-white border-[#3e342b] shadow-xs'
                      : 'bg-white hover:bg-[#ede5dc] text-[#4a3f34] border-[#d8ccc0]'
                  }`}
                >
                  {p} preguntas
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs pt-0.5">
            <span className="text-[#736457]">O cantidad personalizada (5 - 100):</span>
            <input
              type="number"
              min="5"
              max="100"
              value={customNum}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Ej: 15"
              className="w-20 px-2.5 py-1 bg-white border border-[#d8ccc0] rounded-lg text-xs font-semibold text-[#3e342b] focus:outline-none focus:border-[#8a796b]"
            />
          </div>
        </div>

        {/* SECCIÓN 2: LÍMITE DE TIEMPO (TOGGLE Y DESPLEGABLE) */}
        <div className="space-y-2.5 pt-1">
          <label className="text-xs sm:text-sm font-bold text-[#342a22] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8a796b]" />
            <span>¿Deseas activar límite de tiempo?</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsTimed(false)}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                !isTimed
                  ? 'bg-[#ede5da] border-[#a59485] shadow-2xs'
                  : 'bg-white/80 border-[#ded3c7] hover:bg-white opacity-80'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                !isTimed ? 'bg-[#3e342b] border-[#3e342b] text-white' : 'border-[#b5a79a]'
              }`}>
                {!isTimed && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div>
                <div className="text-xs font-bold text-[#342a22]">
                  Sin límite de tiempo
                </div>
                <p className="text-[10.5px] text-[#736457] leading-tight mt-0.5">
                  Estudia a tu ritmo para afianzar conceptos y repasar las leyes.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTimed(true)}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                isTimed
                  ? 'bg-[#ede5da] border-[#a59485] shadow-2xs'
                  : 'bg-white/80 border-[#ded3c7] hover:bg-white opacity-80'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                isTimed ? 'bg-[#3e342b] border-[#3e342b] text-white' : 'border-[#b5a79a]'
              }`}>
                {isTimed && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <div>
                <div className="text-xs font-bold text-[#342a22] flex items-center gap-1.5">
                  <span>Con límite de tiempo</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#3e342b] text-white uppercase">
                    Examen Real
                  </span>
                </div>
                <p className="text-[10.5px] text-[#736457] leading-tight mt-0.5">
                  Cuenta atrás activa. El test finaliza al agotarse el cronómetro.
                </p>
              </div>
            </button>
          </div>

          {/* Desplegable de selección de tiempo */}
          {isTimed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-white border border-[#a59485] space-y-1.5 shadow-2xs"
            >
              <label className="text-xs font-bold text-[#443930] block">
                Selecciona el tiempo total para el test:
              </label>
              
              <div className="relative">
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#fbf9f5] border border-[#d8ccc0] focus:border-[#8a796b] rounded-xl text-xs sm:text-sm font-semibold text-[#3e342b] focus:outline-none transition cursor-pointer appearance-none pr-8"
                >
                  {TIEMPO_OPCIONES.map((op) => (
                    <option key={op.value} value={op.value}>
                      ⏱️ {op.label}
                    </option>
                  ))}
                </select>
                <Clock className="w-4 h-4 text-[#8a796b] absolute right-3 top-3 pointer-events-none" />
              </div>

              {tiempoPorPreguntaSegundos && (
                <p className="text-[11px] text-[#736457] flex items-center gap-1.5 pt-0.5">
                  <Zap className="w-3 h-3 text-[#9a897b]" />
                  <span>
                    Dispondrás de aprox. <strong>{Math.floor(tiempoPorPreguntaSegundos / 60)}m {tiempoPorPreguntaSegundos % 60}s</strong> por cada pregunta.
                  </span>
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Baremo Oficial */}
        <div className="p-3 rounded-2xl bg-[#f4efe8] border border-[#ded3c7] flex items-center justify-between text-xs text-[#6e5e51]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8a796b] shrink-0" />
            <span className="text-[11px] sm:text-xs">
              Baremo oficial INAP: <strong>+1.0</strong> acierto, <strong>-0.33</strong> fallo. Preguntas reales con leyes.
            </span>
          </div>
          <span className="font-bold text-[#3e342b] shrink-0 ml-2">
            {isTimed ? `⏱️ ${timeLimitMinutes} min` : '🧘 Sin tiempo'}
          </span>
        </div>

      </div>

      {/* 3. PIE DE PÁGINA FIJO INFERIOR (Siempre visible) */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-[#ded3c7] bg-[#f3ede4] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToTopics}
          className="px-4 py-2.5 rounded-xl border border-[#d8ccc0] bg-white hover:bg-[#eae1d5] text-[#554639] font-semibold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Temas</span>
        </button>

        <button
          type="button"
          disabled={isLoading || numPreguntas <= 0}
          onClick={handleStart}
          className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#3e342b] hover:bg-[#282019] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Comenzar Test ({numPreguntas} Preguntas)</span>
        </button>
      </div>

    </div>
  );
};
