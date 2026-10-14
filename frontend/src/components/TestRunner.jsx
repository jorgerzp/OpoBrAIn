import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Home, 
  Award, 
  Lightbulb,
  X,
  Clock,
  AlertTriangle,
  Scale,
  Sparkles
} from 'lucide-react';
import { useTestStore } from '../store/useTestStore';
import { useAuthStore } from '../store/useAuthStore';

export const TestRunner = () => {
  const { isDemoMode, logout } = useAuthStore();
  const {
    questions,
    currentIndex,
    selectedOption,
    isAnswered,
    feedback,
    isLoading,
    isCompleted,
    score,
    testMeta,
    isTimed,
    timeLimitMinutes,
    remainingSeconds,
    timerExpired,
    tickTimer,
    selectOption,
    nextQuestion,
    resetTest,
  } = useTestStore();

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Efecto del temporizador de cuenta atrás activo
  useEffect(() => {
    if (!isTimed || isCompleted) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimed, isCompleted, tickTimer]);

  // Formato mm:ss para el reloj
  const formatTime = (secs) => {
    if (secs === null || secs === undefined || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Pantalla de Resultados al finalizar el test
  if (isCompleted) {
    const aciertos = score.aciertos;
    const fallos = score.fallos;
    const sinResponder = Math.max(0, totalQuestions - (aciertos + fallos));
    const penalizacion = fallos * 0.33;
    const puntuacionNeta = Math.max(0, aciertos - penalizacion).toFixed(2);
    const notaSobreDiez = totalQuestions > 0 ? ((puntuacionNeta / totalQuestions) * 10).toFixed(2) : 0;
    const esAprobado = parseFloat(notaSobreDiez) >= 5.0;

    return (
      <div className="relative z-10 max-w-lg mx-auto px-4 py-4 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="warm-cream-card rounded-3xl p-6 sm:p-8 text-[#443930] text-center space-y-5 shadow-2xl relative border border-[#d8ccc0]"
        >
          {/* Botón X de salida en pantalla de resultados */}
          <button
            onClick={resetTest}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#ded3c7] text-[#8a796b] hover:text-[#3e342b] transition cursor-pointer"
            title="Volver al inicio"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner si el test finalizó por agotamiento de tiempo */}
          {timerExpired && (
            <div className="p-3 rounded-2xl bg-[#fbece9] border border-[#e09e93] text-[#823a2f] text-xs font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#b65345]" />
              <span>¡Tiempo límite agotado! El test se ha cerrado automáticamente.</span>
            </div>
          )}

          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shadow-md">
            <Award className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8a796b]">
              Baremo Oficial C1 (INAP)
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#372d25]">
              {esAprobado ? '¡Test Superado!' : 'Sesión Finalizada'}
            </h2>
            <p className="text-xs text-[#736457]">
              {testMeta?.titulo || 'Evaluación Oficial de Oposiciones C1'}
            </p>
          </div>

          {/* Baremo INAP C1 */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#eae2d7] border border-[#d8ccc0]">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#446b52]">{aciertos}</div>
              <div className="text-[10px] sm:text-[11px] text-[#736457]">Aciertos (+1.0)</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#9e5d52]">{fallos}</div>
              <div className="text-[10px] sm:text-[11px] text-[#736457]">Fallos (-0.33)</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#3e342b]">
                {notaSobreDiez} <span className="text-xs font-normal">/10</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#736457]">Nota Final</div>
            </div>
          </div>

          {/* Metadatos adicionales de la sesión */}
          <div className="text-[11px] text-[#7a6b5e] bg-white/70 p-2.5 rounded-xl border border-[#ded3c7] flex items-center justify-around">
            <span>
              Total: <strong>{totalQuestions} preguntas</strong>
            </span>
            <span>•</span>
            <span>
              Puntuación neta: <strong>{puntuacionNeta} pts</strong>
            </span>
            {isTimed && (
              <>
                <span>•</span>
                <span>
                  Tiempo fijado: <strong>{timeLimitMinutes} min</strong>
                </span>
              </>
            )}
          </div>

          {/* Aviso de Modo Demo consumido */}
          {isDemoMode && (
            <div className="p-4 rounded-2xl bg-[#ebe3d8] border border-[#d8ccc0] text-[#3e342b] text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-sm text-[#372d25]">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Test de prueba en Modo Demo completado</span>
              </div>
              <p className="text-[#6d5e51] leading-relaxed text-[11px]">
                Has utilizado tu test de prueba de cortesía. Para acceder a tests ilimitados, generación con IA de los 45 temas y registro persistente de fallos, inicia sesión con tu cuenta.
              </p>
              <button
                onClick={() => {
                  resetTest();
                  logout();
                }}
                className="w-full mt-1 py-2.5 px-3 rounded-xl bg-[#3e342b] hover:bg-[#2c241d] active:scale-95 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Iniciar Sesión para Acceso Ilimitado</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={resetTest}
            className="w-full py-3 px-6 bg-[#3e342b] hover:bg-[#2c241d] text-white font-semibold rounded-2xl text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4" /> Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="relative z-10 max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-white/80 text-sm">No hay preguntas para esta selección.</p>
        <button 
          onClick={resetTest} 
          className="pill-outline-btn rounded-full px-6 py-2 text-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Volver al Dashboard</span>
        </button>
      </div>
    );
  }

  const opciones = [
    { key: 'A', texto: currentQuestion.opcion_a },
    { key: 'B', texto: currentQuestion.opcion_b },
    { key: 'C', texto: currentQuestion.opcion_c },
    { key: 'D', texto: currentQuestion.opcion_d },
  ];

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Enunciado limpio
  const enunciadoTexto = (currentQuestion.enunciado || '').trim();

  // Etiqueta de tema
  const temaBadgeTexto = currentQuestion.temaTitulo || 
    (currentQuestion.temaNumero ? `Tema ${currentQuestion.temaNumero}` : null) ||
    currentQuestion.tema_nombre || 
    null;

  // Ley de referencia
  const leyReferenciaTexto = currentQuestion.leyReferencia || null;

  return (
    <div className="relative z-10 max-w-2xl mx-auto w-full px-3 sm:px-4 py-1 sm:py-2 space-y-2.5">
      
      {/* Barra superior con título, temporizador si está activo, y botón salir */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-white/90">
          
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <span className="font-medium truncate text-xs sm:text-sm text-white/95">
              {testMeta?.titulo || 'Test de Oposición C1'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Reloj Temporizador activo */}
            {isTimed ? (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                remainingSeconds !== null && remainingSeconds < 60 
                  ? 'bg-rose-500/25 text-rose-200 border-rose-400 animate-pulse'
                  : remainingSeconds !== null && remainingSeconds < 180
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                  : 'bg-white/15 text-white border-white/30 backdrop-blur-sm'
              }`}>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums tracking-wider">{formatTime(remainingSeconds)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/80 border border-white/20">
                <Clock className="w-3 h-3 opacity-60" />
                <span>Sin tiempo</span>
              </div>
            )}

            {/* Contador de preguntas */}
            <span className="font-semibold text-[11px] tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              {currentIndex + 1} / {totalQuestions}
            </span>

            {/* Botón Salir */}
            <button
              onClick={resetTest}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold transition border border-white/30 cursor-pointer shadow-xs"
              title="Salir del test y volver al menú principal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* Tarjeta de la Pregunta Actual (Estilo Cream Card ajustado para entrar en 1 pantalla) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id || currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="warm-cream-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-[#443930] space-y-3 sm:space-y-3.5 shadow-xl border border-[#d8ccc0]"
        >
          {/* Cabecera interna: Tags de tema, ley aplicable y botón X */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {temaBadgeTexto && (
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#eae1d5] text-[#554639] tracking-wider uppercase border border-[#d8ccc0] max-w-[280px] sm:max-w-md truncate">
                  {temaBadgeTexto}
                </span>
              )}
              {leyReferenciaTexto && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0e8de] text-[#6d5e51] border border-[#dcd0c3] flex items-center gap-1">
                  <Scale className="w-3 h-3 text-[#8a796b]" />
                  <span>{leyReferenciaTexto}</span>
                </span>
              )}
            </div>

            <button
              onClick={resetTest}
              className="p-1 rounded-lg hover:bg-[#ded3c7] text-[#8a796b] hover:text-[#3e342b] transition cursor-pointer shrink-0"
              title="Salir del test"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Enunciado oficial */}
          <h2 className="text-sm sm:text-base font-medium text-[#342a22] leading-snug">
            {enunciadoTexto}
          </h2>

          {/* Opciones A, B, C, D */}
          <div className="space-y-1.5 sm:space-y-2 pt-0.5">
            {opciones.map((opcion) => {
              const isSelected = selectedOption === opcion.key;
              const isCorrectOption = feedback && feedback.respuestaCorrecta === opcion.key;
              const isIncorrectOption = isSelected && feedback && !feedback.esCorrecta;

              let cardStyle = 'bg-white/80 border-[#ded3c7] hover:border-[#9a897b] hover:bg-white text-[#3f352c]';
              let badgeStyle = 'bg-[#eee6dc] text-[#5c4e42] border-[#ded3c7]';

              if (isAnswered) {
                if (isCorrectOption) {
                  cardStyle = 'bg-[#e2efe6] border-[#74a584] text-[#285038] font-semibold';
                  badgeStyle = 'bg-[#487e5b] text-white border-transparent';
                } else if (isIncorrectOption) {
                  cardStyle = 'bg-[#fbeae7] border-[#d8897c] text-[#7a392e] font-semibold';
                  badgeStyle = 'bg-[#b65345] text-white border-transparent';
                } else {
                  cardStyle = 'bg-white/30 border-transparent text-[#9a897b] opacity-45';
                }
              }

              return (
                <motion.button
                  key={opcion.key}
                  whileTap={!isAnswered ? { scale: 0.995 } : {}}
                  disabled={isAnswered || isLoading}
                  onClick={() => selectOption(opcion.key)}
                  className={`w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3 transition-all duration-150 cursor-pointer ${cardStyle}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${badgeStyle}`}>
                    {opcion.key}
                  </span>
                  <span className="text-xs sm:text-[13px] pt-0.5 flex-1 leading-snug">
                    {opcion.texto}
                  </span>

                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-[#487e5b] shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isIncorrectOption && (
                    <XCircle className="w-4 h-4 text-[#b65345] shrink-0 mt-0.5" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Bloque Explicativo con Fundamento Legal */}
          <AnimatePresence>
            {isAnswered && feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={`p-2.5 sm:p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                  feedback.esCorrecta
                    ? 'bg-[#e7f2eb] border-[#95bfa4] text-[#2c533c]'
                    : 'bg-[#fbece9] border-[#e09e93] text-[#823a2f]'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {feedback.esCorrecta 
                        ? '¡Respuesta Correcta!' 
                        : `Respuesta Incorrecta (Opción correcta: ${feedback.respuestaCorrecta})`}
                    </span>
                  </div>
                  <p className="text-[#594d42] leading-snug font-normal">
                    {feedback.explicacion || currentQuestion.explicacion}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botones de acción inferiores */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <button
              onClick={resetTest}
              className="text-xs text-[#8a796b] hover:text-[#3e342b] transition py-1 px-1 cursor-pointer flex items-center gap-1"
              title="Salir del test y volver al menú principal"
            >
              <X className="w-3.5 h-3.5" />
              <span>Salir del test</span>
            </button>

            <button
              onClick={nextQuestion}
              disabled={!isAnswered}
              className={`py-2 px-5 sm:py-2.5 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-150 active:scale-95 ${
                isAnswered
                  ? 'bg-[#3e342b] hover:bg-[#2c241d] text-white shadow-md cursor-pointer'
                  : 'bg-[#ded3c7] text-[#9a897b] cursor-not-allowed'
              }`}
            >
              {currentIndex + 1 < totalQuestions ? 'Siguiente Pregunta' : 'Ver Resultados'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
