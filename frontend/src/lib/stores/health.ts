import type { HealthResponse } from "$lib/types/api";
import { fetchHealth } from "$lib/utils/api";
import { writable } from "svelte/store";

function createHealthStore() {
  const { subscribe, set, update } = writable<{
    data: HealthResponse | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  }>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  return {
    subscribe,
    fetch: async () => {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const data = await fetchHealth();
        set({
          data,
          loading: false,
          error: null,
          lastUpdated: null
        });
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
      }
    },
    refresh: async () => {
      const data = await fetchHealth();
      update(state => ({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    }
  }
}
export const health = createHealthStore();