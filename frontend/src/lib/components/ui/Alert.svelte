<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'info' | 'success' | 'warning' | 'error';
		title?: string;
		closable?: boolean;
		show?: boolean;
    actions?: Snippet<[]> | undefined;
    children: Snippet<[]>;
	}

	let {
		variant = 'info',
		title,
		closable = false,
		show = true,
    actions = undefined,
    children,
		...restProps
	}: (Props & HTMLAttributes<HTMLDivElement>) = $props();

	let timeoutId: NodeJS.Timeout | null = null;

	const variantConfig = {
		info: {
			icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
			bg: 'bg-primary-container',
			border: 'border-primary',
			text: 'text-on-primary-container',
			iconColor: 'text-primary'
		},
		success: {
			icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
			bg: 'bg-green-50 dark:bg-green-900/20',
			border: 'border-green-200 dark:border-green-800',
			text: 'text-green-800 dark:text-green-200',
			iconColor: 'text-green-600 dark:text-green-400'
		},
		warning: {
			icon: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
			bg: 'bg-yellow-50 dark:bg-yellow-900/20',
			border: 'border-yellow-200 dark:border-yellow-800',
			text: 'text-yellow-800 dark:text-yellow-200',
			iconColor: 'text-yellow-600 dark:text-yellow-400'
		},
		error: {
			icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
			bg: 'bg-red-50 dark:bg-red-900/20',
			border: 'border-red-200 dark:border-red-800',
			text: 'text-red-800 dark:text-red-200',
			iconColor: 'text-red-600 dark:text-red-400'
		}
	};

	let config = $derived(variantConfig[variant]);

	const close = () => {
		show = false;
		if (timeoutId) clearTimeout(timeoutId);
	};
</script>

{#if show}
  <div
    transition:fade={{ duration: 200 }}
    class="rounded-lg border p-4 animate-fade-in {config.bg} {config.border} {config.text}"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div class="shrink-0">
        <svg
          class="h-5 w-5 {config.iconColor}"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={config.icon} />
        </svg>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        {#if title}
          <h3 class="font-semibold leading-5 mb-1">
            {title}
          </h3>
        {/if}
        
        <div class="text-sm">
          {@render children()}
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-2">
        {#if actions}
          {@render actions()}
        {/if}
        
        {#if closable}
          <button
            type="button"
            onclick={close}
            class="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close alert"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}