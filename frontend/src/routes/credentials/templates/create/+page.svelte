<script>
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";
	import CreateTemplate from "$lib/components/credentials/CreateTemplate.svelte";

</script>
<AuthGuard requireRoles={['issuer', 'admin']}>
  <CreateTemplate />
</AuthGuard>