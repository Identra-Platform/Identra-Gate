<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { getVerificationSessions } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { VerificationSession } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import Alert from '../ui/Alert.svelte';
  
  let verifications: VerificationSession[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let statusFilter = '';
  let dateFilter = '';
  
  onMount(async () => {
    await loadVerifications();
  });
  
  async function loadVerifications() {
    loading = true;
    error = '';
    
    try {
      const response = await getVerificationSessions();
      verifications = response;
    } catch (err: any) {
      error = err.message || 'Failed to load verification history';
      console.error('Error loading verifications:', err);
      // Fallback to mock data
      verifications = getMockVerifications();
    } finally {
      loading = false;
    }
  }
  
  const statuses = ['success', 'failed', 'pending'];
  
  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = !searchQuery || 
      verification.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.verifier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.requestedCredentials.some(cred => 
        cred.credentialType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = !statusFilter || 
      verification.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      verification.createdAt.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  function clearFilters() {
    searchQuery = '';
    statusFilter = '';
    dateFilter = '';
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  // Mock data function
  function getMockVerifications(): VerificationSession[] {
    return [
      {
        id: 'ver_123',
        verifier: {
          id: 'usr_1',
          email: 'verifier@example.com',
          name: 'John Verifier',
          roles: ['verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_123',
          data: 'https://example.com/verification/123'
        },
        requestedCredentials: [
          { credentialType: 'IdentityCredential', fields: ['fullName', 'email'] },
          { credentialType: 'EducationCredential', fields: ['degree', 'institution'] }
        ],
        results: {
          IdentityCredential: {
            status: 'success',
            claims: [{ fullName: 'John Doe', email: 'john@example.com' }]
          }
        },
        createdAt: '2024-01-15T10:30:00Z',
        expiresAt: '2024-01-15T11:30:00Z',
        status: 'success'
      },
      {
        id: 'ver_456',
        verifier: {
          id: 'usr_2',
          email: 'admin@example.com',
          name: 'Admin User',
          roles: ['admin', 'verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_456',
          data: 'https://example.com/verification/456'
        },
        requestedCredentials: [
          { credentialType: 'EmploymentCredential', fields: ['position', 'company'] }
        ],
        results: {
          EmploymentCredential: {
            status: 'failed'
          }
        },
        createdAt: '2024-01-15T09:45:00Z',
        expiresAt: '2024-01-15T10:45:00Z',
        status: 'failed'
      },
      {
        id: 'ver_789',
        verifier: {
          id: 'usr_1',
          email: 'verifier@example.com',
          name: 'John Verifier',
          roles: ['verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_789',
          data: 'https://example.com/verification/789'
        },
        requestedCredentials: [
          { credentialType: 'IdentityCredential', fields: ['fullName', 'nationalId'] }
        ],
        results: {
          IdentityCredential: {
            status: 'success',
            claims: [{ fullName: 'Alice Smith', nationalId: 'ID123456' }]
          }
        },
        createdAt: '2024-01-14T16:20:00Z',
        expiresAt: '2024-01-14T17:20:00Z',
        status: 'success'
      },
      {
        id: 'ver_101',
        verifier: {
          id: 'usr_3',
          email: 'jane@example.com',
          name: 'Jane Wilson',
          roles: ['verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_101',
          data: 'https://example.com/verification/101'
        },
        requestedCredentials: [
          { credentialType: 'MembershipCredential', fields: ['memberId', 'role'] }
        ],
        results: {
          MembershipCredential: {
            status: 'success',
            claims: [{ memberId: 'M12345', role: 'Premium' }]
          }
        },
        createdAt: '2024-01-14T14:10:00Z',
        expiresAt: '2024-01-14T15:10:00Z',
        status: 'success'
      },
      {
        id: 'ver_112',
        verifier: {
          id: 'usr_2',
          email: 'admin@example.com',
          name: 'Admin User',
          roles: ['admin', 'verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_112',
          data: 'https://example.com/verification/112'
        },
        requestedCredentials: [
          { credentialType: 'CertificateCredential', fields: ['certificateId', 'issueDate'] }
        ],
        results: {
          CertificateCredential: {
            status: 'failed'
          }
        },
        createdAt: '2024-01-14T11:30:00Z',
        expiresAt: '2024-01-14T12:30:00Z',
        status: 'failed'
      },
      {
        id: 'ver_131',
        verifier: {
          id: 'usr_1',
          email: 'verifier@example.com',
          name: 'John Verifier',
          roles: ['verifier'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        request: {
          id: 'req_131',
          data: 'https://example.com/verification/131'
        },
        requestedCredentials: [
          { credentialType: 'IdentityCredential', fields: ['fullName', 'email'] },
          { credentialType: 'EducationCredential', fields: ['degree'] }
        ],
        results: undefined,
        createdAt: '2024-01-14T10:15:00Z',
        expiresAt: '2024-01-14T11:15:00Z',
        status: 'pending'
      }
    ];
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Verification History</h2>
      <p class="text-on-surface-variant">View past verification requests and results</p>
    </div>
    <Button onclick={() => goto("/verification/create")} variant="filled">
      <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Verification
    </Button>
  </div>
  
  <!-- Filters -->
  <Card elevation={1} class="p-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <Input
          label="Search"
          placeholder="Search by ID, verifier, or credential type..."
          bind:value={searchQuery}
        />
      </div>
      <div>
        <label for="status" class="font-medium text-on-surface-variant mb-1">
          Status
        </label>
        <select
          bind:value={statusFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          {#each statuses as status}
            <option value={status}>{formatStatus(status)}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="date" class="block text-sm font-medium text-on-surface-variant mb-1">
          Date
        </label>
        <input
          type="date"
          bind:value={dateFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
      </div>
    </div>
    <div class="mt-4 flex justify-end">
      <Button onclick={clearFilters} variant="text" size="small">
        Clear Filters
      </Button>
    </div>
  </Card>
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
      <div class="mt-2">
        <Button onclick={loadVerifications} variant="outlined" size="small">
          Retry
        </Button>
      </div>
    </Alert>
  {/if}
  
  <!-- Loading State -->
  {#if loading}
    <Card class="py-12">
      <div class="flex flex-col items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p class="mt-4 text-on-surface-variant">Loading verification history...</p>
      </div>
    </Card>
  {:else if filteredVerifications.length === 0}
    <!-- Empty State -->
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">No Verification History</h3>
      <p class="mt-1 text-on-surface-variant">
        {#if searchQuery || statusFilter || dateFilter}
          No verifications match your filters
        {:else}
          Start by creating your first verification request
        {/if}
      </p>
      <div class="mt-6">
        <Button onclick={() => goto("/verification/create")} variant="filled">
          Create Verification Request
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Verifications Table -->
    <Card elevation={2} class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-container-high">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Verifier
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Credentials
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            {#each filteredVerifications as verification}
              <tr class="hover:bg-surface-container-high/50">
                <td class="px-6 py-4">
                  <div class="font-mono text-sm text-on-surface">
                    {verification.id.substring(0, 8)}...
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-on-surface">{verification.verifier.name}</div>
                  <div class="text-xs text-on-surface-variant">{verification.verifier.email}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="space-y-1">
                    {#each verification.requestedCredentials as credential}
                      <div class="text-sm text-on-surface">
                        • {credential.credentialType}
                      </div>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <Badge class={getStatusColor(verification.status || 'pending')}>
                    {formatStatus(verification.status || 'pending')}
                  </Badge>
                </td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">
                  {formatDate(verification.createdAt)}
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <Button
                      onclick={() => goto(`/verification/view/${verification.id}`)}
                      variant="text"
                      size="small"
                    >
                      View
                    </Button>
                    {#if verification.status === 'pending'}
                      <Button
                        onclick={() => goto(`/verification/view/${verification.id}`)}
                        variant="tonal"
                        size="small"
                      >
                        Check Status
                      </Button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="border-t border-outline-variant px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-on-surface-variant">
            Showing {filteredVerifications.length} of {verifications.length} verifications
          </div>
          <div class="flex gap-2">
            <Button variant="text" size="small" disabled>
              Previous
            </Button>
            <Button variant="text" size="small">
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  {/if}
</div>