<script lang="ts">
	import type { InitializeRequest } from '$lib/types/api';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { Building2 } from 'lucide-svelte';

	interface Props {
    serverName?: string;
		errors?: Record<string, string>;
		loading?: boolean;
		onSubmit: () => void;
	}

	let {
		serverName = $bindable(''),
		errors = {},
		loading = false,
		onSubmit,
		...restProps
	}: Props = $props();

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		onSubmit();
	};
</script>

<Card elevation={1} padding="medium" class="max-w-md mx-auto">
	<div class="text-center mb-6">
		<Building2 class="w-12 h-12 mx-auto mb-4 text-primary" />
		<h2 class="text-xl font-semibold text-on-surface">Organization Setup</h2>
		<p class="text-sm text-on-surface-variant mt-1">
			Name your organization
		</p>
	</div>

	{#if errors.submit}
		<Alert variant="error" class="mb-4">
			{errors.submit}
		</Alert>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<Input
			label="Organization Name"
			bind:value={serverName}
			error={errors.serverName}
			required
      leadingIcon={Building2}
			placeholder="Your Organization"
			helperText="This will be displayed to users"
		/>

		<Button
			type="submit"
			variant="filled"
			size="large"
			{loading}
			fullWidth
		>
			{#if loading}
				Continue...
			{:else}
				Continue to Admin Setup
			{/if}
		</Button>
	</form>
</Card>