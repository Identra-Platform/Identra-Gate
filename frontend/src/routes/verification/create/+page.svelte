<script>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import CreateVerificationRequest from "$lib/components/verification/CreateVerificationRequest.svelte";

</script>
<AuthGuard requireRoles={['verifier', 'admin']}>
  <CreateVerificationRequest />
</AuthGuard>