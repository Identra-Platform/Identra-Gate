<script lang="ts">
	import type { Snippet } from "svelte";
	import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    elevation?: 0 | 1 | 2 | 3 | 4 | 5;
    padding?: 'none' | 'small' | 'medium' | 'large';
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: Snippet<[]>;
  };
  let {
    elevation = 1,
    padding = 'medium',
    rounded = 'lg',
    children,
    ...rest
  }: (Props & SvelteHTMLElements['div']) = $props();

  const elevationClasses = {
    0: 'shadow-0',
    1: 'shadow-1',
    2: 'shadow-2',
    3: 'shadow-3',
    4: 'shadow-4',
    5: 'shadow-5'
  };
  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  };
</script>

<div
  class="surface-container bg-surface-container-lowest {elevationClasses[elevation]} {paddingClasses[padding]} {roundedClasses[rounded]} {rest.class}"
>
  {@render children()}
</div>