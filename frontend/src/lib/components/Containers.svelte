<script>
	import { onMount } from 'svelte';
	import MyContainer from './MyContainer.svelte';
	import NewContainer from './NewContainer.svelte';

	let userContainers = [];
	let linuxServerContainers = [];
	let containerPulling = {};
	// newContainers declared as reactive - value changes when userContainer changes
	$: newContainers = linuxServerContainers.filter(
		(x) => !userContainers.some((e) => e.name === x.name)
	);

	async function getUserContainers() {
		const response = await fetch('http://localhost:4000/api/user_containers');
		userContainers = await response.json();
		//add a running flag to each user container.
		//TODO: determine if it's necessary to check if each container is running or not.
		//it should be safe to assume that no containers are running when the program starts
		//but I'm not sure
		userContainers = userContainers.map((container) => {
			container.running = false;
			return container;
		});
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
		containerPulling[container.name] = true; //do this to change the icon displayed. maybe there's a better approach?
		containerPulling = { ...containerPulling }; //refresh won't occur unless containerPulling is reassigned
		await fetch('http://localhost:4000/api/user_containers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
		await getNewContainers(); //should i await or not here
		delete containerPulling[container.name];
		containerPulling = { ...containerPulling }; //refresh won't occur unless containerPulling is reassigned
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
			container.id = data.container_id; //TODO: should i do this assignment on the backend and then refresh everything
			//like I do with adding a new container? concerned about desync issues with this
			//but idk if that would actually happen or not
		}
		container.running = true; //TODO: only change status if no backend error
		userContainers = [...userContainers]; //re-render the user containers so that the icon will update.
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
			userContainers = [...userContainers]; //re-render the user containers so that the icon will update.
		} else {
			throw new Error('container ID not set');
		}
	}

	onMount(getNewContainers);
</script>

<h2>My containers:</h2>
<div class="container">
	{#each userContainers as container, index}
		{#if container.running}
			<MyContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="stop-button"
				on_click={() => stopContainer(container)}
			/>
		{:else}
			<MyContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="play-button"
				on_click={() => runContainer(container)}
			/>
		{/if}
	{/each}
</div>

<h2>Containers to add:</h2>
<div class="container">
	{#each newContainers as container, index}
		<!-- not sure if onclick being null would cause issues or not -->
		{#if containerPulling[container.name]}
			<NewContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="loading-icon"
				on_click={() => {}}
			/>
		{:else}
			<NewContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="add-button"
				on_click={() => addUserContainer(container)}
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
