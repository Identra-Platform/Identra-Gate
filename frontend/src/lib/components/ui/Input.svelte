<script lang="ts">
	import type { Icon as IconType } from "lucide-svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

	interface Props {
		label?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
		value?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		helperText?: string;
		leadingIcon?: typeof IconType | null;
		trailingIcon?: typeof IconType | null;
	}

	let {
		label = '',
		type = 'text',
		value = $bindable(''),
		error = '',
		required = false,
		disabled = false,
		placeholder = '',
		helperText = '',
		leadingIcon = null,
		trailingIcon = null,
		...restProps
	}: (Props & HTMLInputAttributes) = $props();

	let focused = $state(false);
	let id = Math.random().toString(36).substring(2);

	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		value = target.value;
	};
</script>

<div class="space-y-1">
  {#if label}
    <label
      for={id}
      class="block text-sm font-medium text-on-surface-variant transition-all duration-200
             {focused || value ? 'text-primary' : ''}
             {error ? 'text-error' : ''}"
    >
      {label} {#if required}<span class="text-error">*</span>{/if}
    </label>
  {/if}
  
  <div
    class="relative rounded-lg border transition-all duration-200
           {error ? 'border-error' : 'border-outline-variant'}
           {focused ? 'border-2 border-primary' : ''}
           {disabled ? 'bg-neutral-95 border-neutral-80' : 'bg-surface-container-high'}"
  >
    {#if leadingIcon}
      {@const Icon = leadingIcon}
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <Icon />
      </div>
    {/if}
    
    <input
      {id}
      {type}
      {value}
      {placeholder}
      {disabled}
      onfocus={() => focused = true}
      onblur={() => focused = false}
      oninput={handleInput}
      class="w-full bg-transparent px-4 py-3 text-on-surface focus:outline-none
             {leadingIcon ? 'pl-12' : ''}
             {trailingIcon ? 'pr-10' : ''}
             {disabled ? 'text-neutral-50 cursor-not-allowed' : ''}"
    />
    
    {#if trailingIcon}
      {@const Icon = trailingIcon}
      <div class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <Icon />
      </div>
    {/if}
  </div>
  
  {#if helperText || error}
    <p class="text-xs {error ? 'text-error' : 'text-on-surface-variant'}">
      {error || helperText}
    </p>
  {/if}
</div>