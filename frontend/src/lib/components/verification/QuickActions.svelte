<script lang="ts">
	import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  const actions = [
    {
      title: 'Identity Verification',
      description: 'Verify identity credentials',
      icon: 'identity',
      href: '/verification/create?type=identity',
      variant: 'outlined' as const
    },
    {
      title: 'Education Verification',
      description: 'Verify education credentials',
      icon: 'education',
      href: '/verification/create?type=education',
      variant: 'outlined' as const
    },
    {
      title: 'Employment Verification',
      description: 'Verify employment credentials',
      icon: 'employment',
      href: '/verification/create?type=employment',
      variant: 'outlined' as const
    },
    {
      title: 'Custom Verification',
      description: 'Create custom verification request',
      icon: 'custom',
      href: '/verification/create',
      variant: 'outlined' as const
    }
  ];
  
  const iconMap = {
    'identity': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    `,
    'education': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 14l9-5-9-5-9 5 9 5z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    `,
    'employment': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    `,
    'custom': `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
              {@html iconMap[action.icon as 'identity' | 'education' | 'employment' | 'custom']}
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