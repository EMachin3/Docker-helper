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

	let edit_mode = false;
	let container_editing = null;

	async function getUserContainers() {
		let response = await fetch('http://localhost:4000/api/user_containers');
		const newUserContainers = await response.json();
		response = await fetch('http://localhost:4000/api/user_containers/running');
		const runningContainers = await response.json();

		//add a running flag to each user container.
		userContainers = newUserContainers.map((container) => {
			container.running = runningContainers.some((running) => running.id === container.id);
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
		await getUserContainers(); //should i await or not here
		delete containerPulling[container.name];
		containerPulling = { ...containerPulling }; //refresh won't occur unless containerPulling is reassigned
	}

	/**
	 * this function just enables edit mode and sets the container info, maybe rename?
	 */
	async function editUserContainer(container) {
		//make a deep copy whose values can be bound to without
		//affecting the original container
		container_editing = JSON.parse(JSON.stringify(container));
		edit_mode = true;
	}

	async function closeEditMode() {
		edit_mode = false;
		container_editing = null;
	}

	async function removeUserContainer(container) {
		await fetch('http://localhost:4000/api/user_containers', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
		await getUserContainers(); //should i await or not here
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

	async function updateContainer(container) {
		await fetch('http://localhost:4000/api/user_containers', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
		await getUserContainers(); //should i await or not here
		closeEditMode();
	}

	//maybe just change the container in the frontend and then use the existing updateContainer function/endpoint?
	async function deleteEnvVar(container, env_var) {
		const res = await fetch(
			`http://localhost:4000/api/user_containers/${container.name}/env_var/${env_var.name}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(container)
			}
		);
		//still need to getUserContainers so that userContainers is updated, but since we don't
		//have the index of container_editing we also have to update the frontend form values using
		//the updated container JSON returned from the backend.
		//could also make a separate variable to track the index of container_editing but that honestly
		//could be even more fragile than this approach.
		const data = await res.json();
		container_editing = data.container;
		await getUserContainers(); //should i await or not here
	}

	onMount(getNewContainers);
</script>

<!-- TODO: let users specify custom env vars, volumes, and ports -->
<!-- also add descriptions and buttons to add env var/volume/port -->
{#if edit_mode}
	<form on:submit|preventDefault={() => updateContainer(container_editing)}>
		<h1>{`Edit container configuration for ${container_editing.name}`}</h1>
		<h2>Environment variables:</h2>
		{#each container_editing.config.env_vars as env_var, index}
			<div class="label-wrap">
				<label for={`env_var-${env_var.name}-value`}>{`${env_var.name}:`}</label>
				<!-- <p>{env_var.name}</p> -->
				<input
					name={`env_var-${env_var.name}-value`}
					type="text"
					required={!env_var.optional}
					bind:value={container_editing.config.env_vars[index].value}
				/>
				{#if env_var.optional}
					<button on:click|preventDefault={() => deleteEnvVar(container_editing, env_var)}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
				<!-- <p>{env_var.value}</p> -->
			</div>
		{/each}
		<h2>Volumes: (Format: Container Path: Host Path)</h2>
		{#each container_editing.config.volumes as volume, index}
			<div class="label-wrap">
				<label for={`volume-${volume.path}-hostpath`}>{`${volume.path}:`}</label>
				<input
					name={`volume-${volume.path}-hostpath`}
					type="text"
					required={!volume.optional}
					bind:value={container_editing.config.volumes[index].host_path}
				/>
				{#if volume.optional}
					<button on:click|preventDefault={() => alert('Delete volume ' + JSON.stringify(volume))}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
			</div>
		{/each}
		<h2>Ports (Format: Internal (Container) Port: External (Host) Port)</h2>
		{#each container_editing.config.ports as port, index}
			<div class="label-wrap">
				<label for={`port-${port.external}-externalport`}>{`${port.internal}:`}</label>
				<input
					name={`port-${port.external}-externalport`}
					type="text"
					required={!port.optional}
					bind:value={container_editing.config.ports[index].external}
				/>
				{#if port.optional}
					<button on:click|preventDefault={() => alert('Delete port ' + JSON.stringify(port))}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
			</div>
			<!-- <p>{port.external}</p> -->
			<!-- <p>{port.internal}</p> -->
		{/each}
		<button on:click={() => closeEditMode()}>Close without Saving</button>
		<button type="submit">Save Config</button>
	</form>
{/if}

<h2>My containers:</h2>
<div class="container">
	{#each userContainers as container, index}
		{#if container.running}
			<MyContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="stop-button"
				edit_handler={() => {}}
				remove_handler={() => removeUserContainer(container)}
				interact_click={() => stopContainer(container)}
				disable_edit={true}
			/>
		{:else}
			<MyContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="play-button"
				edit_handler={() => editUserContainer(container)}
				remove_handler={() => removeUserContainer(container)}
				interact_click={() => runContainer(container)}
				disable_edit={false}
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
				interact_click={() => {}}
			/>
		{:else}
			<NewContainer
				repo_name={container.name}
				image_url={container.project_logo}
				icon_name="add-button"
				interact_click={() => addUserContainer(container)}
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
	.label-wrap {
		display: flex;
		margin-bottom: 10px;
	}
</style>
