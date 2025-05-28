<script>
	let { label } = $props();
</script>

<div class="rectangle">
	<p>{label}</p>
</div>

<style>
	.rectangle {
		width: 240px;
		height: 100px;
		background-color: lightblue;
		border: 1px solid #333;
		display: flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
	}
</style>
