<script>
    import { onMount } from 'svelte';
    import Rectangle from './Rectangle.svelte';

    let userContainers = null;
    let linuxServerContainers = null;

    async function getUserContainers() {
		const response = await fetch('http://localhost:4000/api/user_containers');
		userContainers = await response.json();
	}

    async function getLinuxServerContainers() {
		const response = await fetch('http://localhost:4000/api/linuxserver_data');
		linuxServerContainers = await response.json();
	}

	// onMount(getLinuxServerContainers);
    onMount(getUserContainers);
</script>

<h2>My containers:</h2>
<div class="container">
    {#each userContainers as container, index}
        <Rectangle repo_name={container.name} image_url={container.project_logo} />
    {/each}
</div>

<!-- <h2>Linux server:</h2>
<div class="container">
    {#each linuxServerContainers as container, index}
        <Rectangle repo_name={container.name} image_url={container.project_logo} />
    {/each}
</div> -->

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