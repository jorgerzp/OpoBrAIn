import { create } from 'zustand';
import { api } from '../services/api';

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
    const { isTimed, remainingSeconds, isCompleted } = get();
    if (!isTimed || isCompleted || remainingSeconds === null) return;

    if (remainingSeconds <= 1) {
      set({
        remainingSeconds: 0,
        isCompleted: true,
        timerExpired: true,
      });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  // Finalizar explícitamente por tiempo
  finishDueToTimeout: () => {
    set({
      isCompleted: true,
      timerExpired: true,
      remainingSeconds: 0,
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
        aciertos: esCorrecta ? score.aciertos + 1 : score.aciertos,
        fallos: !esCorrecta ? score.fallos + 1 : score.fallos,
      },
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
    const { currentIndex, questions } = get();
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
