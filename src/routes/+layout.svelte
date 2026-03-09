<script lang="ts">
  import { page } from "$app/stores";
  import Navigation from "$lib/components/Navigation.svelte";
  import { logout } from "$lib/state/auth.svelte.js";
  import "./layout.css";

  let { children } = $props();

  // Hide navigation on auth routes
  let isAuthRoute = $derived(
    $page.url.pathname === "/login" || $page.url.pathname === "/signup"
  );
</script>

<div class="flex min-h-screen bg-slate-50">
  {#if !isAuthRoute}
    <Navigation />
  {/if}
  <main
    class="{isAuthRoute
      ? 'w-full'
      : 'md:ml-28 w-full md:w-[calc(100%-7rem)]'} min-h-screen flex-1"
  >
    {@render children()}
  </main>
</div>
