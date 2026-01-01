<script>
	import Button from "$lib/components/ui/Button.svelte";
	import Card from "$lib/components/ui/Card.svelte";
	import Loading from "$lib/components/ui/Loading.svelte";
	import { setup } from "$lib/stores/setup";

	//href="/setup/initialize"
	//href="/health"
	//href="/setup/reset"

  setup.checkStatus();
</script>
{#if $setup.loading}
	<Loading />
{:else if $setup.status}
	{#if $setup.status.requiredSetup}
		<Card class="max-w-md mx-auto text-center">
      <div class="space-y-4">
        <h1 class="text-2xl font-bold text-on-surface">Setup Required</h1>
        <p class="text-on-surface-variant">
          Your verifier server needs to be configured before use.
        </p>
        <Button variant="filled" size="large">
          Begin Setup
        </Button>
      </div>
    </Card>
	{:else}
		<Card class="max-w-md mx-auto text-center">
      <div class="space-y-4">
        <h1 class="text-2xl font-bold text-on-surface">Welcome to {$setup.status.serverName}</h1>
        <p class="text-on-surface-variant">
          Server is ready and running version {$setup.status.version}
        </p>
        <div class="flex gap-4 justify-center">
          <Button variant="tonal">
            View Health
          </Button>
          <Button variant="outlined">
            Reset Server
          </Button>
        </div>
      </div>
    </Card>
	{/if}
{:else if $setup.error}
	<Card class="max-w-md mx-auto">
		<div class="space-y-4 text-center">
			<h2 class="text-xl font-bold text-error">Error</h2>
			<p class="text-on-surface-variant">{$setup.error}</p>
			<Button onclick={() => setup.checkStatus()} variant="outlined">
				Retry
			</Button>
		</div>
  </Card>
{/if}