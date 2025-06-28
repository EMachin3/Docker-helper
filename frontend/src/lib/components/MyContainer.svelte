<script>
	let { repo_name, image_url, icon_name, on_click } = $props();
</script>

<div class="rectangle">
	<img id="repo_logo" src={image_url} alt={`${repo_name} logo`} width="80px" height="80px" />
	<p id="repo_name">{repo_name}</p>
	<div class="container_options">
		<button class="option_button" id="edit_button">Edit</button>
		<button class="option_button" id="delete_button">Delete</button>
	</div>
	<button id="interact_button" onclick={on_click}
		><img
			id="interact_icon"
			src={`images/${icon_name}.svg`}
			alt="Play button"
			width="80px"
			height="80px"
		/></button
	>
</div>

<style>
	.rectangle {
		width: 349px;
		height: 100px;
		background-color: lightblue;
		border: 1px solid #333;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-sizing: border-box;
	}
	p {
		overflow-x: hidden;
		text-overflow: ellipsis;
	}
	/* for some reason all 3 of these rules are necessary. */
	.container_options {
		display: inline-block;
	}
	.option_button {
		display: block;
		width: 100%;
	}
	#edit_button {
		margin-bottom: 5px;
	}
	#interact_button {
		visibility: hidden;
	}
	#interact_icon {
		visibility: visible;
	}
</style>
