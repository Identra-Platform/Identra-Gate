import type { LoginResponse } from "$lib/types/api";
import type { User } from "$lib/types/inferred";
import { login, logout, refreshToken } from "$lib/utils/api";
import { writable } from "svelte/store";

function createAuthStore() {
  const { subscribe, set, update } = writable<{
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: number | null;
    isAuthenticated: boolean;
    loading: boolean;
  }>({
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresIn: null,
    isAuthenticated: false,
    loading: false
  });

  return {
    subscribe,
    login: async (email: string, password: string): Promise<LoginResponse> => {
      update(state => ({ ...state, loading: true }));

      try {
        const data = await login({ email, password });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: Date.now() + (data.expiresIn * 1000),
          isAuthenticated: true,
          loading: false
        });

        return data;
      } catch (error) {
        update(state => ({ ...state, loading: false }));
        throw error;
      }
    },
    refreshToken: async () => {
      update(state => ({ ...state, loading: true }));

      let currentRefreshToken: string | null = null;
      const unsubscribe = subscribe(state => currentRefreshToken = state.refreshToken);
      unsubscribe();

      try {
        if (!currentRefreshToken)
          throw new Error('Not Authenticated');

        const data = await refreshToken({
          refreshToken: currentRefreshToken
        });

        update(state => ({
          ...state,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: Date.now() + (data.expiresIn * 1000),
          loading: false
        }));

        return data;
      } catch (error) {
        update(state => ({ ...state, loading: false }));
        throw error;
      }
    },
    logout: async () => {
      update(state => ({ ...state, loading: true }));

      try {
        const data = await logout();

        if (!data.success)
          throw new Error('Could not logout: ' + data.message);

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          isAuthenticated: false,
          loading: false
        });
      } catch (error) {
        update(state => ({ ...state, loading: false }));
        throw error;
      }
    }
  };
}

export const auth = createAuthStore();