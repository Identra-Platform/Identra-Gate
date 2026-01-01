<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { User, Mail, Lock, CheckCircle, Check, ArrowLeft, CircleCheck } from 'lucide-svelte';

	interface Props {
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
    confirmPassword?: string;
		errors?: Record<string, string>;
		loading?: boolean;
		onSubmit: () => void;
		onBack: () => void;
	}

	let {
		adminName = $bindable(''),
    adminEmail = $bindable(''),
    adminPassword = $bindable(''),
    confirmPassword = $bindable(''),
		errors = {},
		loading = false,
		onSubmit,
		onBack,
		...restProps
	}: Props = $props();

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		onSubmit();
	};
</script>

<Card elevation={1} padding="medium" class="max-w-md mx-auto">
	<div class="mb-6 text-center">
		<div class="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-container text-primary">
			<User />
		</div>
		<h2 class="text-xl font-semibold text-on-surface">Admin Account Setup</h2>
		<p class="mt-1 text-sm text-on-surface-variant">
			Create the initial administrator account
		</p>
	</div>

	{#if errors.submit}
		<Alert variant="error" class="mb-4">
			{errors.submit}
		</Alert>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<div class="space-y-4">
			<div>
				<h3 class="mb-2 text-lg font-medium text-on-surface">Account Information</h3>
				<div class="flex space-x-4">
					<Input
						label="Full Name"
						bind:value={adminName}
						error={errors.adminName}
						required
						placeholder="John Doe"
						leadingIcon={User}
					/>

					<Input
						label="Email Address"
						type="email"
						bind:value={adminEmail}
						error={errors.adminEmail}
						required
						placeholder="admin@example.com"
						leadingIcon={Mail}
					/>
				</div>
			</div>

			<div>
				<div class="space-y-4">
					<Input
						label="Password"
						type="password"
						bind:value={adminPassword}
						error={errors.adminPassword}
						required
						placeholder="••••••••"
						leadingIcon={Lock}
						helperText="Minimum 8 characters with uppercase, lowercase, and numbers"
					/>

					<Input
						label="Confirm Password"
						type="password"
						bind:value={confirmPassword}
						error={errors.confirmPassword}
						required
						placeholder="••••••••"
						leadingIcon={Lock}
					/>

					<div class="rounded-lg bg-surface-container p-4">
						<h4 class="mb-2 font-medium text-on-surface">Password Requirements</h4>
						<ul class="space-y-2 text-sm text-on-surface-variant">
							<li class="flex items-center">
								<CircleCheck class="mr-2 text-green-500 h-8" size="small" />
								Minimum 8 characters
							</li>
							<li class="flex items-center">
								<CircleCheck class="mr-2 text-green-500 h-8" size="small" />
								At least one uppercase letter
							</li>
							<li class="flex items-center">
								<CircleCheck class="mr-2 text-green-500 h-8" size="small" />
								At least one number
							</li>
							<li class="flex items-center">
								<CircleCheck class="mr-2 text-green-500 h-8" size="small" />
								No common words or patterns
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="flex gap-3 pt-2">
			<Button
				type="button"
				variant="outlined"
				size="large"
				onclick={onBack}
				fullWidth
			>
				<ArrowLeft class="mr-2" />
				Back
			</Button>

			<Button
				type="submit"
				variant="filled"
				size="large"
				{loading}
				fullWidth
			>
				{#if loading}
					Creating Account...
				{:else}
					Complete Setup
				{/if}
			</Button>
		</div>
	</form>
</Card>