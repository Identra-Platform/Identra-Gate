<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  
  export let title: string;
  export let value: string;
  export let icon: 'users' | 'activity' | 'health' | 'performance' | 'issued' | 'active' | 'pending' | 'success' | 'failed' | 'rate' | 'export' | 'verification';
  export let color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  
  const colorClasses = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  const iconMap = {
    users: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.384-.5.819-.5 1.276v1a2 2 0 01-2 2h-2" />
    `,
    activity: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13 10V3L4 14h7v7l9-11h-7z" />
    `,
    health: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    `,
    performance: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13 10V3L4 14h7v7l9-11h-7z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4" />
    `,
    issued: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    `,
    active: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    `,
    pending: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    `,
    success: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    `,
    failed: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    `,
    rate: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    `,
    export: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    `,
    verification: `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    `
  };
</script>

<Card elevation={1} class="p-4">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-on-surface-variant">{title}</p>
      <p class="mt-1 text-2xl font-bold text-on-surface">{value}</p>
    </div>
    <div class={`rounded-lg p-2 ${colorClasses[color]}`}>
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {@html iconMap[icon]}
      </svg>
    </div>
  </div>
</Card>