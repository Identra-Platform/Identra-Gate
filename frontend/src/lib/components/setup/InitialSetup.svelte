<script lang="ts">
	import type { InitializeRequest } from '$lib/types/api';
	import OrganizationSetup from './OrganizationSetup.svelte';
	import AdminSetup from './AdminSetup.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { Rocket } from 'lucide-svelte';

	interface Props {
		onSubmit: (data: InitializeRequest) => Promise<void>;
		loading?: boolean;
	}

	let { onSubmit, loading = false }: Props = $props();

	let step = $state(1);
	
	let formData: InitializeRequest = $state({
		serverName: '',
		adminEmail: '',
		adminPassword: '',
		confirmPassword: '',
		adminName: ''
	});

	let errors: Record<string, string> = $state({});

	const validateStep1 = () => {
		errors = {};

		if (!formData.serverName.trim()) {
			errors.serverName = 'Organization name is required';
		}

		return Object.keys(errors).length === 0;
	};

	const validateStep2 = () => {
		errors = {};

		if (!formData.adminName.trim()) {
			errors.adminName = 'Admin name is required';
		}

		if (!formData.adminEmail.trim()) {
			errors.adminEmail = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
			errors.adminEmail = 'Invalid email format';
		}

		if (!formData.adminPassword) {
			errors.adminPassword = 'Password is required';
		} else if (formData.adminPassword.length < 8) {
			errors.adminPassword = 'Password must be at least 8 characters';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.adminPassword)) {
			errors.adminPassword = 'Password must include uppercase, lowercase, and numbers';
		}

		if (formData.adminPassword !== formData.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		return Object.keys(errors).length === 0;
	};

	const handleStep1Submit = () => {
		if (validateStep1()) {
			step = 2;
		}
	};

	const handleStep2Submit = async () => {
		if (!validateStep2()) return;

		try {
			await onSubmit(formData);
		} catch (error: any) {
			errors.submit = error.message;
		}
	};

	const handleBack = () => {
		step = 1;
		errors = {};
	};
</script>

<div class="min-h-screen bg-surface p-4 md:p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary-container text-primary">
        <Rocket size="xlarge" />
      </div>
      <h1 class="text-3xl font-bold text-on-surface">Welcome to Verifier</h1>
      <p class="mt-2 text-lg text-on-surface-variant">
        Let's get your system up and running
      </p>
    </div>

    <!-- Progress Bar -->
    <div class="mb-12 max-w-md mx-auto">
      <div class="flex items-center justify-between mb-2">
        <div class={`text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>
          Organization
        </div>
        <div class={`text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>
          Admin Account
        </div>
      </div>
      <Progress value={step === 1 ? 50 : 100} />
    </div>

    <!-- Step Content -->
    <div class="transition-all duration-300">
      {#if step === 1}
        <OrganizationSetup
          bind:serverName={formData.serverName}
          {errors}
          {loading}
          onSubmit={handleStep1Submit}
        />
      {:else}
        <AdminSetup
          bind:adminName={formData.adminName}
          bind:adminEmail={formData.adminEmail}
          bind:adminPassword={formData.adminPassword}
          bind:confirmPassword={formData.confirmPassword}
          {errors}
          {loading}
          onSubmit={handleStep2Submit}
          onBack={handleBack}
        />
      {/if}
    </div>

    <!-- Footer Note -->
    <div class="mt-8 text-center text-sm text-on-surface-variant">
      <p>
        Need help? Check our 
        <a href="#" class="text-primary hover:underline ml-1">setup guide</a>
        or 
        <a href="#" class="text-primary hover:underline ml-1">contact support</a>
      </p>
    </div>
  </div>
</div>