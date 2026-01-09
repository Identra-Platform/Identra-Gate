<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
	import Loading from '../ui/Loading.svelte';
  
  export let redirectTo = '/';
  
  let username = '';
  let password = '';
  let loading = false;
  let error = '';
  
  const handleSubmit = async () => {
    if (loading) return;
    
    if (!username.trim()) {
      error = 'Username is required';
      return;
    }
    
    if (!password) {
      error = 'Password is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      await auth.login(username, password);
      goto(redirectTo);
    } catch (err: any) {
      error = err.message || 'Login failed. Please check your credentials.';
    } finally {
      loading = false;
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
</script>

<Card elevation={2} padding="large" class="max-w-md mx-auto">
  <div class="mb-8 text-center">
    <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
      <svg class="h-8 w-8 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h2 class="text-2xl font-bold text-on-surface">Identra-Gate</h2>
    <p class="mt-2 text-sm text-on-surface-variant">
      Secure Identity Verification Platform
    </p>
  </div>
  
  {#if error}
    <Alert variant="error" class="mb-6">
      {error}
    </Alert>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-5">
    <Input
      label="Username"
      type="text"
      bind:value={username}
      placeholder="Enter your username"
      required
      onkeypress={handleKeyPress}
      disabled={loading}
    />
    
    <Input
      label="Password"
      type="password"
      bind:value={password}
      placeholder="Enter your password"
      required
      onkeypress={handleKeyPress}
      disabled={loading}
    />
    
    <Button
      type="submit"
      variant="filled"
      size="large"
      {loading}
      fullWidth
      class="mt-2"
    >
      {#if loading}
        <Loading />
      {/if}
      Sign In
    </Button>
  </form>
  
  <div class="mt-8 border-t border-outline-variant pt-6">
    <p class="text-center text-sm text-on-surface-variant">
      Version 1.0.0 • Secure Identity Management
    </p>
  </div>
</Card>