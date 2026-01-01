<script lang="ts">
	import type { HealthResponse } from '$lib/types/api';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props {
		healthData: HealthResponse;
	}

	let { healthData, ...restProps }: (Props & HTMLAttributes<HTMLDivElement>) = $props();

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'up':
				return 'text-green-600 bg-green-100';
			case 'down':
				return 'text-red-600 bg-red-100';
			case 'warning':
				return 'text-yellow-600 bg-yellow-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	};
</script>

<Card elevation={2} padding="large" class="space-y-6 bg-surface text-on-surface">
  <!-- Overall Status -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-on-surface">System Health</h3>
      <p class="text-sm text-on-surface-variant">
        Last checked: {new Date(healthData.timestamp).toLocaleString()}
      </p>
    </div>
    <Badge variant={healthData.status === 'up' ? 'success' :  healthData.status === 'warning' ? 'warning' : 'error'}>
      {healthData.status.toUpperCase()}
    </Badge>
  </div>
  
  <!-- Services -->
  <div>
    <h4 class="mb-3 font-medium text-on-surface">Services</h4>
    <div class="space-y-2">
      {#each healthData.checks as check}
        <div class="flex items-center justify-between rounded-lg bg-surface-container p-3">
          <div class="flex items-center gap-3">
            <div class={`h-2 w-2 rounded-full ${
              check.status === 'up' 
                ? 'bg-[rgb(var(--color-primary))]' 
                : 'bg-[rgb(var(--color-error))]'
            }`}></div>
            <span class="font-medium text-on-surface">{check.name}</span>
            {#if check.required}
              <Badge size="small" variant="secondary">Required</Badge>
            {/if}
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm text-on-surface-variant">{check.responseTime}ms</span>
            <Badge variant={check.status === 'up' ? 'success' :  check.status === 'warning' ? 'warning' : 'error'}>{check.status}</Badge>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- CPU Load -->
  <div>
    <h4 class="mb-3 font-medium text-on-surface">CPU Load Average</h4>
    <div class="grid grid-cols-3 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">{healthData.metrics.cpu.loadAverage[1].toFixed(2)}</div>
        <div class="text-sm text-on-surface-variant">1 min</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">{healthData.metrics.cpu.loadAverage[5].toFixed(2)}</div>
        <div class="text-sm text-on-surface-variant">5 min</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-primary">{healthData.metrics.cpu.loadAverage[15].toFixed(2)}</div>
        <div class="text-sm text-on-surface-variant">15 min</div>
      </div>
    </div>
  </div>
  
  <!-- Memory Usage -->
  <div>
    <div class="mb-2 flex justify-between">
      <h4 class="font-medium text-on-surface">Memory Usage</h4>
      <span class="text-sm font-medium text-primary">{healthData.metrics.memory.usagePercent}%</span>
    </div>
    <Progress value={healthData.metrics.memory.usagePercent} />
    <div class="mt-2 grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="font-medium text-on-surface">{healthData.metrics.memory.used}</div>
        <div class="text-xs text-on-surface-variant">Used</div>
      </div>
      <div>
        <div class="font-medium text-on-surface">{healthData.metrics.memory.free}</div>
        <div class="text-xs text-on-surface-variant">Free</div>
      </div>
      <div>
        <div class="font-medium text-on-surface">{healthData.metrics.memory.total}</div>
        <div class="text-xs text-on-surface-variant">Total</div>
      </div>
    </div>
  </div>
  
  <!-- System Info -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <h4 class="mb-2 font-medium text-on-surface">OS</h4>
      <div class="space-y-1 text-sm text-on-surface-variant">
        <div>{healthData.metrics.os.type} {healthData.metrics.os.release}</div>
        <div>Arch: {healthData.metrics.os.arch}</div>
        <div>Uptime: {Math.floor(healthData.metrics.os.uptime / 3600)}h</div>
      </div>
    </div>
    <div>
      <h4 class="mb-2 font-medium text-on-surface">Process</h4>
      <div class="space-y-1 text-sm text-on-surface-variant">
        <div>PID: {healthData.metrics.process.pid}</div>
        <div>Node: {healthData.metrics.process.version}</div>
        <div>Uptime: {Math.floor(healthData.metrics.process.uptime / 3600)}h</div>
      </div>
    </div>
  </div>
</Card>