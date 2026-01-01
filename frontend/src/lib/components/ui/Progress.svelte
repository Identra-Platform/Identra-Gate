<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props {
		value?: number;
		max?: number;
		variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
		size?: 'small' | 'medium' | 'large';
		labelPosition?: 'inside' | 'outside';
		indeterminate?: boolean;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    label?: Snippet | string | undefined;
	}

	let {
		value = 0,
		max = 100,
		variant = 'primary',
		size = 'medium',
		labelPosition = 'outside',
		indeterminate = false,
		rounded = 'full',
    label = undefined,
		...restProps
	}: (Props & HTMLAttributes<HTMLDivElement>) = $props();

	// Ensure value is within bounds
	let normalizedValue = $derived(Math.min(Math.max(value, 0), max));
	let percentage = $derived((normalizedValue / max) * 100);

	const variantClasses = {
		default: 'bg-surface-container-high',
		primary: 'bg-primary',
		secondary: 'bg-secondary',
		success: 'bg-green-500',
		error: 'bg-red-500',
		warning: 'bg-yellow-500'
	};

	const trackVariantClasses = {
		default: 'bg-surface-container',
		primary: 'bg-primary/20',
		secondary: 'bg-secondary/20',
		success: 'bg-green-100',
		error: 'bg-red-100',
		warning: 'bg-yellow-100'
	};

	const sizeClasses = {
		small: 'h-1',
		medium: 'h-2',
		large: 'h-3'
	};

	const roundedClasses = {
		none: 'rounded-none',
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};

	const labelSizeClasses = {
		small: 'text-xs',
		medium: 'text-sm',
		large: 'text-base'
	};
</script>

<div class="w-full">
  {#if label && labelPosition === 'outside'}
    <div class="mb-2 flex justify-between">
      <span class="text-sm font-medium text-on-surface">
        {#if (typeof label === 'string')}
        {label}
        {:else}
        {@render label()}
        {/if}
      </span>
      <span class="text-sm font-medium text-on-surface-variant {labelSizeClasses[size]}">
        {Math.round(percentage)}%
      </span>
    </div>
  {/if}
  
  <div
    class="relative overflow-hidden {roundedClasses[rounded]} {sizeClasses[size]} {trackVariantClasses[variant]}"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax={max}
    aria-valuenow={normalizedValue}
  >
    {#if indeterminate}
      <div
        class="absolute inset-0 w-full {variantClasses[variant]} {roundedClasses[rounded]} animate-[progress-indeterminate_1.5s_ease-in-out_infinite]"
      ></div>
    {:else}
      <div
        class="h-full transition-all duration-300 ease-out {variantClasses[variant]} {roundedClasses[rounded]}"
        style="width: {percentage}%"
      >
        {#if label && labelPosition === 'inside'}
          <div class="flex h-full items-center justify-center">
            <span class="px-2 text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  {#if label && labelPosition === 'outside'}
    <!-- Already handled above -->
  {/if}
</div>

<style>
  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(200%);
    }
  }
</style>