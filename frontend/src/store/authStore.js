// smart-inventory/frontend/src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,

      login: (user, token) => {
        localStorage.setItem('si_token', token);
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('si_token');
        localStorage.removeItem('si_user');
        set({ user: null, token: null });
      },

      updateUser: (data) => set(state => ({ user: { ...state.user, ...data } })),
    }),
    {
      name: 'si_user',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
