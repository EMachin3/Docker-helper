<script>
	import { onMount } from 'svelte';
	import { BooksTitle, Containers } from '$lib/components';

	let books = [];

	let containers = null;

	async function getBooks() {
		const response = await fetch('http://localhost:4000/books');
		books = await response.json();
	}
</script>

<Containers />
