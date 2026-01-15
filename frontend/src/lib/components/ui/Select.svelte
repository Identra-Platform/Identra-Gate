<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
  
  export let label: string;
  export let value: string | number | null = null;
  export let options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
    icon?: string;
    group?: string;
  }> = [];
  export let placeholder = 'Select an option';
  export let error = '';
  export let required = false;
  export let disabled = false;
  export let helperText = '';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let fullWidth = false;
  export let groups: string[] = [];
  export let multiple = false;
  export let selectedValues: (string | number)[] = [];
  
  let isOpen = false;
  let focused = false;
  let selectedLabel = '';
  let searchQuery = '';
  let filteredOptions = [...options];
  let selectRef: HTMLDivElement;
  let listboxRef: HTMLUListElement;
  let focusedIndex = -1;
  
  const dispatch = createEventDispatcher();
  
  // Update selected label when value changes
  $: if (value !== null) {
    const option = options.find(opt => opt.value === value);
    selectedLabel = option?.label || '';
  }
  
  $: if (multiple && selectedValues.length > 0) {
    selectedLabel = `${selectedValues.length} selected`;
  } else if (multiple) {
    selectedLabel = placeholder;
  }
  
  $: {
    filteredOptions = options.filter(option => {
      const matchesSearch = !searchQuery || 
        option.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
    
    // Reset focused index when filtering
    if (focusedIndex >= filteredOptions.length) {
      focusedIndex = -1;
    }
  }
  
  // Close dropdown when clicking outside
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef && !selectRef.contains(event.target as Node)) {
        isOpen = false;
        searchQuery = '';
        focusedIndex = -1;
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          isOpen = false;
          searchQuery = '';
          focusedIndex = -1;
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          focusedIndex = (focusedIndex + 1) % filteredOptions.length;
          scrollToFocused();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          focusedIndex = focusedIndex <= 0 ? filteredOptions.length - 1 : focusedIndex - 1;
          scrollToFocused();
          break;
          
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
          
        case 'Tab':
          isOpen = false;
          searchQuery = '';
          focusedIndex = -1;
          break;
          
        default:
          // Handle typing for search
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            searchQuery += event.key.toLowerCase();
            setTimeout(() => searchQuery = '', 500); // Clear after delay
          }
          break;
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  function scrollToFocused() {
    if (listboxRef && focusedIndex >= 0) {
      const items = listboxRef.querySelectorAll('li[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  function toggleDropdown() {
    if (disabled) return;
    
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      focusedIndex = filteredOptions.findIndex(opt => opt.value === value);
      setTimeout(() => {
        if (listboxRef) {
          listboxRef.focus();
        }
      }, 10);
    }
  }
  
  function handleSelect(selectedValue: string | number) {
    if (multiple) {
      const newSelected = selectedValues.includes(selectedValue)
        ? selectedValues.filter(v => v !== selectedValue)
        : [...selectedValues, selectedValue];
      
      selectedValues = newSelected;
      dispatch('change', { value: newSelected });
      dispatch('input', { value: newSelected });
    } else {
      value = selectedValue;
      isOpen = false;
      searchQuery = '';
      focusedIndex = -1;
      dispatch('change', { value: selectedValue });
      dispatch('input', { value: selectedValue });
    }
  }
  
  function clearSelection() {
    if (disabled) return;
    
    if (multiple) {
      selectedValues = [];
      dispatch('change', { value: [] });
      dispatch('input', { value: [] });
    } else {
      value = null;
      selectedLabel = '';
      dispatch('change', { value: null });
      dispatch('input', { value: null });
    }
  }
  
  function isSelected(optionValue: string | number): boolean {
    if (multiple) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  }
  
  function getGroupedOptions() {
    if (!groups.length) return [{ group: null, options: filteredOptions }];
    
    return groups.map(group => ({
      group,
      options: filteredOptions.filter(opt => opt.group === group)
    })).filter(group => group.options.length > 0);
  }
  
  const sizeClasses = {
    small: 'py-1.5 text-sm',
    medium: 'py-2.5 text-base',
    large: 'py-3 text-lg'
  };
</script>

<div
  class="relative"
  class:w-full={fullWidth}
  bind:this={selectRef}
>
  <!-- Label -->
  {#if label}
    <label
      class="block text-sm font-medium text-on-surface-variant transition-all duration-200 mb-1"
      class:text-primary={focused}
      class:text-error={error}
      for="error"
    >
      {label} {#if required}<span class="text-error">*</span>{/if}
    </label>
  {/if}
  
  <!-- Select Trigger -->
  <button
    class="relative rounded-lg border transition-all duration-200 cursor-pointer {sizeClasses[size]} {focused ? 'border-2' : ''} {focused && !error ? 'border-primary' : error ? 'border-error' : 'border-outline-variant'} {!disabled ? 'bg-surface-container-high' : 'bg-neutral-95'} {disabled ? 'cursor-not-allowed opacity-50' : ''}"
    onclick={toggleDropdown}
    onfocusin={() => focused = true}
    onfocusout={() => {
      if (!isOpen) focused = false;
    }}
    tabindex={disabled ? -1 : 0}
    role="combobox"
    aria-controls={selectedValues.join(' ')}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-disabled={disabled}
    aria-label={label || 'Select'}
  >
    <!-- Selected Value Display -->
    <div class="flex items-center justify-between px-4">
      <div class="flex items-center gap-2 truncate">
        {#if multiple && selectedValues.length > 0}
          <!-- Multiple Selection Display -->
          <div class="flex flex-wrap gap-1">
            {#each selectedValues.slice(0, 3) as selectedValue}
              {#each options as option}
                {#if option.value === selectedValue}
                  <span class="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-1 text-xs text-on-primary-container">
                    {#if option.icon}
                      <span class="text-xs">{option.icon}</span>
                    {:else}
                      <span>{option.label.charAt(0)}</span>
                    {/if}
                    {option.label}
                    <Button
                      type="button"
                      onclick={(e) => {
                        e.stopPropagation();
                        handleSelect(selectedValue);
                      }}
                      class="ml-1 hover:text-on-primary-container/80"
                    >
                      ×
                    </Button>
                  </span>
                {/if}
              {/each}
            {/each}
            {#if selectedValues.length > 3}
              <span class="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
                +{selectedValues.length - 3} more
              </span>
            {/if}
          </div>
        {:else}
          <!-- Single Selection Display -->
          <span class:opacity-50={!selectedLabel}>
            {selectedLabel || placeholder}
          </span>
        {/if}
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Clear Button -->
        {#if (value !== null || (multiple && selectedValues.length > 0)) && !disabled}
          <Button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            class="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
            aria-label="Clear selection"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        {/if}
        
        <!-- Dropdown Icon -->
        <svg
          class="h-5 w-5 text-on-surface-variant transition-transform duration-200"
          class:rotate-180={isOpen}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </button>
  
  <!-- Dropdown Menu -->
  {#if isOpen}
    <div
      class="absolute z-50 mt-1 w-full animate-scale-in overflow-hidden rounded-xl bg-surface-container-highest shadow-4"
      style={`max-height: ${size === 'small' ? '12rem' : size === 'large' ? '16rem' : '14rem'};`}
      role="presentation"
    >
      <!-- Search Input (if many options) -->
      {#if options.length > 10}
        <div class="border-b border-outline-variant p-2">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search options..."
              class="w-full rounded-lg bg-surface-container-high py-2 pl-9 pr-3 text-sm text-on-surface focus:outline-none"
              oninput={() => focusedIndex = -1}
            />
          </div>
        </div>
      {/if}
      
      <!-- Options List -->
      <ul
        bind:this={listboxRef}
        class="overflow-y-auto py-1"
        style={`max-height: ${options.length > 10 ? 'calc(100% - 3rem)' : '100%'};`}
        role="listbox"
        aria-multiselectable={multiple}
        tabindex="-1"
      >
        {#if filteredOptions.length === 0}
          <li class="px-4 py-3 text-center text-sm text-on-surface-variant">
            No options found
          </li>
        {:else}
          {#each getGroupedOptions() as groupItem}
            <!-- Group Header -->
            {#if groupItem.group}
              <li class="sticky top-0 z-10 bg-surface-container px-3 py-1">
                <div class="text-xs font-semibold uppercase text-on-surface-variant">
                  {groupItem.group}
                </div>
              </li>
            {/if}
            
            <!-- Group Options -->
            {#each groupItem.options as option, i}
              <li
                role="option"
                aria-selected={isSelected(option.value)}
                aria-disabled={option.disabled}
                class="flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer select-none"
                class:bg-surface-container-high={focusedIndex === filteredOptions.indexOf(option)}
                class:bg-primary={isSelected(option.value)}
                class:text-primary={isSelected(option.value)}
                class:text-on-surface={!isSelected(option.value)}
                class:hover:bg-surface-container-high={!option.disabled && focusedIndex !== filteredOptions.indexOf(option) && !isSelected(option.value)}
                class:opacity-50={option.disabled}
                class:cursor-not-allowed={option.disabled}
              >
                <Button
                  onclick={() => !option.disabled && handleSelect(option.value)}
                  onmouseenter={() => !option.disabled && (focusedIndex = filteredOptions.indexOf(option))}
                >
                  <!-- Checkbox for Multiple Selection -->
                  {#if multiple}
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded border"
                      class:border-primary={isSelected(option.value)}
                      class:border-outline-variant={!isSelected(option.value)}
                      class:bg-primary={isSelected(option.value)}
                    >
                      {#if isSelected(option.value)}
                        <svg class="h-3 w-3 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      {/if}
                    </div>
                  {:else}
                    <!-- Radio for Single Selection -->
                    <div
                      class="flex h-5 w-5 items-center justify-center rounded-full border"
                      class:border-primary={isSelected(option.value)}
                      class:border-outline-variant={!isSelected(option.value)}
                    >
                      {#if isSelected(option.value)}
                        <div class="h-2.5 w-2.5 rounded-full bg-primary"></div>
                      {/if}
                    </div>
                  {/if}
                  
                  <!-- Icon -->
                  {#if option.icon}
                    <span class="text-on-surface-variant">{option.icon}</span>
                  {/if}
                  
                  <!-- Option Label -->
                  <span class="flex-1">{option.label}</span>
                  
                  <!-- Selected Indicator (for single select) -->
                  {#if !multiple && isSelected(option.value)}
                    <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </Button>
              </li>
            {/each}
          {/each}
        {/if}
      </ul>
      
      <!-- Selected Count for Multiple -->
      {#if multiple && selectedValues.length > 0}
        <div class="border-t border-outline-variant bg-surface-container px-4 py-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-on-surface-variant">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              onclick={() => selectedValues = []}
              class="text-primary hover:text-primary/80"
            >
              Clear all
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Helper/Error Text -->
  {#if helperText || error}
    <p class="mt-1 text-xs" class:text-error={error} class:text-on-surface-variant={!error}>
      {error || helperText}
    </p>
  {/if}
</div>

<style>
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
  
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Custom scrollbar */
  ul::-webkit-scrollbar {
    width: 6px;
  }
  
  ul::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ul::-webkit-scrollbar-thumb {
    background: var(--color-outline-variant);
    border-radius: 3px;
  }
  
  ul::-webkit-scrollbar-thumb:hover {
    background: var(--color-outline);
  }
</style>