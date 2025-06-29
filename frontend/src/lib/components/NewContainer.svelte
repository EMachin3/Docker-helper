<script>
	let { repo_name, image_url, icon_name, interact_click } = $props();
</script>

<div class="rectangle">
	<img id="repo_logo" src={image_url} alt={`${repo_name} logo`} width="80px" height="80px" />
	<p id="repo_name">{repo_name}</p>
	<button id="interact_button" onclick={interact_click}
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
		width: 290px;
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
	#interact_button {
		visibility: hidden;
	}
	#interact_icon {
		visibility: visible;
	}
</style>
