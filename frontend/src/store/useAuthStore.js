import { create } from 'zustand';
import { api } from '../services/api';

const storedUser = localStorage.getItem('opobrain_user');
const storedToken = localStorage.getItem('opobrain_token');
const parsedUser = storedUser ? JSON.parse(storedUser) : null;
const initialDemoTests = parseInt(localStorage.getItem('opobrain_demo_tests_count') || '0', 10);

export const useAuthStore = create((set, get) => ({
  user: parsedUser,
  token: storedToken || null,
  isAuthenticated: Boolean(storedUser),
  isDemoMode: Boolean(parsedUser?.isDemo),
  demoTestsCompleted: initialDemoTests,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login({ username, password });
      const user = data.user;
      const token = data.token;

      localStorage.setItem('opobrain_user', JSON.stringify(user));
      localStorage.setItem('opobrain_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        isDemoMode: Boolean(user?.isDemo),
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      set({
        isLoading: false,
        error: err.message || 'Error al iniciar sesión',
      });
      return { success: false, message: err.message };
    }
  },

  enterDemoMode: () => {
    const demoUser = {
      id: 'demo-user',
      username: 'Invitado Demo',
      nombre: 'Opositor Demo',
      rol: 'demo',
      isDemo: true,
    };

    localStorage.setItem('opobrain_user', JSON.stringify(demoUser));
    localStorage.setItem('opobrain_token', 'demo-guest-token');

    set({
      user: demoUser,
      token: 'demo-guest-token',
      isAuthenticated: true,
      isDemoMode: true,
      error: null,
    });

    return { success: true, user: demoUser };
  },

  recordDemoTestCompletion: () => {
    const currentCount = parseInt(localStorage.getItem('opobrain_demo_tests_count') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('opobrain_demo_tests_count', String(newCount));
    set({ demoTestsCompleted: newCount });
  },

  resetDemoCount: () => {
    localStorage.removeItem('opobrain_demo_tests_count');
    set({ demoTestsCompleted: 0 });
  },

  logout: () => {
    localStorage.removeItem('opobrain_user');
    localStorage.removeItem('opobrain_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isDemoMode: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
