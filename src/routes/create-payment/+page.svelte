<script lang="ts">
  import CreatePayoutView from "$lib/components/dashboard/CreatePayoutView.svelte";
  import { goto } from "$app/navigation";

  // When canceling out of create payment, go back to dashboard
  function handleCancel() {
    goto("/");
  }
</script>

<svelte:head>
  <title>Create Payment - HDFC Bank</title>
</svelte:head>

<CreatePayoutView on:cancel={handleCancel} />
