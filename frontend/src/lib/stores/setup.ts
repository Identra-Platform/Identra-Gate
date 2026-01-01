import type { SetupStatusResponse } from "$lib/types/api";
import { checkSetupStatus } from "$lib/utils/api";
import { writable } from "svelte/store";

function createSetupStore() {
  const { subscribe, set, update } = writable<{
    status: SetupStatusResponse | null;
    loading: boolean;
    error: string | null;
  }>({
    status: null,
    loading: false,
    error: null
  });

  return {
    subscribe,
    checkStatus: async () => {
      update(state => ({...state, loading: true, error: null}));

      try {
        const status = await checkSetupStatus();
        set({ status, loading: false, error: null });
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
      }
    }
  };
}

export const setup = createSetupStore();