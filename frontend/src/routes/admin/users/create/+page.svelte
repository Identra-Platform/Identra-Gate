<script lang="ts">
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { createUser } from '$lib/utils/api';
  import { goto } from '$app/navigation';
  
  let loading = false;
  let error = '';
  
  let formData = {
    email: '',
    name: '',
    password: '',
    roles: [] as string[]
  };
  let confirmPassword = '';
  
  const roles = ['admin', 'verifier', 'issuer', 'user'];
  
  async function handleSubmit() {
    if (!formData.email || !formData.name || !formData.password) {
      error = 'All fields are required';
      return;
    }
    
    if (formData.password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    if (formData.roles.length === 0) {
      error = 'At least one role must be selected';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      await createUser(formData);
      goto('/admin/users');
    } catch (err: any) {
      error = err.message || 'Failed to create user';
    } finally {
      loading = false;
    }
  }
  
  function toggleRole(role: string) {
    if (formData.roles.includes(role)) {
      formData.roles = formData.roles.filter(r => r !== role);
    } else {
      formData.roles = [...formData.roles, role];
    }
  }
</script>

<AuthGuard requireRoles={['admin']}>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-on-surface">Create New User</h1>
        <p class="text-on-surface-variant">Add a new user to the system</p>
      </div>
      <Button onclick={() => goto("/admin/users")} variant="outlined">
        Back to Users
      </Button>
    </div>
    
    <!-- Form -->
    <Card class="max-w-2xl p-6">
      {#if error}
        <Alert variant="error" class="mb-6" onclose={() => error = ''}>
          {error}
        </Alert>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            bind:value={formData.name}
            required
            placeholder="John Doe"
            disabled={loading}
          />
          <Input
            label="Email Address"
            type="email"
            bind:value={formData.email}
            required
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>
        
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Password"
            type="password"
            bind:value={formData.password}
            required
            placeholder="••••••••"
            disabled={loading}
          />
          <Input
            label="Confirm Password"
            type="password"
            bind:value={confirmPassword}
            required
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
        
        <!-- Role Selection -->
        <fieldset class="space-y-2">
          <legend class="block text-sm font-medium text-on-surface-variant mb-2">
            User Roles (select at least one)
          </legend>
          <div class="flex flex-wrap gap-2">
            {#each roles as role}
              <button
                type="button"
                on:click={() => toggleRole(role)}
                disabled={loading}
                class={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  formData.roles.includes(role)
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            {/each}
          </div>
        </fieldset>
        
        <div class="flex justify-end gap-2 pt-4">
          <Button onclick={() => goto("/admin/users")} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="filled" {loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</AuthGuard>