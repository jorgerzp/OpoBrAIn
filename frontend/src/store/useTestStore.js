import { create } from 'zustand';
import { api } from '../services/api';

export const useTestStore = create((set, get) => ({
  // Estado
  testActive: false,
  testMode: null, // 'oficial' | 'tema' | 'repaso'
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

  // Iniciar test con preguntas cargadas
  startTest: (mode, questions, meta = {}) => {
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
    });
  },

  // Seleccionar una opción (A, B, C o D) antes o durante la confirmación
  selectOption: async (option) => {
    const { isAnswered, questions, currentIndex, score } = get();
    if (isAnswered) return; // Ya se respondió esta pregunta

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    set({ selectedOption: option, isAnswered: true, isLoading: true });

    try {
      // Registrar la respuesta y llamar al backend para el UPSERT en historial_errores
      const result = await api.responderPregunta({
        preguntaId: currentQuestion.id,
        respuestaSeleccionada: option,
      });

      const esCorrecta = result.es_correcta;

      set({
        isLoading: false,
        feedback: {
          esCorrecta,
          respuestaCorrecta: result.respuesta_correcta,
          explicacion: result.explicacion,
        },
        score: {
          aciertos: esCorrecta ? score.aciertos + 1 : score.aciertos,
          fallos: !esCorrecta ? score.fallos + 1 : score.fallos,
        },
      });
    } catch (err) {
      console.error('Error al responder:', err);
      // Fallback seguro
      const esCorrecta = currentQuestion.respuesta_correcta === option;
      set({
        isLoading: false,
        feedback: {
          esCorrecta,
          respuestaCorrecta: currentQuestion.respuesta_correcta,
          explicacion: currentQuestion.explicacion,
        },
        score: {
          aciertos: esCorrecta ? score.aciertos + 1 : score.aciertos,
          fallos: !esCorrecta ? score.fallos + 1 : score.fallos,
        },
      });
    }
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
    });
  },
}));
