<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import StatsCard from '../admin/StatsCard.svelte';
  import QuickActions from './QuickActions.svelte';
  import RecentVerifications from './RecentVerifications.svelte';
	import { goto } from '$app/navigation';
	import CreateVerificationRequest from './CreateVerificationRequest.svelte';
	import VerificationSessions from './VerificationSessions.svelte';
	import VerificationHistory from './VerificationHistory.svelte';
	import { getVerificationSessions } from '$lib/utils/api';
	import Loading from '../ui/Loading.svelte';
  
  export let activeSection: 'dashboard' | 'create' | 'pending' | 'history' = 'dashboard';
  
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'create', label: 'Create Request', icon: 'create' },
    { id: 'pending', label: 'Pending', icon: 'pending' },
    { id: 'history', label: 'History', icon: 'history' }
  ];

  let verificationSessions = getVerificationSessions();
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Credential Verification</h1>
      <p class="text-on-surface-variant">Verify credentials using QR codes and view results</p>
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
  
  <!-- Navigation -->
  <Card elevation={1} class="p-2">
    <div class="flex space-x-1">
      {#each sections as section}
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          class:text-primary={activeSection === section.id}
          class:bg-primary-container={activeSection === section.id}
          class:text-on-surface={activeSection !== section.id}
          class:hover:bg-surface-container-high={activeSection !== section.id}
          on:click={() => activeSection = section.id as any}
        >
          {section.label}
        </button>
      {/each}
    </div>
  </Card>
  
  <!-- Dashboard Content -->
  {#if activeSection === 'dashboard'}
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#await verificationSessions}
        <Loading />
      {:then data} 
        <StatsCard
          title="Verification Sessions"
          value={data.length.toString()}
          icon="pending"
          color="warning"
        />
        <StatsCard
          title="Successful"
          value={data.filter(session => session.status === 'success').length.toString()}
          icon="success"
          color="success"
        />
        <StatsCard
          title="Failed"
          value={data.filter(session => session.status === 'failed').length.toString()}
          icon="failed"
          color="error"
        />
        <StatsCard
          title="Success Rate"
          value={((data.filter(session => session.status === 'success').length * 100 / (data.length === 0 ? 1 : data.length))).toString() + '%'}
          icon="rate"
          color="primary"
        />
      {/await}
    </div>
    
    <!-- Quick Actions & Recent Verifications -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <RecentVerifications limit={5} />
      </div>
      <div>
        <QuickActions />
      </div>
    </div>
    
  {:else if activeSection === 'create'}
    <svelte:component this={CreateVerificationRequest} />
  {:else if activeSection === 'pending'}
    <svelte:component this={VerificationSessions} />
  {:else if activeSection === 'history'}
    <svelte:component this={VerificationHistory} />
  {/if}
</div>