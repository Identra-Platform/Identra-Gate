<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { goto } from '$app/navigation';
  
  export let limit = 5;
  export let credentials: any[] = [];
  export let loading = false;
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Recently';
    }
  }
  
  function getClaimSummary(claims: Record<string, any>): string {
    if (!claims || Object.keys(claims).length === 0) return 'No claims';
    
    const firstClaim = Object.entries(claims)[0];
    return `${firstClaim[0]}: ${firstClaim[1]}`;
  }
</script>

<Card elevation={2} padding="large" class="h-full">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-on-surface">Recently Issued</h3>
    <a 
      href="/credentials" 
      class="text-sm font-medium text-primary hover:text-primary/80"
      on:click|preventDefault={() => goto("/credentials")}
    >
      View all
    </a>
  </div>
  
  {#if loading}
    <div class="space-y-4">
      {#each Array(limit).fill(0) as _, i}
        <div class="flex items-center justify-between rounded-lg bg-surface-container p-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 animate-pulse rounded-lg bg-surface-container-high"></div>
            <div>
              <div class="h-4 w-24 animate-pulse rounded bg-surface-container-high"></div>
              <div class="mt-1 h-3 w-16 animate-pulse rounded bg-surface-container-high"></div>
            </div>
          </div>
          <div class="h-6 w-16 animate-pulse rounded bg-surface-container-high"></div>
        </div>
      {/each}
    </div>
  {:else if credentials.length === 0}
    <div class="py-8 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
      <p class="mt-2 text-on-surface-variant">No credentials issued yet</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each credentials.slice(0, limit) as credential}
        <div class="flex items-center justify-between rounded-lg bg-surface-container p-3">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-primary-container p-2">
              <svg class="h-4 w-4 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <div class="font-medium text-on-surface">
                {credential.id.substring(0, 8)}...
              </div>
              <div class="text-xs text-on-surface-variant">
                {getClaimSummary(credential.claims)}
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <Badge size="small" class={getStatusColor(credential.status)}>
              {credential.status}
            </Badge>
            <div class="mt-1 text-xs text-on-surface-variant">
              {formatTime(credential.createdAt || credential.issuedAt)}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</Card>