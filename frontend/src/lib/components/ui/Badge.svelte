<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props {
		variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
		size?: 'small' | 'medium' | 'large';
		rounded?: 'sm' | 'md' | 'lg' | 'full';
		outlined?: boolean;
		icon?: string | null;
		iconPosition?: 'left' | 'right';
    children: Snippet<[]>;
	}

	let {
		variant = 'default',
		size = 'medium',
		rounded = 'full',
		outlined = false,
		icon = null,
		iconPosition = 'left',
    children,
		...restProps
	}: (Props & HTMLAttributes<HTMLSpanElement>) = $props();

	const variantClasses = {
		default: {
			filled: 'bg-surface-container-high text-on-surface-variant',
			outlined: 'border border-outline text-on-surface-variant'
		},
		primary: {
			filled: 'bg-primary text-on-primary',
			outlined: 'border border-primary text-primary'
		},
		secondary: {
			filled: 'bg-secondary-container text-on-secondary-container',
			outlined: 'border border-secondary text-secondary'
		},
		success: {
			filled: 'bg-green-500 text-white dark:bg-green-600 dark:text-emerald-50',
			outlined: 'border border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
		},
		error: {
			filled: 'bg-red-400 text-white dark:bg-rose-700 dark:text-rose-50',
			outlined: 'border border-rose-500 text-rose-700 dark:border-rose-400 dark:text-rose-300'
		},
		warning: {
			filled: 'bg-yellow-500 text-white dark:bg-yellow-600 dark:text-yellow-50',
			outlined: 'border border-amber-500 text-amber-800 dark:border-amber-400 dark:text-amber-200'
		},
		info: {
			filled: 'bg-sky-600 text-white dark:bg-sky-700 dark:text-sky-50',
			outlined: 'border border-sky-500 text-sky-700 dark:border-sky-400 dark:text-sky-300'
		}
	};

	const sizeClasses = {
		small: 'px-2 py-0.5 text-xs',
		medium: 'px-3 py-1 text-sm',
		large: 'px-4 py-1.5 text-base'
	};

	const roundedClasses = {
		sm: 'rounded-sm',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
</script>

<span
  class="inline-flex items-center font-medium transition-colors
         {outlined ? variantClasses[variant].outlined : variantClasses[variant].filled}
         {sizeClasses[size]}
         {roundedClasses[rounded]}
         {icon ? 'gap-1.5' : ''}"
>
  {#if icon && iconPosition === 'left'}
    <span class="h-3.5 w-3.5 shrink-0">{icon}</span>
  {/if}
  
  {@render children()}
  
  {#if icon && iconPosition === 'right'}
    <span class="h-3.5 w-3.5 shrink-0">{icon}</span>
  {/if}
</span>