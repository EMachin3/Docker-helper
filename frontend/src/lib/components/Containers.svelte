<script>
	import { onMount } from 'svelte';
	import Rectangle from './Rectangle.svelte';

	let userContainers = [];
	let linuxServerContainers = [];
	// newContainers declared as reactive - value changes when userContainer changes
	$: newContainers = linuxServerContainers.filter(
		(x) => !userContainers.some((e) => e.name === x.name)
	);

	async function getUserContainers() {
		const response = await fetch('http://localhost:4000/api/user_containers');
		userContainers = await response.json();
	}

	async function getLinuxServerContainers() {
		const response = await fetch('http://localhost:4000/api/linuxserver_data');
		linuxServerContainers = await response.json();
	}

	async function getNewContainers() {
		await getUserContainers();
		await getLinuxServerContainers();
		// newContainers = linuxServerContainers.filter(
		// 	(x) => !userContainers.some((e) => e.name === x.name)
		// );
	}

	async function addUserContainer(container) {
		// console.log(JSON.stringify(container));
		//TODO: maybe add error handling
		await fetch('http://localhost:4000/api/user_containers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
		await getNewContainers(); //should i await or not here
	}

	onMount(getNewContainers);
</script>

<h2>My containers:</h2>
<div class="container">
	{#each userContainers as container, index}
		<Rectangle
			repo_name={container.name}
			image_url={container.project_logo}
			icon_name="play-button"
			on_click={() => alert(`Run container ${container.name} at index ${index}`)}
		/>
	{/each}
</div>

<h2>Containers to add:</h2>
<div class="container">
	{#each newContainers as container, index}
		<Rectangle
			repo_name={container.name}
			icon_name="add-button"
			on_click={() => addUserContainer(container)}
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
