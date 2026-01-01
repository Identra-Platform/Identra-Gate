<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props {
    variant?: 'filled' | 'outlined' | 'text' | 'tonal';
    size?: 'small' | 'medium' | 'large'
    loading?: boolean;
    fullWidth?: boolean;
    children: Snippet<[]>;
  };
  let {
    variant = 'filled',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    children,
    ...restProps
  }: (Props & HTMLButtonAttributes) = $props();

  let buttonRef: HTMLButtonElement;

  const variantClasses = {
    filled: 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80 disabled:bg-neutral-90 disabled:text-neutral-50',
    outlined: 'border border-outline text-primary bg-transparent hover:bg-primary/8 active:bg-primary/12 disabled:border-neutral-80 disabled:text-neutral-50',
    text: 'text-primary bg-transparent hover:bg-primary/8 active:bg-primary/12 disabled:text-neutral-50',
    tonal: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 active:bg-secondary-container/80 disabled:bg-neutral-90 disabled:text-neutral-50'
  };
  const sizeClasses = {
    small: 'h-8 px-3 text-sm',
    medium: 'h-10 px-4 text-base',
    large: 'h-12 px-6 text-lg'
  };
</script>

<button
  bind:this={buttonRef}
  {type}
  {disabled}
  onclick={(e) => !disabled && !loading}
  {...restProps}
  class="relative overflow-hidden rounded-full font-medium transition-all duration-200 {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''} {disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 {restProps.class}"
>
  <span class="flex items-center justify-center gap-2">
    {#if loading}
      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    {/if}
    {@render children()}
  </span>
</button>