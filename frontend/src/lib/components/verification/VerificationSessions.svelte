<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { getVerificationSessions, getVerificationResults } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { VerificationSession } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';
	import Alert from '../ui/Alert.svelte';
  
  let verificationSessions: VerificationSession[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let autoRefresh = true;
  let refreshInterval: NodeJS.Timeout | null = null;
  
  onMount(() => {
    loadVerificationSessions();
    
    if (autoRefresh) {
      refreshInterval = setInterval(loadVerificationSessions, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });
  
  async function loadVerificationSessions() {
    try {
      const verifications = await getVerificationSessions();
      verificationSessions = verifications;
      error = '';
    } catch (err: any) {
      if (!error) { // Only show first error
        error = err.message || 'Failed to load verification sessions';
      }
      console.error('Error loading verification sessions:', err);
    } finally {
      loading = false;
    }
  }
  
  async function refreshVerification(id: string) {
    try {
      await getVerificationResults(id);
      await loadVerificationSessions(); // Reload the list
    } catch (err: any) {
      console.error('Error refreshing verification:', err);
    }
  }
  
  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    
    if (autoRefresh && !refreshInterval) {
      refreshInterval = setInterval(loadVerificationSessions, 10000);
    } else if (!autoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMs < 0) {
      return 'Expired';
    } else if (diffMins < 60) {
      return `Expires in ${diffMins} minutes`;
    } else {
      return `Expires in ${diffHours} hours`;
    }
  }
  
  function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  const filteredVerifications = verificationSessions.filter(verification => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      verification.id.toLowerCase().includes(searchLower) ||
      verification.verifier.name.toLowerCase().includes(searchLower) ||
      verification.requestedCredentials.some(cred => 
        cred.credentialType.toLowerCase().includes(searchLower)
      )
    );
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Verification Sessions</h2>
      <p class="text-on-surface-variant">Monitor and manage verification requests</p>
    </div>
    <div class="flex items-center gap-2">
      <button
        on:click={toggleAutoRefresh}
        class={`rounded-lg px-3 py-1 text-sm font-medium ${
          autoRefresh 
            ? 'bg-primary-container text-on-primary-container' 
            : 'bg-surface-container-high text-on-surface-variant'
        }`}
      >
        {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
      </button>
      <Button onclick={() => goto("/verification/create")} variant="filled">
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Request
      </Button>
    </div>
  </div>
  
  <!-- Search -->
  <Card elevation={1} class="p-4">
    <Input
      label="Search Verifications"
      placeholder="Search by ID, verifier, or credential type..."
      bind:value={searchQuery}
      trailingIcon={Search}
    />
  </Card>
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
      <div class="mt-2">
        <Button onclick={loadVerificationSessions} variant="outlined" size="small">
          Retry
        </Button>
      </div>
    </Alert>
  {/if}
  
  <!-- Loading State -->
  {#if loading && verificationSessions.length === 0}
    <Card class="py-12 text-center">
      <div class="flex flex-col items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="mt-4 text-on-surface-variant">Loading verification sessions...</p>
      </div>
    </Card>
  {:else if filteredVerifications.length === 0}
    <!-- Empty State -->
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">No Verification Sessions</h3>
      <p class="mt-1 text-on-surface-variant">
        {#if searchQuery}
          No verifications match your search
        {:else}
          Create a verification request to get started
        {/if}
      </p>
      <div class="mt-6">
        <Button onclick={() => goto("/verification/create")} variant="filled">
          Create Verification Request
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Verifications Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredVerifications as verification}
        <Card elevation={2} class="h-full p-5 hover:shadow-3 transition-shadow">
          <div class="flex h-full flex-col">
            <!-- Verification Header -->
            <div class="mb-3">
              <div class="mb-2 flex items-start justify-between">
                <h3 class="text-lg font-semibold text-on-surface truncate">
                  {verification.id.substring(0, 8)}...
                </h3>
                <Badge class={getStatusColor(verification.status || 'pending')}>
                  {verification.status || 'pending'}
                </Badge>
              </div>
              
              <div class="mb-2 text-sm text-on-surface-variant">
                Verifier: {verification.verifier.name}
              </div>
              
              <div class="text-xs text-on-surface-variant">
                Created: {new Date(verification.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <!-- Requested Credentials -->
            <div class="mb-4 flex-1">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">
                Requested Credentials ({verification.requestedCredentials.length})
              </div>
              <div class="space-y-1">
                {#each verification.requestedCredentials.slice(0, 3) as credential}
                  <div class="text-sm text-on-surface">
                    • {credential.credentialType}
                    {#if credential.fields.length > 0}
                      <span class="text-xs text-on-surface-variant">
                        ({credential.fields.length} fields)
                      </span>
                    {/if}
                  </div>
                {/each}
                {#if verification.requestedCredentials.length > 3}
                  <div class="text-sm text-on-surface">
                    • ...and {verification.requestedCredentials.length - 3} more
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Status & Actions -->
            <div class="border-t border-outline-variant pt-3">
              <div class="mb-3 flex items-center justify-between">
                <div class="text-sm {isExpired(verification.expiresAt) ? 'text-error' : 'text-on-surface-variant'}">
                  {formatDate(verification.expiresAt)}
                </div>
                
                {#if verification.results}
                  <Badge size="small" variant="secondary">
                    Results available
                  </Badge>
                {/if}
              </div>
              
              <div class="flex gap-2">
                <Button
                  onclick={() => goto(`/verification/view/${verification.id}`)}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  View Details
                </Button>
                
                {#if !verification.results && !isExpired(verification.expiresAt)}
                  <Button
                    onclick={() => refreshVerification(verification.id)}
                    variant="tonal"
                    size="small"
                    fullWidth
                  >
                    Check Results
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>