<script>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import VerificationSessions from "$lib/components/verification/VerificationSessions.svelte";

</script>
<AuthGuard requireRoles={['verifier', 'admin']}>
  <VerificationSessions />
</AuthGuard>