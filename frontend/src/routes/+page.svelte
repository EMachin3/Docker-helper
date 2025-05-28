<script>
	import { onMount } from 'svelte';
	//TODO: remove rectangle import. this is just for testing figuring out the
	//ideal layout for stuff within the rectangle
	import { BooksTitle, RectanglesContainer, Rectangle } from '$lib/components';

	let books = [];

	async function getBooks() {
		const response = await fetch('http://localhost:4000/books');
		books = await response.json();
	}

	// onMount(getBooks);
</script>

<!-- <BooksTitle />
<ul>
  {#each books as book (book.id)}
    <li>{book.title}</li>
  {/each}
</ul> -->

<!-- <div class="centered-wrapper">
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
</style> -->

<Rectangle label='ffmpeg'/>
