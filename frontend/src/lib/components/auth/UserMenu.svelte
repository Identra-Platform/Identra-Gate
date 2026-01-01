<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import { onMount } from "svelte";
	import Button from "../ui/Button.svelte";
	import { slide } from "svelte/transition";

  let menuOpen = $state(false);
  let menuRef: HTMLElement;
  
  const toggleMenu = () => {
    menuOpen = !menuOpen;
  };
  const closeMenu = () => {
    menuOpen = false;
  };
  const handleLogout = async () => {
    closeMenu();
    await auth.logout();
    goto('/login');
  };

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef && !menuRef.contains(event.target as Node)) {
        closeMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative" bind:this={menuRef}>
  <!-- User Avatar Button -->
  <Button
    variant="text"
    size="small"
    onclick={toggleMenu}
    class="rounded-full"
  >
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        {#if $auth.user?.name}
          <span class="font-medium">
            {$auth.user.name.charAt(0).toUpperCase()}
          </span>
        {:else}
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        {/if}
      </div>
      <div class="hidden text-left md:block">
        <div class="text-sm font-medium text-on-surface">
          {$auth.user?.name || 'User'}
        </div>
        <div class="text-xs text-on-surface-variant">
          {$auth.user?.roles.find(role => role === 'admin') ? 'Administrator' : 'User'}
        </div>
      </div>
      <svg
        class="h-4 w-4 text-on-surface-variant transition-transform duration-200"
        class:rotate-180={menuOpen}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </Button>
  
  <!-- Dropdown Menu -->
  {#if menuOpen}
    <div
      class="absolute right-0 top-full z-50 mt-2 w-64 animate-slide-down overflow-hidden rounded-xl bg-surface-container-highest shadow-4"
      transition:slide={{ duration: 200 }}
    >
      <!-- User Info -->
      <div class="border-b border-outline-variant p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary">
            {#if $auth.user?.name}
              <span class="text-lg font-bold">
                {$auth.user.name.charAt(0).toUpperCase()}
              </span>
            {:else}
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            {/if}
          </div>
          <div>
            <div class="font-semibold text-on-surface">
              {$auth.user?.name || 'User'}
            </div>
            <div class="text-sm text-on-surface-variant">
              {$auth.user?.email}
            </div>
            <div class="mt-1">
              <span class="inline-flex items-center rounded-full bg-secondary-container px-2 py-1 text-xs font-medium text-on-secondary-container">
                {#if $auth.user?.roles.find(role => role === 'admin')}
                  <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Administrator
                {:else}
                  <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  User
                {/if}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Menu Items -->
      <div class="py-2">
        {#if $auth.user?.roles.find(role => role === 'admin')}
          <a
            href="/admin"
            onclick={closeMenu}
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <svg class="h-5 w-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span>Admin Dashboard</span>
          </a>
        {/if}
      </div>
      
      <!-- Logout -->
      <div class="border-t border-outline-variant p-2">
        <button
          onclick={handleLogout}
          class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-error transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  {/if}
</div>