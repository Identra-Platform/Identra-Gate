<script lang='ts'>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import VerificationResults from "$lib/components/verification/VerificationResults.svelte";

  export let data: { id: string };
</script>
<AuthGuard requireRoles={['verifier', 'admin']}>
  <VerificationResults verificationId={data.id} />
</AuthGuard>