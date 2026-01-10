<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  export let requireAuth = true;
  export let requireRoles: string[] = [];
  export let requireAllRoles = false;
  export let redirectTo = '/login';
  export let showLoading = true;
  
  let checking = true;
  let hasAccess = false;
  
  onMount(async () => {
    checking = true;
    
    try {
      // Check authentication
      if (requireAuth && !$auth.isAuthenticated) {
        // Check if token might be expired
        if (auth.isTokenExpired() && $auth.accessToken) {
          try {
            await auth.refreshToken();
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
            await auth.logout();
            goto(redirectTo);
            return;
          }
        } else {
          // Not authenticated at all
          goto(redirectTo);
          return;
        }
      }
      
      // Check role requirements
      if (requireRoles.length > 0) {
        if (requireAllRoles) {
          // User must have ALL required roles
          hasAccess = requireRoles.every(role => auth.hasRole(role));
        } else {
          // User must have AT LEAST ONE required role
          hasAccess = requireRoles.some(role => auth.hasRole(role));
        }
        
        if (!hasAccess) {
          goto('/unauthorized');
          return;
        }
      } else {
        hasAccess = true;
      }
    } catch (error) {
      console.error('Auth guard error:', error);
      goto('/error');
      return;
    } finally {
      checking = false;
    }
  });
</script>

{#if checking && showLoading}
  <div class="flex min-h-[50vh] items-center justify-center">
    <div class="text-center">
      <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p class="text-on-surface-variant">Checking permissions...</p>
    </div>
  </div>
{:else if !requireAuth || hasAccess}
  <slot />
{:else}
  <!-- Fallback for SSR or edge cases -->
  <div class="hidden"></div>
{/if}