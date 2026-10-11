import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Home, 
  Award, 
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { useTestStore } from '../store/useTestStore';

export const TestRunner = () => {
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
    selectOption,
    nextQuestion,
    resetTest,
  } = useTestStore();

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Pantalla de Resultados al finalizar el test
  if (isCompleted) {
    const aciertos = score.aciertos;
    const fallos = score.fallos;
    const penalizacion = (fallos * 0.33);
    const puntuacionNeta = Math.max(0, aciertos - penalizacion).toFixed(2);
    const notaSobreDiez = totalQuestions > 0 ? ((puntuacionNeta / totalQuestions) * 10).toFixed(2) : 0;
    const esAprobado = parseFloat(notaSobreDiez) >= 5.0;

    return (
      <div className="relative z-10 max-w-xl mx-auto px-4 py-6 sm:py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="warm-cream-card rounded-3xl p-8 sm:p-10 text-[#443930] text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#9a897b] text-white flex items-center justify-center shadow-md">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#8a796b]">
              Baremo Oficial C1 (INAP)
            </span>
            <h2 className="text-3xl font-light text-[#372d25]">
              {esAprobado ? '¡Test Superado!' : 'Sesión Finalizada'}
            </h2>
            <p className="text-xs text-[#736457]">
              {testMeta?.titulo || 'Evaluación de Oposiciones'}
            </p>
          </div>

          {/* Baremo INAP C1 */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#eae2d7] border border-[#d8ccc0]">
            <div>
              <div className="text-2xl font-bold text-[#446b52]">{aciertos}</div>
              <div className="text-[11px] text-[#736457]">Aciertos (+1.0)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#9e5d52]">{fallos}</div>
              <div className="text-[11px] text-[#736457]">Fallos (-0.33)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#3e342b]">{notaSobreDiez} <span className="text-xs font-normal">/10</span></div>
              <div className="text-[11px] text-[#736457]">Nota Final</div>
            </div>
          </div>

          <button
            onClick={resetTest}
            className="w-full py-3.5 px-6 bg-[#3e342b] hover:bg-[#2c241d] text-white font-semibold rounded-2xl text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition shadow-md"
          >
            <Home className="w-4 h-4" /> Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="relative z-10 max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white/80 text-sm">No hay preguntas para esta selección.</p>
        <button onClick={resetTest} className="pill-outline-btn rounded-full px-6 py-2 text-xs">
          Volver
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

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Barra superior con navegación y progreso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-2">
            <button
              onClick={resetTest}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
              title="Volver"
            >
              <Home className="w-4 h-4" />
            </button>
            <span className="font-medium truncate max-w-xs sm:max-w-md">
              {testMeta?.titulo || 'Test Activo'}
            </span>
          </div>
          <span className="font-semibold tracking-wider">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Barra de progreso con resplandor suave */}
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      {/* Tarjeta de la Pregunta Actual (Estilo Cream Card) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25 }}
          className="warm-cream-card rounded-3xl p-6 sm:p-9 text-[#443930] space-y-6 shadow-2xl"
        >
          {/* Tags de Tema o Año */}
          <div className="flex items-center gap-2 flex-wrap">
            {(currentQuestion.tema_numero || currentQuestion.tema_nombre) && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#eae1d5] text-[#6d5e51] tracking-wider uppercase border border-[#d8ccc0]">
                {currentQuestion.tema_numero ? `Tema ${currentQuestion.tema_numero}` : currentQuestion.tema_nombre}
              </span>
            )}
            {currentQuestion.anio_examen ? (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#eae1d5] text-[#6d5e51] tracking-wider uppercase border border-[#d8ccc0]">
                Convocatoria {currentQuestion.anio_examen}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#dfd6ca] text-[#55473a] tracking-wider uppercase">
                C1 Estado (AGE)
              </span>
            )}
          </div>

          {/* Enunciado */}
          <h2 className="text-base sm:text-lg font-medium text-[#342a22] leading-relaxed">
            {currentQuestion.enunciado}
          </h2>

          {/* Opciones A, B, C, D */}
          <div className="space-y-3 pt-2">
            {opciones.map((opcion) => {
              const isSelected = selectedOption === opcion.key;
              const isCorrectOption = feedback && feedback.respuestaCorrecta === opcion.key;
              const isIncorrectOption = isSelected && feedback && !feedback.esCorrecta;

              let cardStyle = 'bg-white/80 border-[#ded3c7] hover:border-[#9a897b] hover:bg-white text-[#3f352c]';
              let badgeStyle = 'bg-[#eee6dc] text-[#5c4e42] border-[#ded3c7]';

              if (isAnswered) {
                if (isCorrectOption) {
                  // Acierto: Verde salvia elegante
                  cardStyle = 'bg-[#e2efe6] border-[#74a584] text-[#285038] font-semibold';
                  badgeStyle = 'bg-[#487e5b] text-white border-transparent';
                } else if (isIncorrectOption) {
                  // Fallo: Terracota suave
                  cardStyle = 'bg-[#fbeae7] border-[#d8897c] text-[#7a392e] font-semibold';
                  badgeStyle = 'bg-[#b65345] text-white border-transparent';
                } else {
                  cardStyle = 'bg-white/30 border-transparent text-[#9a897b] opacity-50';
                }
              }

              return (
                <motion.button
                  key={opcion.key}
                  whileTap={!isAnswered ? { scale: 0.995 } : {}}
                  disabled={isAnswered || isLoading}
                  onClick={() => selectOption(opcion.key)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all duration-200 ${cardStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${badgeStyle}`}>
                    {opcion.key}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5 flex-1 leading-normal">
                    {opcion.texto}
                  </span>

                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-[#487e5b] shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isIncorrectOption && (
                    <XCircle className="w-5 h-5 text-[#b65345] shrink-0 mt-0.5" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Bloque Explicativo (Framer Motion) */}
          <AnimatePresence>
            {isAnswered && feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${
                  feedback.esCorrecta
                    ? 'bg-[#e7f2eb] border-[#95bfa4] text-[#2c533c]'
                    : 'bg-[#fbece9] border-[#e09e93] text-[#823a2f]'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>{feedback.esCorrecta ? '¡Respuesta Correcta!' : `Respuesta Incorrecta (Opción correcta: ${feedback.respuestaCorrecta})`}</span>
                  </div>
                  <p className="text-[#594d42] leading-relaxed font-normal">
                    {feedback.explicacion || currentQuestion.explicacion}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Siguiente Pregunta (Adaptado a móvil) */}
          <div className="flex justify-end pt-2">
            <button
              onClick={nextQuestion}
              disabled={!isAnswered}
              className={`w-full sm:w-auto py-3 px-6 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200 active:scale-95 ${
                isAnswered
                  ? 'bg-[#3e342b] hover:bg-[#2c241d] text-white shadow-md cursor-pointer'
                  : 'bg-[#ded3c7] text-[#9a897b] cursor-not-allowed'
              }`}
            >
              {currentIndex + 1 < totalQuestions ? 'Siguiente Pregunta' : 'Ver Resultados'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
