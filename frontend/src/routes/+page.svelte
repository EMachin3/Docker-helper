<script>
  import { onMount } from "svelte";

  let books = [];

  async function getBooks() {
    const response = await fetch("http://localhost:4000/books");
    books = await response.json();
  }

  onMount(getBooks);
</script>

<ul>
  {#each books as book (book.id)}
    <li>{book.title}</li>
  {/each}
</ul>

