<script>
    import Rectangle from './Rectangle.svelte';

    let rectangles = Array.from({ length: 30 }, (_, i) => `Box ${i + 1}`);
</script>

<div class="container">
    {#each rectangles as label}
        <Rectangle label={label} />
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