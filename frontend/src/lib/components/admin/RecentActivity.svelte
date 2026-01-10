<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { ActivityLog, User } from '$lib/types/api';
	import { onMount } from 'svelte';
	import { getRecentActivites } from '$lib/utils/api';
  
  export let activities: ActivityLog[] = [];
  export let limit = 5;
  export let loading = false;
  export let error: string | null = null;

  onMount(async () => {
    activities = await getRecentActivites(2);
  });
  
  // Get action description text
  const getActionDescription = (action: string, status: string, error?: string): string => {
    const actionText = action.replace(/_/g, ' '); // Convert snake_case to spaces
    const formattedAction = actionText.charAt(0).toUpperCase() + actionText.slice(1);
    
    if (status === 'error' && error) {
      return `${formattedAction} failed: ${error}`;
    }
    
    return `${formattedAction} ${status === 'success' ? 'successful' : 'failed'}`;
  };
  
  // Get badge color based on status and action
  const getBadgeClass = (action: string, status: string): string => {
    if (status === 'error') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Common actions with specific colors
    switch (action.toLowerCase()) {
      case 'login':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'logout':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'create':
      case 'created':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'update':
      case 'updated':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'delete':
      case 'deleted':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'read':
      case 'view':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get badge display text
  const getBadgeText = (action: string, status: string): string => {
    const actionText = action.replace(/_/g, ' '); // Convert snake_case to spaces
    const formattedAction = actionText.charAt(0).toUpperCase() + actionText.slice(1);
    const statusIcon = status === 'success' ? '✓' : '✗';
    return `${formattedAction} ${statusIcon}`;
  };
  
  // Format timestamp to relative time
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return 'Invalid date';
    }
  };
  
  // Format full date for tooltip
  const formatFullDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = (name?: string): string => {
    if (!name || typeof name !== 'string') return '?';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  // Slice activities based on limit prop
  $: displayedActivities = activities.slice(0, limit);
</script>

<Card elevation={2} padding="large" class="h-full">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-on-surface">Recent Activity</h3>
    {#if loading}
      <div class="text-sm text-on-surface-variant">Loading...</div>
    {:else if activities.length > 0}
      <div class="text-sm text-on-surface-variant">
        {displayedActivities.length} of {activities.length}
      </div>
    {/if}
  </div>
  
  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {:else if displayedActivities.length === 0 && !loading}
    <div class="py-8 text-center">
      <svg class="mx-auto h-12 w-12 text-surface-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-on-surface-variant">No activity yet</h3>
      <p class="mt-1 text-sm text-on-surface-variant">User activities will appear here</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each displayedActivities as activity (activity.id)}
        <div class="flex items-start gap-3">
          <!-- User Avatar -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-container">
            <span class="text-sm font-medium">
              {getUserInitials(activity.user?.name)}
            </span>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <!-- User name -->
                <p class="truncate font-medium text-on-surface">
                  {activity.user?.name || 'Unknown User'}
                </p>
                
                <!-- Action description -->
                <p class="truncate text-sm text-on-surface-variant">
                  {getActionDescription(activity.action, activity.status, activity.error)}
                </p>
                
                <!-- Email (if available) -->
                {#if activity.user?.email}
                  <p class="truncate text-xs text-on-surface-variant/70">
                    {activity.user.email}
                  </p>
                {/if}
              </div>
              
              <!-- Status badge -->
              <Badge 
                size="small" 
                class={getBadgeClass(activity.action, activity.status)}
              >
                {getBadgeText(activity.action, activity.status)}
              </Badge>
            </div>
            
            <!-- Timestamp with tooltip -->
            <div 
              class="mt-1 text-xs text-on-surface-variant"
              title={formatFullDate(activity.timestamp)}
            >
              {formatTime(activity.timestamp)}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Show more indicator -->
    {#if activities.length > limit}
      <div class="mt-4 pt-4 border-t border-surface-variant">
        <p class="text-center text-sm text-on-surface-variant">
          Showing {limit} of {activities.length} activities
        </p>
      </div>
    {/if}
  {/if}
</Card>

<style>
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>