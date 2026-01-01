<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth";
	import { setup } from "$lib/stores/setup";
	import Alert from "../ui/Alert.svelte";
	import Button from "../ui/Button.svelte";
	import Card from "../ui/Card.svelte";
	import Input from "../ui/Input.svelte";
	import Loading from "../ui/Loading.svelte";

  interface Props {
    redirectTo?: string;
  }
  let {
    redirectTo = '/'
  }: Props = $props();

  let email = $state('');
  let password = $state('');
  let error = $state('');

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();

    if (!email.trim()) {
      error = 'Email is required';
      return;
    }
    
    if (!password) {
      error = 'Password is required';
      return;
    }

    try {
      await auth.login(email, password);
      goto(redirectTo);
    } catch (err: any) {
      error = err.message || 'Login failed. Please check your credentials.';
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
    <h2 class="text-2xl font-bold text-on-surface">Welcome Back</h2>
    <p class="mt-2 text-sm text-on-surface-variant">
      Sign in to your account
    </p>
  </div>
  
  {#if error}
    <Alert variant="error" class="mb-6">
      {error}
    </Alert>
  {/if}
  
  <form onsubmit={handleSubmit} class="space-y-5">
    <Input
      label="Email Address"
      type="email"
      bind:value={email}
      placeholder="you@example.com"
      required
      disabled={$auth.loading}
    />
    
    <Input
      label="Password"
      type="password"
      bind:value={password}
      placeholder="••••••••"
      required
      disabled={$auth.loading}
    />
    
    <Button
      type="submit"
      variant="filled"
      size="large"
      loading={$auth.loading}
      fullWidth
      class="mt-2"
    >
      {#if $auth.loading}
        <Loading />
      {/if}
      Sign In
    </Button>
  </form>
  
  {#if $setup.status?.requiredSetup}
    <div class="mt-8 border-t border-outline-variant pt-6">
      <p class="text-center text-sm text-on-surface-variant">
        Need to set up the server first
        <a
          href="/setup/initialize"
          class="font-medium text-primary hover:text-primary/80"
        >
          Begin setup
        </a>
      </p>
    </div>
  {/if}
</Card>