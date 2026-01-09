<script lang="ts">
	import { page } from "$app/state";
	import { theme } from "$lib/stores/theme";
	import { Moon, Sun, Thermometer } from "lucide-svelte";
	import { onMount } from "svelte";
	import Logo from "./Logo.svelte";
	import { auth } from "$lib/stores/auth";
	import UserMenu from "../auth/UserMenu.svelte";
	import Button from "./Button.svelte";
	import { goto } from "$app/navigation";

  interface Props {
    mobileMenuOpen?: boolean;
    currentTime?: Date;
  }
  let {
    mobileMenuOpen = false,
    currentTime = new Date()
  }: Props = $props();

  onMount(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 6000);

    return () => clearInterval(interval);
  });

  let isDark = $derived(!theme.isDark());
  const toggleTheme = () => {
    theme.toggleTheme();
    isDark = !isDark;
  };

  const toggleMobileMenu = () => {
    mobileMenuOpen = !mobileMenuOpen;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<header class="sticky top-0 z-50 border-b border-outline bg-surface">
  <div class="container mx-auto px-4">
    <div class="flex h-14 items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2 rounded-lg p-2 hover:bg-surface-container">
          <Logo class='h-8' />
          <div class="hidden sm:block">
            <div class="text-sm font-semibold text-on-surface">
              Identra
            </div>
          </div>
        </a>
      </div>

      <nav class="hidden absolute left-5/11 gap-1 md:flex">
        <a href="/" class="rounded-lg px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container"
          class:bg-surface-container={page.url.href === '/'}>
          {page.data.title}
        </a>
        
        <a href="/health" class="rounded-lg px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container"
          class:bg-surface-container={page.url.href === '/health'}>
          Health
        </a>
      </nav>

      <!-- Right Side -->
      <div class="flex items-center gap-2">
        <!-- Time -->
        <div class="hidden items-center gap-1 rounded-lg px-2 py-1 text-xs text-on-surface-variant sm:flex">
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(currentTime)}
        </div>

        <!-- Theme Toggle -->
        <button onclick={toggleTheme} class="rounded-lg p-1.5 hover:bg-surface-container" title="Toggle theme">
          {#if isDark}
            <Moon size={14} />
          {:else}
            <Sun size={14} />
          {/if}
        </button>

        {#if $auth.isAuthenticated}
          <!-- User Menu -->
          <UserMenu />
        {:else}
          <!-- Login Button -->
          <Button
            variant="tonal"
            size="small"
            class="hidden sm:inline-flex"
            onclick={() => goto('/login')}
          >
            <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </Button>
        {/if}

        <!-- Mobile Menu -->
        <button onclick={() => mobileMenuOpen = !mobileMenuOpen} class="rounded-lg p-1.5 hover:bg-surface-container md:hidden">
          {#if mobileMenuOpen}
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
      <div class="border-t border-outline py-3 md:hidden">
        <div class="space-y-1">
          <a href="/" onclick={() => mobileMenuOpen = false}
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
            class:bg-surface-container={page.url.href === '/'}>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </a>
          
          <a href="/health" onclick={() => mobileMenuOpen = false}
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
            class:bg-surface-container={page.url.href === '/health'}>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Health
          </a>
          <a href="/settings" onclick={() => mobileMenuOpen = false}
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container"
            class:bg-surface-container={page.url.href.startsWith('/settings')}>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </a>
        </div>
        
        <div class="mt-3 border-t border-outline pt-3">
          <div class="flex items-center justify-between px-3">
            <div class="text-xs text-on-surface-variant">v1.0.0</div>
            <div class="text-xs text-on-surface-variant">{formatTime(currentTime)}</div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</header>