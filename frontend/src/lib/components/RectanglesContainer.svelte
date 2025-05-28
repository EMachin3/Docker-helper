<script>
    import { onMount } from 'svelte';
    import Rectangle from './Rectangle.svelte';

    let containers = null;

    async function getLinuxserverContainers() {
		const response = await fetch('http://localhost:4000/api/linuxserver_data');
		containers = await response.json();
	}

	onMount(getLinuxserverContainers);
</script>

<div class="container">
    {#each containers as container}
        <Rectangle repo_name={container.name} image_url={container.project_logo} />
    {/each}
</div>

<style>
    .container {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 1rem;
        padding: 1rem;
		max-width: fit-content;
        margin: 0 auto;
    }
</style>