<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getAllCredentials } from '$lib/utils/api';
  
  let credentials: any[] = [];
  let loading = true;
  let error = '';
  
  let searchQuery = '';
  let statusFilter = '';
  
  const statuses = ['pending', 'issued', 'verified', 'expired', 'revoked'];
  
  onMount(async () => {
    await loadCredentials();
  });
  
  async function loadCredentials() {
    loading = true;
    error = '';
    
    try {
      // Call the API to get credentials
      const response = await getAllCredentials();
      credentials = response;
    } catch (err: any) {
      error = err.message || 'Failed to load credentials';
      console.error('Error loading credentials:', err);
    } finally {
      loading = false;
    }
  }
  
  $: filteredCredentials = credentials.filter(credential => {
    const matchesSearch = !searchQuery || 
      credential.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.holderDid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (credential.claims && JSON.stringify(credential.claims).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || 
      credential.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  function getStatusColor(status: string): string {
    switch (status) {
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
  
  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }
  
  function formatDateTime(dateString: string | null): string {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  }
  
  function isExpired(credential: any): boolean {
    if (!credential.expiresAt) return false;
    return new Date(credential.expiresAt) < new Date();
  }
  
  function getCredentialType(credential: any): string {
    // Try to determine type from claims or use default
    const claims = credential.claims || {};
    if (claims.fullName && claims.email) return 'Identity';
    if (claims.institution || claims.degree) return 'Education';
    if (claims.company || claims.position) return 'Professional';
    if (claims.organization || claims.membershipId) return 'Membership';
    return 'Custom';
  }
  
  function getClaimSummary(claims: Record<string, any>): string {
    if (!claims || Object.keys(claims).length === 0) return 'No claims';
    
    const firstClaim = Object.entries(claims)[0];
    return `${firstClaim[0]}: ${firstClaim[1]}`;
  }
  
  function truncateDid(did: string, maxLength: number = 40): string {
    if (did.length <= maxLength) return did;
    const start = did.substring(0, maxLength / 2);
    const end = did.substring(did.length - maxLength / 2);
    return `${start}...${end}`;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Issued Credentials</h2>
      <p class="text-on-surface-variant">Manage and track all issued credentials</p>
    </div>
    <div class="flex gap-2">
      <Button onclick={loadCredentials} variant="outlined" size="small" disabled={loading}>
        {#if loading}
          <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        {/if}
        Refresh
      </Button>
      <Button onclick={() => goto("/credentials/create")} variant="filled">
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Issue New
      </Button>
    </div>
  </div>
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
    </Alert>
  {/if}
  
  <!-- Filters -->
  <Card elevation={1} class="p-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Input
          label="Search Credentials"
          placeholder="Search by ID, DID, or claims..."
          bind:value={searchQuery}
        />
      </div>
      <div>
        <label for="status" class="block text-sm font-medium text-on-surface-variant mb-1">
          Status
        </label>
        <select
          name="status"
          bind:value={statusFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          {#each statuses as status}
            <option value={status}>{formatStatus(status)}</option>
          {/each}
        </select>
      </div>
    </div>
  </Card>
  
  <!-- Credentials Table -->
  <Card elevation={2} class="overflow-hidden">
    {#if loading && credentials.length === 0}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p class="text-on-surface-variant">Loading credentials...</p>
        </div>
      </div>
    {:else if filteredCredentials.length === 0}
      <div class="px-6 py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-on-surface">No credentials found</h3>
        <p class="mt-1 text-on-surface-variant">
          {#if searchQuery || statusFilter}
            Try adjusting your search or filters
          {:else}
            No credentials have been issued yet
          {/if}
        </p>
        <div class="mt-6">
          <Button onclick={() => goto("/credentials/create")} variant="filled">
            Issue Your First Credential
          </Button>
        </div>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-container-high">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Credential ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Holder DID
              </th>
              <th class="px6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Claims
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Issued
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Expires
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            {#each filteredCredentials as credential}
              <tr class="hover:bg-surface-container-high/50">
                <td class="px-6 py-4">
                  <div class="font-medium text-on-surface">{credential.id.substring(0, 8)}...</div>
                  <div class="text-xs text-on-surface-variant">
                    {getCredentialType(credential)}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-mono text-on-surface break-all max-w-50">
                    {truncateDid(credential.holderDid)}
                  </div>
                  {#if credential.transactionId}
                    <div class="mt-1 text-xs text-on-surface-variant">
                      TX: {credential.transactionId.substring(0, 8)}...
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-on-surface">
                    {getClaimSummary(credential.claims)}
                  </div>
                  <div class="text-xs text-on-surface-variant">
                    {Object.keys(credential.claims || {}).length} claim(s)
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <Badge class={getStatusColor(credential.status)}>
                      {formatStatus(credential.status)}
                    </Badge>
                    {#if isExpired(credential)}
                      <Badge class="bg-red-100 text-red-800 text-xs">
                        Expired
                      </Badge>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-on-surface-variant">
                    {formatDate(credential.issuedAt)}
                  </div>
                  {#if credential.issuedAt}
                    <div class="text-xs text-on-surface-variant">
                      {new Date(credential.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm {!credential.expiresAt || isExpired(credential) ? 'text-error' : 'text-on-surface-variant'}">
                    {credential.expiresAt ? formatDate(credential.expiresAt) : 'Never'}
                  </div>
                  {#if credential.expiresAt && isExpired(credential)}
                    <div class="text-xs text-error">Expired</div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-2">
                    <Button
                      onclick={() => goto(`/credentials/view/${credential.id}`)}
                      variant="text"
                      size="small"
                      fullWidth
                    >
                      View Details
                    </Button>
                    {#if credential.status !== 'revoked' && credential.status !== 'expired'}
                      <Button
                        onclick={() => goto(`/credentials/revoke/${credential.id}`)}
                        variant="text"
                        size="small"
                        class="text-error hover:text-on-error-container"
                        fullWidth
                      >
                        Revoke
                      </Button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Summary -->
      <div class="border-t border-outline-variant bg-surface-container-high px-6 py-3">
        <div class="flex items-center justify-between text-sm">
          <div class="text-on-surface-variant">
            Showing {filteredCredentials.length} of {credentials.length} credentials
          </div>
          <div class="flex gap-4">
            <div class="text-on-surface-variant">
              {credentials.filter(c => c.status === 'issued').length} issued
            </div>
            <div class="text-on-surface-variant">
              {credentials.filter(c => c.status === 'verified').length} verified
            </div>
            <div class="text-on-surface-variant">
              {credentials.filter(c => c.status === 'expired').length} expired
            </div>
          </div>
        </div>
      </div>
    {/if}
  </Card>
</div>

<style>
  /* Ensure table cells don't overflow */
  table {
    table-layout: fixed;
  }
  
  td, th {
    word-wrap: break-word;
  }
</style>