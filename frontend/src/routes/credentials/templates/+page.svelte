<script>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import CredentialsDashboard from "$lib/components/credentials/CredentialsDashboard.svelte";

</script>
<AuthGuard requireRoles={['issuer', 'admin']}>
  <CredentialsDashboard activeSection='templates' />
</AuthGuard>