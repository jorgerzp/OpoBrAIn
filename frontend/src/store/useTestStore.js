import { create } from 'zustand';
import { api } from '../services/api';
import { statsService } from '../services/statsService';

export const useTestStore = create((set, get) => ({
  // Estado
  testActive: false,
  testMode: null, // 'oficial' | 'tema' | 'personalizado' | 'repaso'
  testMeta: {},
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  isAnswered: false,
  feedback: null, // { esCorrecta, respuestaCorrecta, explicacion }
  isLoading: false,
  isCompleted: false,
  score: {
    aciertos: 0,
    fallos: 0,
  },

  // Temporizador
  isTimed: false,
  timeLimitMinutes: null,
  remainingSeconds: null,
  timerExpired: false,

  // Iniciar test con preguntas cargadas y configuración
  startTest: (mode, questions, meta = {}) => {
    const isTimed = Boolean(meta.isTimed && meta.timeLimitMinutes > 0);
    const totalSeconds = isTimed ? meta.timeLimitMinutes * 60 : null;

    set({
      testActive: true,
      testMode: mode,
      testMeta: meta,
      questions: questions || [],
      currentIndex: 0,
      selectedOption: null,
      isAnswered: false,
      feedback: null,
      isCompleted: false,
      score: { aciertos: 0, fallos: 0 },
      isTimed,
      timeLimitMinutes: isTimed ? meta.timeLimitMinutes : null,
      remainingSeconds: totalSeconds,
      timerExpired: false,
    });
  },

  // Reducir un segundo del temporizador
  tickTimer: () => {
    const { isTimed, remainingSeconds, isCompleted, score, questions, testMeta, testMode } = get();
    if (!isTimed || isCompleted || remainingSeconds === null) return;

    if (remainingSeconds <= 1) {
      set({
        remainingSeconds: 0,
        isCompleted: true,
        timerExpired: true,
      });
      // Guardar finalización del test en estadísticas reales
      statsService.recordTestCompletion({
        aciertos: score.aciertos,
        fallos: score.fallos,
        total: questions.length,
        titulo: testMeta?.titulo,
        modo: testMode,
      });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  // Finalizar explícitamente por tiempo
  finishDueToTimeout: () => {
    const { score, questions, testMeta, testMode } = get();
    set({
      isCompleted: true,
      timerExpired: true,
      remainingSeconds: 0,
    });
    statsService.recordTestCompletion({
      aciertos: score.aciertos,
      fallos: score.fallos,
      total: questions.length,
      titulo: testMeta?.titulo,
      modo: testMode,
    });
  },

  // Seleccionar una opción (A, B, C o D)
  selectOption: async (option) => {
    const { isAnswered, questions, currentIndex, score, isCompleted } = get();
    if (isAnswered || isCompleted) return; // Ya se respondió esta pregunta o test finalizado

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const optNormalizada = option.trim().toUpperCase();
    const respEsperada = (currentQuestion.respuesta_correcta || 'A').trim().toUpperCase();
    const esCorrecta = optNormalizada === respEsperada;
    const explicacion = currentQuestion.explicacion || 'Fundamento legal aplicable conforme al temario oficial del Estado.';

    const nuevosAciertos = esCorrecta ? score.aciertos + 1 : score.aciertos;
    const nuevosFallos = !esCorrecta ? score.fallos + 1 : score.fallos;

    set({ 
      selectedOption: option, 
      isAnswered: true, 
      isLoading: false,
      feedback: {
        esCorrecta,
        respuestaCorrecta: respEsperada,
        explicacion,
      },
      score: {
        aciertos: nuevosAciertos,
        fallos: nuevosFallos,
      },
    });

    // Guardar respuesta real en el servicio de estadísticas (actualiza aciertos, fallos y banco de errores)
    statsService.recordAnswer({
      question: currentQuestion,
      isCorrect: esCorrecta,
    });

    // En segundo plano, notificar al backend si está disponible (sin bloquear la interacción del opositor)
    try {
      api.responderPregunta({
        preguntaId: currentQuestion.id,
        respuestaSeleccionada: option,
      }).catch(() => {});
    } catch (_) {}
  },

  // Pasar a la siguiente pregunta o finalizar el test
  nextQuestion: () => {
    const { currentIndex, questions, score, testMeta, testMode } = get();
    if (currentIndex + 1 < questions.length) {
      set({
        currentIndex: currentIndex + 1,
        selectedOption: null,
        isAnswered: false,
        feedback: null,
      });
    } else {
      set({
        isCompleted: true,
      });
      // Guardar test completado en estadísticas reales
      statsService.recordTestCompletion({
        aciertos: score.aciertos,
        fallos: score.fallos,
        total: questions.length,
        titulo: testMeta?.titulo,
        modo: testMode,
      });
    }
  },

  // Cancelar y volver al Dashboard principal
  resetTest: () => {
    set({
      testActive: false,
      testMode: null,
      questions: [],
      currentIndex: 0,
      selectedOption: null,
      isAnswered: false,
      feedback: null,
      isCompleted: false,
      score: { aciertos: 0, fallos: 0 },
      isTimed: false,
      timeLimitMinutes: null,
      remainingSeconds: null,
      timerExpired: false,
    });
  },
}));
