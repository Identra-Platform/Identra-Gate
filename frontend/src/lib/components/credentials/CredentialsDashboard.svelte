<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import StatsCard from '../admin/StatsCard.svelte';
  import QuickActions from './QuickActions.svelte';
  import RecentCredentials from './RecentCredentials.svelte';
  import { goto } from '$app/navigation';
  import CreateCredential from './CreateCredential.svelte';
  import CredentialTemplates from './CredentialTemplates.svelte';
  import IssuedCredentials from './IssuedCredentials.svelte';
  import { onMount } from 'svelte';
  import { getAllCredentials } from '$lib/utils/api';
  
  export let activeSection: 'dashboard' | 'create' | 'templates' | 'issued' = 'dashboard';
  
  let credentials: any[] = [];
  let loading = true;
  
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'create', label: 'Create Credential', icon: 'create' },
    { id: 'templates', label: 'Templates', icon: 'templates' },
    { id: 'issued', label: 'Issued Credentials', icon: 'issued' }
  ];
  
  onMount(async () => {
    await loadCredentials();
  });
  
  async function loadCredentials() {
    try {
      credentials = await getAllCredentials();
    } catch (error) {
      console.error('Failed to load credentials:', error);
      credentials = [];
    } finally {
      loading = false;
    }
  }
  
  // Calculate stats from actual data
  const totalIssued = credentials.length;
  const activeCredentials = credentials.filter(c => 
    c.status === 'issued'
  ).length;
  const pendingVerification = credentials.filter(c => 
    c.status === 'pending'
  ).length;
  const successRate = credentials.length > 0 
    ? Math.round((credentials.filter(c => c.status === 'issued').length / credentials.length) * 100) 
    : 0;
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Credential Issuance</h1>
      <p class="text-on-surface-variant">Create and manage verifiable credentials</p>
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
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Issued"
        value={totalIssued.toString()}
        icon="issued"
        color="primary"
      />
      <StatsCard
        title="Active Credentials"
        value={activeCredentials.toString()}
        icon="active"
        color="secondary"
      />
      <StatsCard
        title="Pending Verification"
        value={pendingVerification.toString()}
        icon="pending"
        color="warning"
      />
      <StatsCard
        title="Success Rate"
        value={`${successRate}%`}
        icon="success"
        color="success"
      />
    </div>
    
    <!-- Quick Actions & Recent Credentials -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <RecentCredentials
          limit={5} 
          credentials={credentials.slice(0, 5)} 
          loading={loading}
        />
      </div>
      <div>
        <QuickActions />
      </div>
    </div>
    
  {:else if activeSection === 'create'}
    <svelte:component this={CreateCredential} />
  {:else if activeSection === 'templates'}
    <svelte:component this={CredentialTemplates} />
  {:else if activeSection === 'issued'}
    <IssuedCredentials />
  {/if}
</div>