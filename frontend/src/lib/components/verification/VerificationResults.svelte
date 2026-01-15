<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getVerificationResults } from '$lib/utils/api';
  import { onDestroy, onMount } from 'svelte';
  import type { VerificationSession } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import QrCodeDisplay from '../ui/QrCodeDisplay.svelte';
  
  export let verificationId: string;
  
  let verification: VerificationSession | null = null;
  let loading = true;
  let error = '';
  let autoRefresh = false;
  let refreshInterval: NodeJS.Timeout | null = null;
  
  onMount(async () => {
    await loadVerification();
    
    if (verification && (!verification.status || verification.status === 'pending')) {
      autoRefresh = true;
      refreshInterval = setInterval(loadVerification, 5000);
    }
  });
  
  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
  
  async function loadVerification() {
    loading = true;
    error = '';
    
    try {
      verification = await getVerificationResults(verificationId);
      
      // Update auto-refresh based on new status
      if (verification.status && verification.status !== 'pending' && refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        autoRefresh = false;
      } else if (!verification.status && !refreshInterval) {
        refreshInterval = setInterval(loadVerification, 5000);
        autoRefresh = true;
      }
    } catch (err: any) {
      error = err.message || 'Failed to load verification results';
      console.error('Error loading verification:', err);
    } finally {
      loading = false;
    }
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  function isExpired(): boolean {
    if (!verification) return false;
    return new Date(verification.expiresAt) < new Date();
  }
  
  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    
    if (autoRefresh && !refreshInterval && verification && (!verification.status || verification.status === 'pending')) {
      refreshInterval = setInterval(loadVerification, 5000);
    } else if (!autoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
  
  function copyResults() {
    if (!verification) return;
    
    navigator.clipboard.writeText(JSON.stringify(verification, null, 2)).then(() => {
      console.log('Results copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Verification Results</h1>
      <p class="text-on-surface-variant">
        {#if verification}
          Session ID: {verification.id.substring(0, 12)}...
        {:else}
          Loading verification details...
        {/if}
      </p>
    </div>
    <div class="flex gap-2">
      <Button onclick={() => goto("/verification/sessions")} variant="outlined">
        Back to Sessions
      </Button>
    </div>
  </div>
  
  <!-- Loading State -->
  {#if loading && !verification}
    <Card class="py-12 text-center">
      <div class="flex flex-col items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="mt-4 text-on-surface-variant">Loading verification results...</p>
      </div>
    </Card>
  {:else if error}
    <Alert variant="error">
      {error}
      <div class="mt-2">
        <Button onclick={loadVerification} variant="outlined" size="small">
          Retry
        </Button>
      </div>
    </Alert>
  {:else if verification}
    <!-- Verification Overview -->
    <Card elevation={2} class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <h2 class="text-xl font-bold text-on-surface">Verification Session</h2>
            <Badge size="large" class={getStatusColor(verification.status || 'pending')}>
              {formatStatus(verification.status || 'pending')}
            </Badge>
            {#if isExpired()}
              <Badge size="large" class="bg-red-100 text-red-800">
                Expired
              </Badge>
            {/if}
          </div>
          
          <div class="space-y-1 text-sm text-on-surface-variant">
            <div>Created by: {verification.verifier.name} • {formatDate(verification.createdAt)}</div>
            <div>Expires: {formatDate(verification.expiresAt)}</div>
          </div>
        </div>
        
        <div class="flex gap-2">
          {#if !verification.status || verification.status === 'pending'}
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
          {/if}
          
          <Button
            onclick={copyResults}
            variant="outlined"
            size="small"
          >
            Copy Results
          </Button>
        </div>
      </div>
    </Card>
    
    <!-- QR Code & Status -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- QR Code -->
      <Card elevation={2} class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Verification QR Code</h3>
        
        <div class="flex flex-col items-center space-y-4">
          <QrCodeDisplay
            data={verification.request.data}
            size={300}
          />
          
          <div class="text-center text-sm text-on-surface-variant">
            Scan this QR code with a compatible wallet app
          </div>
        </div>
      </Card>
      
      <!-- Status & Timeline -->
      <Card elevation={2} class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Verification Status</h3>
        
        <div class="space-y-6">
          <!-- Status Timeline -->
          <div class="relative pl-6">
            <div class="absolute left-0 top-0 h-full w-1 bg-primary-container"></div>
            
            <div class="relative mb-6">
              <div class="absolute -left-6 top-0 h-3 w-3 rounded-full bg-primary"></div>
              <div class="text-sm font-medium text-on-surface">Request Created</div>
              <div class="text-xs text-on-surface-variant">{formatDate(verification.createdAt)}</div>
              <div class="mt-1 text-sm text-on-surface-variant">Verification request was created</div>
            </div>
            
            <div class="relative mb-6">
              <div class="absolute -left-6 top-0 h-3 w-3 rounded-full {verification.status ? 'bg-primary' : 'bg-surface-container'}"></div>
              <div class="text-sm font-medium text-on-surface">QR Code Scanned</div>
              <div class="text-xs text-on-surface-variant">
                {#if verification.status}
                  Completed
                {:else}
                  Awaiting scan...
                {/if}
              </div>
            </div>
            
            <div class="relative">
              <div class={`absolute -left-6 top-0 h-3 w-3 rounded-full ${
                verification.status === 'success' ? 'bg-green-500' :
                verification.status === 'failed' ? 'bg-red-500' :
                verification.status ? 'bg-yellow-500' : 'bg-surface-container'
              }`}></div>
              <div class="text-sm font-medium text-on-surface">Verification Result</div>
              <div class="text-xs text-on-surface-variant">
                {#if verification.status}
                  {formatStatus(verification.status)}
                {:else}
                  Pending...
                {/if}
              </div>
              <div class="mt-1 text-sm text-on-surface-variant">
                {#if verification.status === 'success'}
                  Credentials verified successfully
                {:else if verification.status === 'failed'}
                  Verification failed or credentials invalid
                {:else}
                  Waiting for verification response
                {/if}
              </div>
            </div>
          </div>
          
          <!-- Request Summary -->
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Request Summary</div>
            <div class="space-y-2">
              {#each verification.requestedCredentials as credential}
                <div class="flex items-center justify-between">
                  <span class="text-sm text-on-surface">{credential.credentialType}</span>
                  <Badge size="small" variant="secondary">
                    {credential.fields.length} fields
                  </Badge>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </Card>
    </div>
    
    <!-- Results -->
    {#if verification.results}
      <Card elevation={2} class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Verification Results</h3>
        
        <div class="space-y-6">
          {#each Object.entries(verification.results) as [credentialType, result]}
            <div class="rounded-lg border border-outline-variant">
              <!-- Credential Header -->
              <div class="border-b border-outline-variant p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <h4 class="font-semibold text-on-surface">{credentialType}</h4>
                    <Badge class={getStatusColor(result.status)}>
                      {formatStatus(result.status)}
                    </Badge>
                  </div>
                  <div class="text-sm text-on-surface-variant">
                    {#if result.claims}
                      {result.claims.length} credential{#if result.claims.length !== 1}s{/if}
                    {/if}
                  </div>
                </div>
              </div>
              
              <!-- Claims -->
              {#if result.claims && result.claims.length > 0}
                <div class="p-4">
                  <div class="space-y-4">
                    {#each result.claims as claim, claimIndex}
                      <div class="rounded-lg bg-surface-container p-4">
                        <div class="mb-2 flex items-center justify-between">
                          <div class="text-sm font-medium text-on-surface-variant">
                            Credential {claimIndex + 1}
                          </div>
                          <Badge size="small" variant="success">Verified</Badge>
                        </div>
                        
                        <div class="space-y-2">
                          {#each Object.entries(claim) as [key, value]}
                            <div class="flex justify-between">
                              <span class="text-sm text-on-surface-variant">{key}:</span>
                              <span class="text-sm font-medium text-on-surface">
                                {#if typeof value === 'object'}
                                  <pre class="text-xs font-mono overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                {:else}
                                  {value}
                                {/if}
                              </span>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else if result.status === 'failed'}
                <div class="p-4">
                  <div class="flex items-center gap-2 text-error">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>No valid credentials of this type were provided</span>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </Card>
    {:else if verification.status === 'pending' || !verification.status}
      <!-- Waiting for Results -->
      <Card elevation={2} class="p-6">
        <div class="text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <svg class="h-8 w-8 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-semibold text-on-surface">Awaiting Verification</h3>
          <p class="text-on-surface-variant">
            Scan the QR code with a compatible wallet app to proceed with verification.
          </p>
          <div class="mt-4">
            <Button onclick={loadVerification} variant="outlined">
              Check for Results
            </Button>
          </div>
        </div>
      </Card>
    {/if}
    
    <!-- Raw Data -->
    <Card elevation={2} class="p-6">
      <details>
        <summary class="cursor-pointer text-lg font-semibold text-on-surface hover:text-primary">
          <div class="flex items-center justify-between">
            <span>Raw Session Data</span>
            <svg class="h-5 w-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>
        
        <div class="mt-4 rounded-lg bg-surface-container-high p-4">
          <pre class="overflow-x-auto text-sm font-mono text-on-surface">
{JSON.stringify(verification, null, 2)}
          </pre>
        </div>
      </details>
    </Card>
    
  {:else}
    <!-- Not Found -->
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">Verification Not Found</h3>
      <p class="mt-1 text-on-surface-variant">
        The verification session could not be found.
      </p>
      <div class="mt-6">
        <Button onclick={() => goto("/verification/sessions")} variant="filled">
          Browse Verifications
        </Button>
      </div>
    </Card>
  {/if}
</div>

<style>
  details > summary {
    list-style: none;
  }
  
  details > summary::-webkit-details-marker {
    display: none;
  }
  
  details[open] > summary svg {
    transform: rotate(180deg);
  }
</style>