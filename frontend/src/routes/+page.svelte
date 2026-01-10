<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { getHealth, getMetrics, getRecentActivites } from '$lib/utils/api';
  import { onMount } from 'svelte';
	import type { ActivityLog, HealthResponse } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import Loading from '$lib/components/ui/Loading.svelte';
	import RecentActivity from '$lib/components/admin/RecentActivity.svelte';
  
  let healthData: HealthResponse | null = null;
  let metricsData = null;
  let loading = true;
  let error = '';
  let activities: Promise<ActivityLog[]> | null = null;
  
  onMount(async () => {
    try {
      // Fetch health data
      healthData = await getHealth();
      activities = getRecentActivites();
      
      // Fetch metrics data if available
      try {
        metricsData = await getMetrics();
      } catch (metricsError) {
        console.warn('Could not fetch metrics:', metricsError);
      }
    } catch (err: any) {
      error = err.message || 'Failed to load system status';
    } finally {
      loading = false;
    }
  });

  function formatAction(action: string): string {
    const actions: Record<string, string> = {
      'LOGIN': 'User Login',
      'LOGOUT': 'User Logout',
      'CREATE': 'Created Record',
      'UPDATE': 'Updated Record',
      'DELETE': 'Deleted Record',
      'READ': 'Viewed Record',
      'DOWNLOAD': 'File Downloaded',
      'UPLOAD': 'File Uploaded',
      'EXPORT': 'Data Exported',
      'IMPORT': 'Data Imported'
    };
    return actions[action] || action;
  }
  
  // Format time ago
  function formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
  
  // Get browser icon
  function getBrowserIcon(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Browser';
  }
  
  // Get device info
  function getDeviceInfo(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/Macintosh|Mac OS/.test(userAgent)) return 'Mac';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Desktop';
  }
  
  // Event handlers
  function handleActivityClick(activity: any) {
    // Emit event or navigate
    console.log('Activity clicked:', activity);
  }

  function refreshActivities() {
    // Dispatch refresh event
  }
</script>

<div class="space-y-6">
  <!-- Welcome Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Welcome to Identra-Gate</h1>
      <p class="text-on-surface-variant">
        {#if $auth.user}
          Welcome back, {$auth.user.username}!
          {#if auth.isAdmin()}
            You have administrator privileges.
          {/if}
        {:else}
          Secure Identity Verification Platform
        {/if}
      </p>
    </div>
    <div class="flex gap-2">
      <Button onclick={() => goto("/health")} variant="tonal">
        System Health
      </Button>
      {#if auth.isAdmin()}
        <Button onclick={() => goto("/admin")} variant="filled">
          Admin Dashboard
        </Button>
      {:else if auth.hasRole('verifier')}
        <Button onclick={() => goto("/verification")} variant="filled">
          Start Verification
        </Button>
      {/if}
    </div>
  </div>
  
  <!-- Quick Stats Grid -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card elevation={1} class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-on-surface-variant">System Status</p>
          <p class="mt-1 text-2xl font-bold text-on-surface">
            {#if loading}
              <span class="animate-pulse">...</span>
            {:else if error}
              <span class="text-error">Error</span>
            {:else if healthData}
              {healthData.status === 'up' ? 'Online' : 'Offline'}
            {/if}
          </p>
        </div>
        <div class="rounded-lg bg-primary-container p-2">
          <svg class="h-6 w-6 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
    </Card>
    
    <Card elevation={1} class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-on-surface-variant">Environment</p>
          <p class="mt-1 text-2xl font-bold text-on-surface">
            {#if loading}
              <span class="animate-pulse">...</span>
            {:else if healthData}
              {healthData.environment.charAt(0).toUpperCase()}{healthData.environment.slice(1)}
            {:else}
              Unknown
            {/if}
          </p>
        </div>
        <div class="rounded-lg bg-secondary-container p-2">
          <svg class="h-6 w-6 text-on-secondary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
    </Card>
    
    <Card elevation={1} class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-on-surface-variant">Services</p>
          <p class="mt-1 text-2xl font-bold text-on-surface">
            {#if loading}
              <span class="animate-pulse">...</span>
            {:else if healthData}
              {healthData.checks.filter(c => c.status === 'up').length}/{healthData.checks.length}
            {:else}
              0/0
            {/if}
          </p>
        </div>
        <div class="rounded-lg bg-tertiary-container p-2">
          <svg class="h-6 w-6 text-on-tertiary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </Card>
    
    <Card elevation={1} class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-on-surface-variant">Uptime</p>
          <p class="mt-1 text-2xl font-bold text-on-surface">
            {#if loading}
              <span class="animate-pulse">...</span>
            {:else if healthData}
              {healthData.uptime.split(' ')[0]}
            {:else}
              0d
            {/if}
          </p>
        </div>
        <div class="rounded-lg bg-primary-container p-2">
          <svg class="h-6 w-6 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </Card>
  </div>
  
  <!-- Main Content Area -->
  <div class="grid gap-6 grid-cols-1 lg:grid-cols-3">
    <!-- Left Column: Quick Actions -->
    <div class='col-span-1 lg:col-span-2'>
      <Card elevation={2} padding="large" class="h-full">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Quick Actions</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#if auth.isAdmin()}
            <Button onclick={() => goto("/admin/users")} variant="outlined" class="h-auto p-4 text-left">
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-primary-container p-2">
                  <svg class="h-5 w-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.384-.5.819-.5 1.276v1a2 2 0 01-2 2h-2" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-on-surface">Manage Users</div>
                  <div class="text-sm text-on-surface-variant">Add, edit, or remove system users</div>
                </div>
              </div>
            </Button>
          {/if}
          
          {#if auth.hasAnyRole(['verifier', 'admin'])}
            <Button onclick={() => goto("/verification")} variant="outlined" class="h-auto p-4 text-left">
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-primary-container p-2">
                  <svg class="h-5 w-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-on-surface">Verification</div>
                  <div class="text-sm text-on-surface-variant">Verify credentials and identities</div>
                </div>
              </div>
            </Button>
          {/if}
          
          {#if auth.hasAnyRole(['issuer', 'admin'])}
            <Button onclick={() => goto("/credentials")} variant="outlined" class="h-auto p-4 text-left">
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-primary-container p-2">
                  <svg class="h-5 w-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-on-surface">Credentials</div>
                  <div class="text-sm text-on-surface-variant">Manage verifiable credentials</div>
                </div>
              </div>
            </Button>
          {/if}
          
          <Button onclick={() => goto("/health")} variant="outlined" class="h-auto p-4 text-left">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-primary-container p-2">
                <svg class="h-5 w-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div class="font-medium text-on-surface">System Health</div>
                <div class="text-sm text-on-surface-variant">Monitor system performance</div>
              </div>
            </div>
          </Button>
        </div>
      </Card>
    </div>

    <RecentActivity />
  </div>
</div>