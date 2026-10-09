import { create } from 'zustand';
import { api } from '../services/api';

const storedUser = localStorage.getItem('opobrain_user');
const storedToken = localStorage.getItem('opobrain_token');

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: Boolean(storedUser),
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

  logout: () => {
    localStorage.removeItem('opobrain_user');
    localStorage.removeItem('opobrain_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
