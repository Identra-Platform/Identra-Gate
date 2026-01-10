<script>
	import AdminDashboard from "$lib/components/admin/AdminDashboard.svelte";
	import AuthGuard from "$lib/components/auth/AuthGuard.svelte";

</script>
<AuthGuard requireRoles={['admin']}>
  <AdminDashboard activeSection="activity" />
</AuthGuard>