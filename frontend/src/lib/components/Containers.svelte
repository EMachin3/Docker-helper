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

	let adding_env_var = false;
	let new_env_var = {
		name: '',
		value: '',
		desc: '',
		optional: true
	};
	let adding_volume = false;
	let new_volume = {
		path: '',
		host_path: '',
		desc: '',
		optional: true
	};
	let adding_port = false;
	let new_port = {
		external: '',
		internal: '',
		desc: '',
		optional: true
	};

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

	function closeEditMode() {
		edit_mode = false;
		container_editing = null;
		resetEnvVarForm();
		resetVolumeForm();
		resetPortForm();
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

	async function updateContainer(container, should_close) {
		await fetch('http://localhost:4000/api/user_containers', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(container)
		});
		await getUserContainers(); //should i await or not here
		if (should_close) {
			closeEditMode();
		}
	}

	function resetEnvVarForm() {
		adding_env_var = false;
		new_env_var = {
			name: '',
			value: '',
			desc: '',
			optional: true
		};
	}

	function addEnvVar(container) {
		if (!container.config.env_vars) {
			container.config.env_vars = [];
		}
		container.config.env_vars.push(new_env_var);
		resetEnvVarForm();
		//TODO: commented out this because i don't want the field to get deleted until submit.
		//test if this works.
		// await updateContainer(container, false); //should i await or not here
		container_editing = container;
	}

	//maybe just change the container in the frontend and then use the existing updateContainer function/endpoint?
	function deleteEnvVar(container, env_var_index) {
		container.config.env_vars.splice(env_var_index, 1);
		//TODO: commented out this because i don't want the field to get deleted until submit.
		//test if this works.
		// await updateContainer(container, false); //should i await or not here
		container_editing = container;
	}

	function resetVolumeForm() {
		adding_volume = false;
		new_volume = {
			path: '',
			host_path: '',
			desc: '',
			optional: true
		};
	}

	function addVolume(container) {
		if (!container.config.volumes) {
			container.config.volumes = [];
		}
		container.config.volumes.push(new_volume);
		resetVolumeForm();
		container_editing = container;
	}

	function deleteVolume(container, volume_index) {
		container.config.volumes.splice(volume_index, 1);
		container_editing = container;
	}

	function resetPortForm() {
		adding_port = false;
		new_port = {
			external: '',
			internal: '',
			desc: '',
			optional: true
		};
	}

	function addPort(container) {
		if (!container.config.ports) {
			container.config.ports = [];
		}
		container.config.ports.push(new_port);
		resetPortForm();
		container_editing = container;
	}

	function deletePort(container, port_index) {
		container.config.ports.splice(port_index, 1);
		container_editing = container;
	}

	onMount(getNewContainers);
</script>

<!-- TODO: let users specify custom env vars, volumes, and ports -->
<!-- also add descriptions and buttons to add env var/volume/port -->
{#if edit_mode}
	<form on:submit|preventDefault={() => updateContainer(container_editing, true)}>
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
					<button on:click|preventDefault={() => deleteEnvVar(container_editing, index)}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
				<!-- <p>{env_var.value}</p> -->
			</div>
		{/each}
		{#if adding_env_var}
			<h3>Add environment variable:</h3>
			<div class="discount-form">
				<div class="label-wrap">
					<label for="new-env-name">Name:</label>
					<input name={'new-env-name'} type="text" required={true} bind:value={new_env_var.name} />
				</div>
				<div class="label-wrap">
					<label for="new-env-value">Value:</label>
					<input
						name={'new-env-value'}
						type="text"
						required={false}
						bind:value={new_env_var.value}
					/>
				</div>
				<div class="label-wrap">
					<label for="new-env-desc">Description:</label>
					<input name={'new-env-desc'} type="text" required={false} bind:value={new_env_var.desc} />
				</div>
				<!-- <div class="label-wrap">
					<label for="new-env-optional">Optional:</label>
					<input name={'new-env-optional'} type="checkbox" bind:checked={new_env_var.optional} />
				</div> -->
				<button on:click|preventDefault={() => resetEnvVarForm()}>Close without Saving</button>
				<button on:click|preventDefault={() => addEnvVar(container_editing)}>Add</button>
			</div>
		{:else}
			<button on:click|preventDefault={() => (adding_env_var = true)}
				>Add environment variable</button
			>
		{/if}
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
					<button on:click|preventDefault={() => deleteVolume(container_editing, index)}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
			</div>
		{/each}
		{#if adding_volume}
			<h3>Add volume:</h3>
			<div class="discount-form">
				<div class="label-wrap">
					<label for="new-volume-path">Path:</label>
					<input
						name={'new-volume-path'}
						type="text"
						required={true}
						bind:value={new_volume.path}
					/>
				</div>
				<div class="label-wrap">
					<label for="new-volume-host-path">Host path:</label>
					<input
						name={'new-volume-host-path'}
						type="text"
						required={true}
						bind:value={new_volume.host_path}
					/>
				</div>
				<div class="label-wrap">
					<label for="new-volume-desc">Description:</label>
					<input
						name={'new-volume-desc'}
						type="text"
						required={false}
						bind:value={new_volume.desc}
					/>
				</div>
				<button on:click|preventDefault={() => resetVolumeForm()}>Close without Saving</button>
				<button on:click|preventDefault={() => addVolume(container_editing)}>Add</button>
			</div>
		{:else}
			<button on:click|preventDefault={() => (adding_volume = true)}>Add volume</button>
		{/if}
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
					<button on:click|preventDefault={() => deletePort(container_editing, index)}
						>Delete</button
					>
				{:else}
					<button on:click|preventDefault={() => {}} disabled>Delete</button>
				{/if}
			</div>
			<!-- <p>{port.external}</p> -->
			<!-- <p>{port.internal}</p> -->
		{/each}
		<div class="newline">
			{#if adding_port}
				<h3>Add port:</h3>
				<div class="discount-form">
					<div class="label-wrap">
						<label for="new-port-external">External:</label>
						<input
							name={'new-port-external'}
							type="text"
							required={true}
							bind:value={new_port.external}
						/>
					</div>
					<div class="label-wrap">
						<label for="new-port-internal">Internal:</label>
						<input
							name={'new-port-internal'}
							type="text"
							required={true}
							bind:value={new_port.internal}
						/>
					</div>
					<div class="label-wrap">
						<label for="new-port-desc">Description:</label>
						<input name={'new-port-desc'} type="text" required={false} bind:value={new_port.desc} />
					</div>
					<button on:click|preventDefault={() => resetPortForm()}>Close without Saving</button>
					<button on:click|preventDefault={() => addPort(container_editing)}>Add</button>
				</div>
			{:else}
				<button on:click|preventDefault={() => (adding_port = true)}>Add port</button>
			{/if}
		</div>
		<button on:click|preventDefault={() => closeEditMode()}>Close without Saving</button>
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
				edit_handler={() => {
					closeEditMode();
					editUserContainer(container);
				}}
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
	.newline {
		display: block;
		margin-bottom: 25px;
	}
</style>
