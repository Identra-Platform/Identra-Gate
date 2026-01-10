<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getRecentActivites } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { ActivityLog } from '$lib/types/api';
  import { Search } from 'lucide-svelte';
  
  let activities: ActivityLog[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let dateFilter = '';
  let userFilter = '';
  let actionFilter = '';
  
  // Available actions for filter dropdown
  const actions = [
    'login',
    'logout',
    'user_created',
    'user_updated',
    'user_deleted',
    'credential_issued',
    'credential_verified',
    'settings_updated',
    'data_exported',
    'health_check',
    'backup_completed'
  ];
  
  onMount(async () => {
    await loadActivities();
  });
  
  async function loadActivities() {
    loading = true;
    error = '';
    
    try {
      // Load all activities (you might need to create a separate endpoint for all activities)
      activities = await getRecentActivites(100); // Load more for filtering
    } catch (err: any) {
      error = err.message || 'Failed to load activities';
      activities = [];
      console.error('Error loading activities:', err);
    } finally {
      loading = false;
    }
  }
  
  // Filter activities based on search criteria
  let filteredActivities: ActivityLog[] = [];
  $: {
    console.log('Filter function running...');
    console.log('Search query:', searchQuery);
    console.log('All activities:', activities);
    
    filteredActivities = activities.filter(activity => {
      console.log('Processing activity:', activity);
      console.log('Activity user:', activity.user);
      
      const matchesSearch = !searchQuery || 
        activity.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.error && activity.error.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesDate = !dateFilter || 
        activity.timestamp.startsWith(dateFilter);
      
      const matchesUser = !userFilter || 
        (activity.user?.name?.toLowerCase().includes(userFilter.toLowerCase()) ||
         activity.user?.email?.toLowerCase().includes(userFilter.toLowerCase()));
      
      const matchesAction = !actionFilter || 
        activity.action === actionFilter;
      
      const result = matchesSearch && matchesDate && matchesUser && matchesAction;
      console.log('Activity result:', result);
      return result;
    });
    
    console.log('Filtered count:', filteredActivities.length);
  }
  
  function clearFilters() {
    searchQuery = '';
    dateFilter = '';
    userFilter = '';
    actionFilter = '';
  }
  
  function formatAction(action: string): string {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
  
  // Get action color based on action type
  const getActionColor = (action: string, status: string) => {
    if (status === 'error') return 'bg-red-100 text-red-800 border-red-200';
    
    if (action.includes('user')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('credential')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (action.includes('settings')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (action.includes('data')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('system')) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (action === 'login' || action === 'logout') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  // Get role color for user badges
  const getRoleColor = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'bg-gray-100 text-gray-800';
    
    // Show primary role (first role)
    const primaryRole = roles[0];
    switch (primaryRole) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'verifier': return 'bg-blue-100 text-blue-800';
      case 'issuer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get description for activity
  const getDescription = (activity: ActivityLog): string => {
    const userName = activity.user?.name || activity.user?.email || 'Unknown User';
    const action = formatAction(activity.action);
    
    if (activity.status === 'error' && activity.error) {
      return `${action} failed: ${activity.error}`;
    }
    
    switch (activity.action) {
      case 'login':
        return `${userName} logged in`;
      case 'logout':
        return `${userName} logged out`;
      default:
        return `${userName} performed ${action.toLowerCase()}`;
    }
  };
  
  // Safely format date
  function formatDate(dateString: string | Date): string {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Activity Log</h2>
      <p class="text-on-surface-variant">System activity and audit trail</p>
    </div>
    <div class="flex gap-2">
      <Button onclick={loadActivities} variant="outlined" size="small">
        Refresh
      </Button>
      <Button variant="outlined" size="small" onclick={() => window.print()}>
        Export Logs
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
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Input
          label="Search"
          placeholder="Search activities..."
          bind:value={searchQuery}
          trailingIcon={Search}
        />
      </div>
      <div>
        <label for="date-filter" class="block text-sm font-medium text-on-surface-variant mb-1">
          Date
        </label>
        <input
          id="date-filter"
          type="date"
          bind:value={dateFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label for="user-filter" class="block text-sm font-medium text-on-surface-variant mb-1">
          User
        </label>
        <input
          id="user-filter"
          type="text"
          bind:value={userFilter}
          placeholder="Filter by user..."
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label for="action-filter" class="block text-sm font-medium text-on-surface-variant mb-1">
          Action
        </label>
        <select
          id="action-filter"
          bind:value={actionFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="">All Actions</option>
          {#each actions as action}
            <option value={action}>{formatAction(action)}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="mt-4 flex justify-end">
      <Button onclick={clearFilters} variant="text" size="small">
        Clear Filters
      </Button>
    </div>
  </Card>
  
  <!-- Activity Log -->
  <Card elevation={2} class="overflow-hidden">
    {#if loading}
      <div class="flex h-64 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span class="ml-2 text-on-surface-variant">Loading activities...</span>
      </div>
    {:else if filteredActivities.length === 0}
      <div class="flex h-64 flex-col items-center justify-center">
        <svg class="h-12 w-12 text-surface-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2 text-on-surface-variant">No activities found</p>
        {#if searchQuery || dateFilter || userFilter || actionFilter}
          <p class="text-sm text-on-surface-variant/70">Try adjusting your filters</p>
          <Button onclick={clearFilters} variant="text" size="small" class="mt-2">
            Clear Filters
          </Button>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-container-high">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Timestamp
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Action
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
                Details
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            {#each filteredActivities as activity (activity.id)}
              <tr class="hover:bg-surface-container-high/50">
                <td class="px-6 py-4">
                  <div class="text-sm text-on-surface-variant">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                  <div class="text-xs text-on-surface-variant/70">
                    {formatDate(activity.timestamp)}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div>
                      <div class="font-medium text-on-surface">
                        {activity.user?.name || 'Unknown User'}
                      </div>
                      <div class="text-xs text-on-surface-variant">
                        {activity.user?.email || 'No email'}
                      </div>
                    </div>
                    {#if activity.user?.roles && activity.user.roles.length > 0}
                      <Badge size="small" class={getRoleColor(activity.user.roles)}>
                        {activity.user.roles[0]}
                        {#if activity.user.roles.length > 1}
                          <span class="ml-1">+{activity.user.roles.length - 1}</span>
                        {/if}
                      </Badge>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <Badge class={getActionColor(activity.action, activity.status)}>
                    {formatAction(activity.action)}
                  </Badge>
                </td>
                <td class="px-6 py-4">
                  <Badge 
                    size="small" 
                    variant={activity.status === 'success' ? 'primary' : 'error'}
                  >
                    {activity.status === 'success' ? '✓ Success' : '✗ Error'}
                  </Badge>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-on-surface">{getDescription(activity)}</div>
                  {#if activity.error && activity.status === 'error'}
                    <div class="mt-1 text-xs text-error">
                      Error: {activity.error}
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Show count -->
      <div class="border-t border-outline-variant px-6 py-3">
        <div class="flex items-center justify-between">
          <div class="text-sm text-on-surface-variant">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
          {#if filteredActivities.length !== activities.length}
            <Button onclick={clearFilters} variant="text" size="small">
              Clear filters to show all
            </Button>
          {/if}
        </div>
      </div>
    {/if}
  </Card>
</div>