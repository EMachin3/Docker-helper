<script>
	import { onMount } from 'svelte';
	import { BooksTitle, NewContainer } from '$lib/components';

	let testContainers = [];

	async function getTestContainers() {
		const response = await fetch('http://localhost:4000/api/test_containers');
		testContainers = await response.json();
		//add a running flag.
		//TODO: determine if it's necessary to check if each container is running or not.
		//it should be safe to assume that no containers are running when the program starts
		//but I'm not sure
		testContainers = testContainers.map((container) => {
			container.running = false;
			return container;
		});
	}

	//TODO: this one definitely needs error handling
	//TODO: also make sure container ID is getting written to disk
	async function runContainer(container) {
		//TODO: see if you actually need to await here or not
		if (container.id) {
			//resume ("start") existing container
			const response = await fetch('http://localhost:4000/api/start_container', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: container.id
				})
			});
		} else {
			//run new container
			const response = await fetch('http://localhost:4000/api/run_container', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(container)
			});
			const data = await response.json();
			container.id = data.container_id;
		}
		container.running = true; //TODO: only change status if no backend error
		testContainers = [...testContainers]; //re-render the containers so that the icon will update.
	}

	//TODO: add error handling
	async function stopContainer(container) {
		//TODO: see if you actually need to await here or not
		if (container.id) {
			await fetch('http://localhost:4000/api/stop_container', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: container.id
				})
			});
			container.running = false; //TODO: only change status if no backend error
			testContainers = [...testContainers]; //re-render the containers so that the icon will update.
		} else {
			throw new Error('container ID not set');
		}
	}

	onMount(getTestContainers);
</script>

<!-- <Containers /> -->

<h2>Test containers:</h2>
<div class="container">
	{#each testContainers as container, index}
		{#if container.running}
			<NewContainer
				repo_name={container.name}
				image_url="images/testimage.jpg"
				icon_name="stop-button"
				on_click={() => stopContainer(container)}
			/>
		{:else}
			<NewContainer
				repo_name={container.name}
				image_url="images/testimage.jpg"
				icon_name="play-button"
				on_click={() => runContainer(container)}
			/>
		{/if}
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
