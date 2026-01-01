<script lang="ts">
  import HealthMetrics from '$lib/components/health/HealthMetrics.svelte';
  import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
  import { health } from '$lib/stores/health';
  import { onMount } from 'svelte';
  
  onMount(() => {
    health.fetch();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">System Health</h1>
      <p class="text-on-surface-variant">Monitor your server's health and metrics</p>
    </div>
    <Button onclick={() => health.refresh()} variant="tonal">
      Refresh
    </Button>
  </div>
  
  {#if $health.loading}
    <div class="flex h-96 items-center justify-center">
      <div class="space-y-4 text-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p class="text-on-surface-variant">Loading health data...</p>
      </div>
    </div>
  {:else if $health.error}
    <Card class="p-8 text-center">
      <h3 class="mb-2 text-lg font-semibold text-error">Failed to load health data</h3>
      <p class="mb-4 text-on-surface-variant">{$health.error}</p>
      <Button onclick={() => health.fetch()} variant="outlined">
        Retry
      </Button>
    </Card>
  {:else if $health.data}
    <HealthMetrics healthData={$health.data} />
  {/if}
</div>