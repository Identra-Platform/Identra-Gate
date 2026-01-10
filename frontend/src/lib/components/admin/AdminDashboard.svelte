<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import StatsCard from './StatsCard.svelte';
  import QuickActions from './QuickActions.svelte';
  import RecentActivity from './RecentActivity.svelte';
	import { goto } from '$app/navigation';
	import UsersManagement from './UsersManagement.svelte';
	import ActivityLog from './ActivityLog.svelte';
  
  export let activeSection: 'dashboard' | 'users' | 'metrics' | 'activity' = 'dashboard';
  
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'activity', label: 'Activity', icon: 'activity' }
  ];
</script>

<div class="space-y-6">
  <!-- Admin Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Admin Dashboard</h1>
      <p class="text-on-surface-variant">Manage system users, monitor metrics, and track activity</p>
    </div>
    <div class="flex items-center gap-2">
      <Button onclick={() => goto("/")} variant="outlined" size="small">
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to Home
      </Button>
    </div>
  </div>
  
  <!-- Admin Navigation -->
  <Card elevation={1} class="p-2">
    <div class="flex space-x-1">
      {#each sections as section}
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          class:text-primary={activeSection === section.id}
          class:bg-primary-container={activeSection === section.id}
          class:text-on-surface={activeSection !== section.id}
          class:hover:bg-surface-container-high={activeSection !== section.id}
          on:click={() => activeSection = section.id as typeof activeSection}
        >
          {section.label}
        </button>
      {/each}
    </div>
  </Card>
  
  <!-- Dashboard Content -->
  {#if activeSection === 'dashboard'}
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <StatsCard
        title="Total Users"
        value="24"
        icon="users"
        color="primary"
      />
      <StatsCard
        title="System Health"
        value="98%"
        icon="health"
        color="success"
      />
    </div>
    
    <!-- Quick Actions & System Metrics -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class='col-span-2'>
        <QuickActions />
      </div>
      <div class='col-span-1'>
        <RecentActivity limit={5} />
      </div>
    </div>
    
    <!-- Recent Activity -->
    
  {:else if activeSection === 'users'}
    <svelte:component this={UsersManagement} />
  {:else if activeSection === 'activity'}
    <svelte:component this={ActivityLog} />
  {/if}
</div>