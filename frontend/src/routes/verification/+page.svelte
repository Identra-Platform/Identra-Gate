<script>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import VerificationDashboard from "$lib/components/verification/VerificationDashboard.svelte";

</script>
<AuthGuard requireRoles={['verifier', 'admin']}>
  <VerificationDashboard activeSection="dashboard" />
</AuthGuard>