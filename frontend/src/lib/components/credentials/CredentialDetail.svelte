<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getCredentialById } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { CredentialOfferResponse, User } from '$lib/types/api';
  import { goto } from '$app/navigation';
  import QrCode from 'svelte-qrcode';
  
  export let credentialId: string;
  
  let credential: CredentialOfferResponse | null = null;
  let loading = true;
  let error = '';
  let showQrCode = true;
  
  onMount(async () => {
    await loadCredential();
  });
  
  async function loadCredential() {
    loading = true;
    error = '';
    
    try {
      credential = await getCredentialById(credentialId);
    } catch (err: any) {
      error = err.message || 'Failed to load credential';
      console.error('Error loading credential:', err);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  function isExpired(): boolean {
    if (!credential) return false;
    return new Date(credential.expiration) < new Date();
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Show success message (you could add a toast here)
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Credential Details</h1>
      <p class="text-on-surface-variant">View detailed information about this credential</p>
    </div>
    <Button onclick={() => goto("/issuance/issued")} variant="outlined">
      <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Credentials
    </Button>
  </div>
  
  <!-- Loading State -->
  {#if loading}
    <Card class="py-12 text-center">
      <div class="flex flex-col items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="mt-4 text-on-surface-variant">Loading credential details...</p>
      </div>
    </Card>
  {:else if error}
    <Alert variant="error">
      {error}
      <div class="mt-2">
        <Button onclick={loadCredential} variant="outlined" size="small">
          Retry
        </Button>
      </div>
    </Alert>
  {:else if credential}
    <!-- Credential Header -->
    <Card elevation={2} class="p-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="mb-2 flex items-center gap-3">
            <h2 class="text-xl font-bold text-on-surface">{credential.credentialId}</h2>
            <Badge size="large" class={getStatusColor(credential.status)}>
              {formatStatus(credential.status)}
            </Badge>
            {#if isExpired()}
              <Badge size="large" class="bg-red-100 text-red-800">
                Expired
              </Badge>
            {/if}
          </div>
          <p class="text-on-surface-variant">Credential ID: {credential.id}</p>
        </div>
        <div class="flex gap-2">
          <Button
            variant="outlined"
            size="small"
            onclick={() => copyToClipboard(credential?.id ?? '')}
            title="Copy Credential ID"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left Column: Credential Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- QR Code Section -->
        <Card elevation={2} class='p-6'>
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-on-surface">Credential QR Code</h3>
            <div class="flex gap-2">
              <button
                onclick={() => showQrCode = !showQrCode}
                class="rounded-lg bg-surface-container-high px-3 py-1 text-sm font-medium text-on-surface hover:bg-surface-container"
              >
                {showQrCode ? 'Hide QR' : 'Show QR'}
              </button>
            </div>
          </div>

          {#if showQrCode}
            <div class="flex flex-col items-center space-y-4">
              <div
                id={`qr-${credential.id}`}
                class="rounded-lg border-4 border-white bg-white p-2 shadow-lg pl-6 pt-6"
              >
                <QrCode
                  value={credential.credentialData.offerData}
                  size={200}
                  level='L'
                  padding={0}
                  bgColor="#FFFFFF"
                  fgColor="#4C3E76"
                />
              </div>
              
              <div class="text-center">
                <p class="text-sm text-on-surface-variant">
                  Scan this QR code to retrieve the credential offer
                </p>
                <div class="mt-2 flex items-center justify-center gap-2">
                  <Button
                    onclick={() => copyToClipboard(credential?.credentialData.offerData)}
                    variant="text"
                    size="small"
                  >
                    <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy QR Data
                  </Button>
                </div>
              </div>
            </div>
          {:else}
            <div class="rounded-lg border-2 border-dashed border-outline-variant p-8 text-center">
              <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p class="mt-2 text-sm text-on-surface-variant">QR code is hidden</p>
              <Button
                onclick={() => showQrCode = true}
                variant="outlined"
                size="small"
                class="mt-4"
              >
                Show QR Code
              </Button>
            </div>
          {/if}
        </Card>
        <!-- Holder Information -->
        <Card elevation={2} class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Holder Information</h3>
          <div class="space-y-4">
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-1 text-sm font-medium text-on-surface-variant">Holder DID</div>
              <div class="flex items-center justify-between">
                <div class="font-mono text-sm text-on-surface break-all">
                  {credential.holderDid}
                </div>
                <Button
                  variant="text"
                  size="small"
                  onclick={() => copyToClipboard(credential?.holderDid ?? '')}
                  title="Copy DID"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="rounded-lg bg-surface-container p-4">
                <div class="mb-1 text-sm font-medium text-on-surface-variant">Created</div>
                <div class="text-sm text-on-surface">{formatDate(credential.createdAt)}</div>
              </div>
              <div class="rounded-lg bg-surface-container p-4">
                <div class="mb-1 text-sm font-medium text-on-surface-variant">Expiration</div>
                <div class="text-sm text-on-surface {isExpired() ? 'text-error' : ''}">
                  {formatDate(credential.expiration)}
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <!-- Claims Data -->
        <Card elevation={2} class="p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-on-surface">Credential Claims</h3>
            <Badge variant="secondary">{Object.keys(credential.claims).length} claims</Badge>
          </div>
          
          <div class="space-y-3">
            {#each Object.entries(credential.claims) as [key, value]}
              <div class="rounded-lg bg-surface-container p-4">
                <div class="mb-1 text-sm font-medium text-on-surface-variant">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </div>
                <div class="text-on-surface">
                  {#if typeof value === 'object'}
                    <pre class="text-sm font-mono overflow-x-auto p-2 bg-surface-container-high rounded">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  {:else}
                    {value}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Card>
      </div>
      
      <!-- Right Column: Metadata & Actions -->
      <div class="space-y-6">
        <!-- Issuer Information -->
        <Card elevation={2} class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Issuer Information</h3>
          
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <span class="font-semibold">
                  {credential.issuer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div class="font-semibold text-on-surface">{credential.issuer.name}</div>
                <div class="text-sm text-on-surface-variant">{credential.issuer.email}</div>
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="text-sm">
                <span class="font-medium text-on-surface-variant">Issuer ID:</span>
                <span class="ml-2 font-mono text-xs text-on-surface">{credential.issuer.id}</span>
              </div>
              
              <div class="text-sm">
                <span class="font-medium text-on-surface-variant">Roles:</span>
                <div class="mt-1 flex flex-wrap gap-1">
                  {#each credential.issuer.roles as role}
                    <Badge size="small" variant="secondary">{role}</Badge>
                  {/each}
                </div>
              </div>
              
              <div class="text-sm">
                <span class="font-medium text-on-surface-variant">Member Since:</span>
                <span class="ml-2 text-on-surface">
                  {new Date(credential.issuer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- JSON View Toggle -->
        <Card elevation={2} class="p-6">
          <details>
            <summary class="cursor-pointer text-lg font-semibold text-on-surface hover:text-primary">
              <div class="flex items-center justify-between">
                <span>Raw JSON Data</span>
                <svg class="h-5 w-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            
            <div class="mt-4 rounded-lg bg-surface-container-high p-4">
              <pre class="overflow-x-auto text-sm font-mono text-on-surface">
    {JSON.stringify(credential, null, 2)}
              </pre>
            </div>
          </details>
        </Card>
      </div>
    </div>
    
  {:else}
    <!-- Not Found State -->
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">Credential Not Found</h3>
      <p class="mt-1 text-on-surface-variant">
        The credential with ID "{credentialId}" could not be found.
      </p>
      <div class="mt-6">
        <Button onclick={() => goto("/issuance/issued")} variant="filled">
          Browse Credentials
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