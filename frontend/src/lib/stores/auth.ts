import { browser } from "$app/environment";
import type { LoginResponse, ProfileResponse, User } from "$lib/types/api";
import { getProfile, login, logout } from "$lib/utils/api";
import { writable } from "svelte/store";

export interface AuthState {
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    name?: string;
  } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastLogin?: string;
}

const defaultAuthState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false
};

const initializeAuth = (): AuthState => {
  if (!browser) return defaultAuthState;

  try {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      if (parsed.accessToken && parsed.user) {
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return {
            ...parsed,
            isLoading: false
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse stored auth: ', error);
  }

  return defaultAuthState;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initializeAuth());

  const saveToStorage = (state: AuthState, expiresIn = 3600) => {
    if (!browser) return;
    const expiresAt = Date.now() + (expiresIn * 1000);
    localStorage.setItem('auth', JSON.stringify({
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated: state.isAuthenticated,
      expiresAt
    }));
  };

  const clearStorage = () => {
    if (!browser) return;
    localStorage.removeItem('auth');
  }

  return {
    subscribe,
    login: async (username: string, password: string): Promise<LoginResponse> => {
      update(state => ({ ...state, isLoading: true }));

      try {
        const response = await login({ username, password });

        const authState: AuthState = {
          user: response.user,
          accessToken: response.access_token,
          isAuthenticated: true,
          isLoading: false,
          lastLogin: new Date().toISOString()
        };

        set(authState);
        saveToStorage(authState, 3600);

        return response;
      } catch (error) {
        update(state => ({ ...state, isLoading: false }));
        throw error;
      }
    },
    logout: async () => {
      try {
        const state = initializeAuth();
        if (state.accessToken) {
          await logout();
        }
      } catch (error) {
        console.error('Logout API error:', error);
      } finally {
        const newState: AuthState = { 
          user: null, 
          accessToken: null, 
          isAuthenticated: false, 
          isLoading: false 
        };
        set(newState);
        clearStorage();
      }
    },
    getProfile: async (): Promise<ProfileResponse> => {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const profile = await getProfile();
        
        update(state => ({
          ...state,
          user: {
            ...state.user,
            ...profile
          },
          isLoading: false
        }));
        
        // Update storage with new profile data
        const currentState = initializeAuth();
        if (currentState.accessToken) {
          saveToStorage({
            ...currentState,
            user: {
              ...currentState.user,
              ...profile
            }
          });
        }
        
        return profile;
      } catch (error) {
        update(state => ({ ...state, isLoading: false }));
        throw error;
      }
    },
    refreshToken: async () => {
      const state = initializeAuth();
      if (!state.accessToken) {
        throw new Error('No access token available');
      }
      
      update(s => ({ ...s, isLoading: true }));
      
      try {
        const newExpiresAt = Date.now() + (3600 * 1000);
        saveToStorage(state, 3600);
        
        update(s => ({ ...s, isLoading: false }));
      } catch (error) {
        const failedState: AuthState = defaultAuthState;
        set(failedState);
        clearStorage();
        throw error;
      }
    },
    isTokenExpired: (): boolean => {
      if (!browser) return true;
      
      try {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          return !parsed.expiresAt || Date.now() >= parsed.expiresAt;
        }
      } catch (error) {
        console.error('Failed to check token expiration:', error);
      }
      
      return true;
    },
    hasRole: (role: string): boolean => {
      const state = initializeAuth();
      return state.user?.roles.includes(role) || false;
    },
    
    hasAnyRole: (roles: string[]): boolean => {
      const state = initializeAuth();
      return roles.some(role => state.user?.roles.includes(role)) || false;
    },
    
    isAdmin: (): boolean => {
      return auth.hasRole('admin');
    },
    updateUser: (userData: Partial<User>) => {
      update(state => {
        if (!state.user) return state;
        
        const updatedUser = { ...state.user, ...userData };
        const newState = { ...state, user: updatedUser };
        
        saveToStorage(newState);
        return newState;
      });
    },
    clear: () => {
      set(defaultAuthState);
      clearStorage();
    }
  };
}

export const auth = createAuthStore();