import { writable } from "svelte/store";

type Theme = 'light' | 'dark';

function createThemeStore() {
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';

    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const { subscribe, set, update } = writable<{
    current: Theme;
    systemPreference: Theme | null;
    loading: boolean;
    error: string | null;
  }>({
    current: getInitialTheme(),
    systemPreference: null,
    loading: false,
    error: null
  });

  if (typeof window !== 'undefined') {
    document.documentElement.classList.toggle('dark', getInitialTheme() === 'dark');
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const newPref: Theme = e.matches ? 'dark' : 'light';
      update(state => ({ ...state, systemPreference: newPref }));
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    
    update(state => ({
      ...state,
      systemPreference: mediaQuery.matches ? 'dark' : 'light'
    }));
  }

  return {
    subscribe,
    
    setTheme: (theme: Theme) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          
          localStorage.setItem('theme', theme);
          
          update(state => ({ 
            ...state, 
            current: theme, 
            loading: false 
          }));
          
          window.dispatchEvent(new CustomEvent('themechange', { 
            detail: theme 
          }));
        }
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Failed to set theme'
        }));
      }
    },
    
    toggleTheme: () => {
      if (theme.isDark()) theme.setTheme('light');
      else theme.setTheme('dark');
    },
    
    resetToSystem: () => {
      update(state => {
        if (state.systemPreference && typeof window !== 'undefined') {
          theme.setTheme(state.systemPreference);
          localStorage.removeItem('theme');
        }
        return state;
      });
    },
    
    syncWithSystem: () => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        theme.setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    },
    
    isDark: () => {
      let stateValue: { current: Theme } | undefined;
      const unsubscribe = subscribe(s => stateValue = s);
      unsubscribe();
      return stateValue?.current === 'dark';
    }
  };
}

export const theme = createThemeStore();