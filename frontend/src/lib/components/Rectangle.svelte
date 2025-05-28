<script>
	let { repo_name, image_url } = $props();
</script>

<div class="rectangle">
	<img src={image_url} alt={`${repo_name} logo`} width='80px' height='80px'>
	<p>{repo_name}</p>
	<img src='images/play-button.svg' alt='Play button' width='80px' height='80px' style='margin-right: 5px'>
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
</style>
