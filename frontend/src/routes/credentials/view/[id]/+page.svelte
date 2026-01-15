<script lang='ts'>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import CredentialDetail from "$lib/components/credentials/CredentialDetail.svelte";

  export let data: { id: string };
</script>
<AuthGuard requireRoles={['issuer', 'admin', 'verifier']}>
  <CredentialDetail credentialId={data.id} />
</AuthGuard>