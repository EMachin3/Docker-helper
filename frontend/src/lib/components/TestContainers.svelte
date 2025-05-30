<script>
	import { onMount } from 'svelte';
	import { BooksTitle, Rectangle } from '$lib/components';

	let testContainers = [];

	async function getTestContainers() {
		const response = await fetch('http://localhost:4000/api/test_containers');
		testContainers = await response.json();
	}
    
    //TODO: this one definitely needs error handling
    async function runContainer(container) {
        //TODO: see if you actually need to await here or not
		await fetch('http://localhost:4000/api/run_container', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
	}

	onMount(getTestContainers);
</script>

<!-- <Containers /> -->

<h2>Test containers:</h2>
<div class="container">
	{#each testContainers as container, index}
		<Rectangle
			repo_name={container.name}
			image_url="images/testimage.jpg"
			icon_name="play-button"
			on_click={() => runContainer(container)}
		/>
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
