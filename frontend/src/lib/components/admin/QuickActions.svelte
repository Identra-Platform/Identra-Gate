<script lang="ts">
	import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  const actions = [
    {
      title: 'Add New User',
      description: 'Create a new system user account',
      icon: 'add-user',
      href: '/admin/users/create',
      variant: 'outlined' as const
    },
    {
      title: 'Export Data',
      description: 'Export user data and logs',
      icon: 'export',
      href: '/admin/export',
      variant: 'outlined' as const
    },
    {
      title: 'System Health',
      description: 'Check system status and metrics',
      icon: 'health',
      href: '/health',
      variant: 'outlined' as const
    },
    {
      title: 'View Logs',
      description: 'Access system activity logs',
      icon: 'logs',
      href: '/admin/logs',
      variant: 'outlined' as const
    }
  ];
  
  const iconMap: Record<string, string> = {
    'add-user': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    `,
    'export': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    `,
    'health': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    `,
    'logs': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    `
  };
</script>

<Card elevation={2} padding="large" class="h-full">
  <h3 class="mb-4 text-lg font-semibold text-on-surface">Quick Actions</h3>
  <div class='grid gap-4 lg:grid-cols-2'>
    {#each actions as action}
      <Button
        onclick={() => goto(action.href)}
        variant={action.variant}
        class="h-auto w-full justify-start p-3 text-left"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary-container p-2">
            <svg class="h-5 w-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {@html iconMap[action.icon]}
            </svg>
          </div>
          <div class="flex-1">
            <div class="font-medium text-on-surface">{action.title}</div>
            <div class="text-xs text-on-surface-variant">{action.description}</div>
          </div>
          <svg class="h-4 w-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Button>
    {/each}
  </div>
</Card>