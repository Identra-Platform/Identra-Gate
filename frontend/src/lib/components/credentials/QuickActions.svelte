<script lang="ts">
	import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  const actions = [
    {
      title: 'Issue Identity Credential',
      description: 'Create a new identity credential',
      icon: 'identity',
      href: '/credentials/create?type=identity',
      variant: 'outlined' as const
    },
    {
      title: 'Create Template',
      description: 'Design a reusable credential template',
      icon: 'template',
      href: '/credentials/templates/create',
      variant: 'outlined' as const
    },
    {
      title: 'Batch Issue',
      description: 'Issue multiple credentials at once',
      icon: 'batch',
      href: '/credentials/batch',
      variant: 'outlined' as const
    },
    {
      title: 'API Documentation',
      description: 'Integration guide and API reference',
      icon: 'api',
      href: '/docs/api',
      variant: 'outlined' as const
    }
  ];
  
  const iconMap: Record<string, string> = {
    'identity': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    `,
    'template': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    `,
    'batch': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13 11h4m-2 2v-4" />
    `,
    'api': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    `
  };
</script>

<Card elevation={2} padding="large" class="h-full">
  <h3 class="mb-4 text-lg font-semibold text-on-surface">Quick Actions</h3>
  <div class="space-y-3">
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