<script lang="ts">
  import type { HealthResponse, MetricsResponse, HealthStatus } from '$lib/types/api';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Progress from '$lib/components/ui/Progress.svelte';
  
  export let healthData: HealthResponse;
  export let metricsData: MetricsResponse | undefined = undefined;
  
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'up': return 'bg-green-100 text-green-800';
      case 'down': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusVariant = (status: HealthStatus) => {
    switch (status) {
      case 'up': return 'success';
      case 'down': return 'error';
      case 'warning': return 'warning';
      default: return 'secondary';
    }
  };
  
  const formatBytes = (bytes: number | string): string => {
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    
    if (isNaN(numBytes)) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = numBytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const parseUptime = (uptime: string | number | undefined): string => {
    if (!uptime) return 'N/A';
    
    if (typeof uptime === 'string') {
      return uptime;
    }
    
    // If uptime is in seconds (number)
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };
  
  // Helper to get metrics from either healthData.metrics or metricsData.metrics
  const getMetrics = () => {
    if (metricsData) return metricsData.metrics;
    if (healthData.metrics) return healthData.metrics;
    return null;
  };
  
  const metrics = getMetrics();
</script>

<Card elevation={2} padding="large" class="space-y-6">
  <!-- Overall Status -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-on-surface">System Health</h3>
      <p class="text-sm text-on-surface-variant">
        {#if healthData.version}
          Version {healthData.version} • 
        {/if}
        {healthData.environment.charAt(0).toUpperCase()}{healthData.environment.slice(1)}
        <br />
        Last checked: {new Date(healthData.timestamp).toLocaleString()}
        <br />
        Uptime: {parseUptime(healthData.uptime)}
      </p>
    </div>
    <Badge variant={getStatusVariant(healthData.status)}>
      {healthData.status.toUpperCase()}
    </Badge>
  </div>
  
  <!-- Services - Use either checks or services array -->
  {#if healthData.checks?.length || healthData.services?.length}
    <div>
      <h4 class="mb-3 font-medium text-on-surface">Service Status</h4>
      <div class="space-y-2">
        {#each (healthData.checks || healthData.services || []) as check}
          <div class="flex items-center justify-between rounded-lg bg-surface-container p-3">
            <div class="flex items-center gap-3">
              <div class={`h-2 w-2 rounded-full ${
                check.status === 'up' ? 'bg-green-500' :
                check.status === 'down' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <span class="font-medium text-on-surface">{check.name}</span>
              {#if check.required}
                <Badge size="small" variant="secondary">Required</Badge>
              {/if}
            </div>
            <div class="flex items-center gap-4">
              {#if check.responseTime !== null}
                <span class="text-sm text-on-surface-variant">{check.responseTime}ms</span>
              {/if}
              <Badge class={getStatusColor(check.status)}>{check.status}</Badge>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- System Metrics -->
  {#if metrics}
    <!-- CPU Usage -->
    {#if metrics.cpu}
      <div>
        <div class="mb-2 flex justify-between">
          <h4 class="font-medium text-on-surface">CPU Usage</h4>
          {#if metrics.cpu.usage !== undefined}
            <span class="text-sm font-medium text-on-surface">{metrics.cpu.usage.toFixed(1)}%</span>
          {/if}
        </div>
        
        {#if metrics.cpu.usage !== undefined}
          <Progress value={metrics.cpu.usage} />
        {/if}
        
        <div class="mt-2 grid grid-cols-4 gap-4 text-center">
          {#if metrics.cpu.loadAverage}
            <div>
              <div class="font-medium text-on-surface">{metrics.cpu.loadAverage[1].toFixed(2)} avg</div>
              <div class="text-xs text-on-surface-variant">1 min</div>
            </div>
            <div>
              <div class="font-medium text-on-surface">{metrics.cpu.loadAverage[5].toFixed(2)} avg</div>
              <div class="text-xs text-on-surface-variant">5 min</div>
            </div>
            <div>
              <div class="font-medium text-on-surface">{metrics.cpu.loadAverage[15].toFixed(2)} avg</div>
              <div class="text-xs text-on-surface-variant">15 min</div>
            </div>
          {/if}
          {#if metrics.cpu.cores !== undefined}
            <div>
              <div class="font-medium text-on-surface">{metrics.cpu.cores}</div>
              <div class="text-xs text-on-surface-variant">Cores</div>
            </div>
          {/if}
          {#if metrics.cpu.model}
            <div class="col-span-4">
              <div class="font-medium text-on-surface">{metrics.cpu.model}</div>
              <div class="text-xs text-on-surface-variant">Model</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Memory Usage -->
    {#if metrics.memory}
      <div>
        <div class="mb-2 flex justify-between">
          <h4 class="font-medium text-on-surface">Memory Usage</h4>
          <span class="text-sm font-medium text-on-surface">{metrics.memory.usagePercent}%</span>
        </div>
        <Progress value={metrics.memory.usagePercent} />
        <div class="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.memory.used)}</div>
            <div class="text-xs text-on-surface-variant">Used</div>
          </div>
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.memory.free)}</div>
            <div class="text-xs text-on-surface-variant">Free</div>
          </div>
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.memory.total)}</div>
            <div class="text-xs text-on-surface-variant">Total</div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Disk Usage -->
    {#if metrics.disk}
      <div>
        <div class="mb-2 flex justify-between">
          <h4 class="font-medium text-on-surface">Disk Usage</h4>
          <span class="text-sm font-medium text-on-surface">{metrics.disk.usagePercent}%</span>
        </div>
        <Progress value={metrics.disk.usagePercent} />
        <div class="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.disk.used)}</div>
            <div class="text-xs text-on-surface-variant">Used</div>
          </div>
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.disk.free)}</div>
            <div class="text-xs text-on-surface-variant">Free</div>
          </div>
          <div>
            <div class="font-medium text-on-surface">{formatBytes(metrics.disk.total)}</div>
            <div class="text-xs text-on-surface-variant">Total</div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- OS Info -->
    {#if metrics.os}
      <div class="rounded-lg bg-surface-container p-4">
        <h4 class="mb-2 font-medium text-on-surface">Operating System</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-on-surface-variant">Platform:</div>
          <div class="text-on-surface">{metrics.os.platform}</div>
          
          <div class="text-on-surface-variant">Release:</div>
          <div class="text-on-surface">{metrics.os.release}</div>
          
          <div class="text-on-surface-variant">Architecture:</div>
          <div class="text-on-surface">{metrics.os.arch}</div>
          
          {#if metrics.os.uptime}
            <div class="text-on-surface-variant">OS Uptime:</div>
            <div class="text-on-surface">{parseUptime(metrics.os.uptime)}</div>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Process Info -->
    {#if metrics.process}
      <div class="rounded-lg bg-surface-container p-4">
        <h4 class="mb-2 font-medium text-on-surface">Process Info</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-on-surface-variant">PID:</div>
          <div class="text-on-surface">{metrics.process.pid}</div>
          
          <div class="text-on-surface-variant">Version:</div>
          <div class="text-on-surface">{metrics.process.version}</div>
          
          {#if metrics.process.uptime}
            <div class="text-on-surface-variant">Process Uptime:</div>
            <div class="text-on-surface">{parseUptime(metrics.process.uptime)}</div>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Network Info -->
    {#if metrics.network}
      <div class="rounded-lg bg-surface-container p-4">
        <h4 class="mb-2 font-medium text-on-surface">Network</h4>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div class="text-on-surface-variant">Hostname:</div>
          <div class="text-on-surface">{metrics.network.hostname}</div>
          
          {#if metrics.network.externalIPs?.length}
            <div class="text-on-surface-variant">External IPs:</div>
            <div class="text-on-surface">
              {#each metrics.network.externalIPs as ip, i}
                <div>{ip}</div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- System Uptime (fallback) -->
    {#if metrics.uptime && !metrics.os?.uptime && !metrics.process?.uptime}
      <div class="rounded-lg bg-surface-container p-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-on-surface">System Uptime</h4>
            <p class="text-sm text-on-surface-variant">
              {parseUptime(metrics.uptime)}
            </p>
          </div>
          <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    {/if}
  {/if}
</Card>