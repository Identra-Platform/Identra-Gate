<script lang='ts'>
	import HealthMetrics from "$lib/components/health/HealthMetrics.svelte";
	import Loading from "$lib/components/ui/Loading.svelte";
	import { auth } from "$lib/stores/auth";
	import { getDatabaseHealth, getHealth, getLightHealth, getMetrics } from "$lib/utils/api";

  let allData = Promise.all([
    getHealth(auth.hasRole('admin')),
    getMetrics()
  ]).then(([healthPromise, metricsPromise]) => ({
    healthPromise, metricsPromise
  }));

  allData.then(data => {
    console.log(data);
  })
</script>

{#await allData}
  <Loading />
{:then { healthPromise, metricsPromise }}
  <HealthMetrics healthData={healthPromise} />
{/await}
