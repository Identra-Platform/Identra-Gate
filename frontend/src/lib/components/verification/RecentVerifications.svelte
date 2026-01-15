<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { getVerificationSessions } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { VerificationSession } from '$lib/types/api';
  
  export let limit = 5;
  
  let recentVerifications: VerificationSession[] = [];
  let loading = true;
  
  onMount(async () => {
    await loadRecentVerifications();
  });
  
  async function loadRecentVerifications() {
    try {
      const response = await getVerificationSessions();
      recentVerifications = response.slice(0, limit);
    } catch (error) {
      console.error('Error loading recent verifications:', error);
      recentVerifications = []; // Return empty array instead of mock
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
  
  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
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
        results: undefined,
        createdAt: '2024-01-15T09:45:00Z',
        expiresAt: '2024-01-15T10:45:00Z',
        status: 'pending'
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
            status: 'failed'
          }
        },
        createdAt: '2024-01-14T16:20:00Z',
        expiresAt: '2024-01-14T17:20:00Z',
        status: 'failed'
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
          { credentialType: 'MembershipCredential', fields: ['memberId', 'role'] },
          { credentialType: 'IdentityCredential', fields: ['fullName', 'email'] }
        ],
        results: {
          MembershipCredential: {
            status: 'success',
            claims: [{ memberId: 'M12345', role: 'Premium' }]
          },
          IdentityCredential: {
            status: 'success',
            claims: [{ fullName: 'Alice Smith', email: 'alice@example.com' }]
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
        results: undefined,
        createdAt: '2024-01-14T11:30:00Z',
        expiresAt: '2024-01-14T12:30:00Z',
        status: 'pending'
      }
    ];
  }
</script>

<Card elevation={2} padding="large" class="h-full">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-on-surface">Recent Verifications</h3>
    <a href="/verification/sessions" class="text-sm font-medium text-primary hover:text-primary/80">
      View all
    </a>
  </div>
  
  {#if loading}
    <!-- Loading skeleton stays the same -->
    <div class="space-y-4">
      {#each Array(limit).fill(0) as _, i}
        <div class="animate-pulse rounded-lg bg-surface-container p-3">
          <div class="flex items-center justify-between">
            <div class="space-y-2">
              <div class="h-4 w-32 rounded bg-surface-container-high"></div>
              <div class="h-3 w-24 rounded bg-surface-container-high"></div>
            </div>
            <div class="h-6 w-16 rounded bg-surface-container-high"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if recentVerifications.length === 0}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <div class="mb-4 text-on-surface-variant">
        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h4 class="mb-2 text-lg font-medium text-on-surface">No verifications yet</h4>
      <p class="mb-4 text-sm text-on-surface-variant">
        Verification sessions will appear here once created.
      </p>
      <a
        href="/verification/create"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
      >
        Create First Verification
      </a>
    </div>
  {:else}
    <!-- Existing verifications list -->
    <div class="space-y-4">
      {#each recentVerifications as verification}
        <a
          href={`/verification/view/${verification.id}`}
          class="block rounded-lg bg-surface-container p-3 transition-colors hover:bg-surface-container-high"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-on-surface">
                {verification.requestedCredentials.length} credential{verification.requestedCredentials.length !== 1 ? 's' : ''}
              </div>
              <div class="text-xs text-on-surface-variant">
                {verification.verifier.name} • {formatTime(verification.createdAt)}
              </div>
            </div>
            <Badge class={getStatusColor(verification.status || 'pending')}>
              {verification.status || 'pending'}
            </Badge>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</Card>