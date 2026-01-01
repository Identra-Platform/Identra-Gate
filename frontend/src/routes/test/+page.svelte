<script>
	import HealthMetrics from "$lib/components/health/HealthMetrics.svelte";
	import { mockHealthData } from "$lib/mocks/health-data";

</script>
<HealthMetrics healthData={mockHealthData} />