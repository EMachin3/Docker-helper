<script>
	import { onMount } from 'svelte';
	import { BooksTitle, RectanglesContainer } from '$lib/components';

	let books = [];

	let containers = null;

	async function getBooks() {
		const response = await fetch('http://localhost:4000/books');
		books = await response.json();
	}
</script>

<div class="centered-wrapper">
	<RectanglesContainer />
</div>

<style>
	/* The goal of this is to center the rectangles container within a
	div that takes up all the width. however, this doesn't really work
	because the rectangles container won't shrink to fit upon wrapping.
	currently i don't feel like figuring this out but may in the future.*/
	.centered-wrapper {
		display: flex;
		justify-content: center;
		width: 100%;
	}
</style>
