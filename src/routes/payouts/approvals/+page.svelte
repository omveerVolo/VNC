<script lang="ts">
  import { Search, CheckCircle2 } from "@lucide/svelte";

  import { dbStore, approvePayerPayout } from "$lib/state/db.svelte.js";
  import { authState } from "$lib/state/auth.svelte.js";

  let selectedPayoutIds = $state<string[]>([]);

  let searchQuery = $state("");
  let isAllSelected = $state(false);
  let showSuccessModal = $state(false);

  let currentPage = $state(1);
  const itemsPerPage = 10;

  // Reset page when search query changes
  $effect(() => {
    if (searchQuery !== undefined) {
      currentPage = 1;
    }
  });

  // Derived state reading exclusively payloads that need Payer action
  let filteredPayouts = $derived(
    dbStore.payouts
      .filter((p: any) => {
        if (p.status !== "Pending Payer") return false;

        if (authState.user?.role === "payee") {
          return p.userId === authState.user?.id;
        } else {
          // Payer can only approve payouts strictly mapping into Programs they explicitly own
          const matchingProgram = dbStore.programs.find(
            (prog: any) => prog.id === p.programId
          );
          return (
            matchingProgram && matchingProgram.payerId === authState.user?.id
          );
        }
      })
      .filter((p: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.providerName.toLowerCase().includes(q) ||
          p.claimNo.toLowerCase().includes(q)
        );
      })
      .map((p: any) => ({
        dbId: p.id, // Keep a reference to the global mutable ID
        id: p.claimNo,
        program: "Medical Payouts 2026",
        payer: p.providerName,
        approvedAmount: `₹${p.amount}`,
        gst: "₹1,250",
        payableAmount: `₹${p.amount}`,
        status: p.status
      }))
  );

  let paginatedPayouts = $derived(
    filteredPayouts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  );

  let totalPages = $derived(
    Math.ceil(filteredPayouts.length / itemsPerPage) || 1
  );

  function toggleSelectAll() {
    isAllSelected = !isAllSelected;
    if (isAllSelected) {
      // Select all in current view or all globally? Usually all in view is safer,
      // but let's select all filtered to be robust.
      selectedPayoutIds = filteredPayouts.map((p: any) => p.dbId);
    } else {
      selectedPayoutIds = [];
    }
  }

  function handleApprove() {
    if (selectedPayoutIds.length > 0) {
      showSuccessModal = true;
    }
  }

  function handleDone() {
    // Process approvals into the master database
    for (const id of selectedPayoutIds) {
      approvePayerPayout(id);
    }

    // Clear visual state
    selectedPayoutIds = [];
    isAllSelected = false;
    showSuccessModal = false;
  }
</script>

<svelte:head>
  <title>Approve Payments - HDFC Bank</title>
</svelte:head>

<div
  class="flex h-full w-full flex-col p-8 lg:p-12 relative overflow-y-auto min-h-screen"
>
  <!-- Global Search Bar centered at top mimicking the wireframe -->
  <div class="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-lg z-10">
    <div
      class="flex h-12 w-full items-center overflow-hidden rounded-full border border-slate-200 bg-white px-2 shadow-sm transition-shadow"
    >
      <input
        type="text"
        placeholder="Start Typing....."
        bind:value={searchQuery}
        class="h-full flex-1 bg-transparent px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      <button
        class="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ebddef] px-4 text-[13px] font-semibold text-[#7d326f] transition-colors hover:bg-[#d8c3df] cursor-pointer"
      >
        <Search
          class="h-3.5 w-3.5"
          strokeWidth={2.5}
        />
        Search
      </button>
    </div>
  </div>

  <!-- Primary Wrapper box with blue border mimicking wireframes -->
  <div
    class="mt-20 w-full rounded-2xl border border-slate-100 bg-white p-8 lg:p-12 shadow-sm flex flex-col overflow-hidden relative min-h-[600px]"
  >
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl tracking-tight text-slate-800">
        <span class="text-[#3b2b73]">Approve</span> your
        <span class="text-[#3b2b73]">payments</span>
      </h1>
      <button
        onclick={toggleSelectAll}
        class="border border-slate-300 rounded-lg px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        Select All
      </button>
    </div>

    <div class="w-full overflow-x-auto pb-4">
      <div class="min-w-[1000px] flex flex-col">
        <!-- Grid Header -->
        <div
          class="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_1fr] gap-4 rounded-xl bg-[#e6dbf3] px-6 py-4 text-[13px] text-[#5b4897] font-semibold"
        >
          <div class="col-span-1 whitespace-nowrap">Program</div>
          <div class="col-span-1 whitespace-nowrap text-center">Payer</div>
          <div class="col-span-1 whitespace-nowrap text-center">Claim ID</div>
          <div class="col-span-1 text-center whitespace-nowrap">
            Approved Amount
          </div>
          <div class="col-span-1 text-center whitespace-nowrap">GST</div>
          <div class="col-span-1 text-center whitespace-nowrap">
            Payable Amount
          </div>
          <div class="col-span-1 text-center whitespace-nowrap">Status</div>
          <div class="col-span-1 text-center whitespace-nowrap">Action</div>
        </div>

        <!-- Grid Rows -->
        <div class="mt-3 flex flex-col gap-3">
          {#each paginatedPayouts as payout}
            <div
              class="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_1fr] items-center gap-4 rounded-xl border border-transparent bg-slate-50 px-6 py-4 transition-all hover:shadow-sm cursor-default"
            >
              <div
                class="col-span-1 text-[13px] font-semibold text-slate-600 truncate"
              >
                {payout.program}
              </div>

              <div
                class="col-span-1 text-center text-[13px] font-semibold text-slate-700 xl:truncate"
              >
                {payout.payer}
              </div>

              <div
                class="col-span-1 text-center font-mono text-slate-500 text-[12px] whitespace-nowrap"
              >
                {payout.id}
              </div>

              <div
                class="col-span-1 text-center font-semibold text-slate-900 text-[13px] whitespace-nowrap"
              >
                {payout.approvedAmount}
              </div>

              <div
                class="col-span-1 text-center text-[13px] text-slate-600 whitespace-nowrap"
              >
                {payout.gst}
              </div>

              <div
                class="col-span-1 text-center font-semibold text-slate-900 text-[13px] whitespace-nowrap"
              >
                {payout.payableAmount}
              </div>

              <div
                class="col-span-1 flex items-center justify-center text-center"
              >
                <span
                  class="text-[12px] font-medium {payout.status === 'Approved'
                    ? 'text-green-600'
                    : 'text-[#f48a60]'} whitespace-nowrap transition-colors"
                >
                  {payout.status}
                </span>
              </div>

              <div
                class="col-span-1 flex items-center justify-center whitespace-nowrap"
              >
                {#if payout.status === "Approved"}
                  <div
                    class="h-[22px] w-[22px] rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm border border-transparent transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><polyline points="20 6 9 17 4 12"></polyline></svg
                    >
                  </div>
                {:else}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                  <label
                    class="cursor-pointer flex items-center justify-center group"
                  >
                    <input
                      type="checkbox"
                      class="hidden"
                      checked={selectedPayoutIds.includes(payout.dbId)}
                      onchange={(e) => {
                        if (e.currentTarget.checked) {
                          selectedPayoutIds = [
                            ...selectedPayoutIds,
                            payout.dbId
                          ];
                        } else {
                          selectedPayoutIds = selectedPayoutIds.filter(
                            (id) => id !== payout.dbId
                          );
                        }
                      }}
                    />
                    <div
                      class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border {selectedPayoutIds.includes(
                        payout.dbId
                      )
                        ? 'border-[#1a7f71] bg-white'
                        : 'border-slate-300 bg-white group-hover:border-[#1a7f71]'} transition-colors"
                    >
                      {#if selectedPayoutIds.includes(payout.dbId)}
                        <CheckCircle2
                          class="h-[22px] w-[22px] text-[#1a7f71]"
                        />
                      {/if}
                    </div>
                  </label>
                {/if}
              </div>
            </div>
          {:else}
            <div
              class="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm mt-4 w-full"
            >
              <div
                class="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-slate-400"
                  ><rect
                    x="2"
                    y="4"
                    width="20"
                    height="16"
                    rx="2"
                  /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg
                >
              </div>
              <p class="text-[15px] font-semibold text-slate-700">
                No pending approvals
              </p>
              <p
                class="text-[13px] text-slate-500 mt-1 text-center max-w-[300px]"
              >
                There are no payloads requiring your explicit authorization
                currently mapped under your account.
              </p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div
      class="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 pr-36 lg:pr-48"
    >
      <span class="text-[13px] font-medium text-slate-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
          currentPage * itemsPerPage,
          filteredPayouts.length
        )} of {filteredPayouts.length} entries
      </span>
      <div class="flex items-center gap-2 relative z-10">
        <button
          disabled={currentPage === 1}
          onclick={() => (currentPage -= 1)}
          class="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          Previous
        </button>
        <div
          class="flex items-center justify-center px-4 h-9 bg-slate-50 rounded-lg border border-slate-100 text-[13px] font-semibold text-slate-700"
        >
          Page {currentPage} of {totalPages}
        </div>
        <button
          disabled={currentPage === totalPages}
          onclick={() => (currentPage += 1)}
          class="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Floating Approve Button -->
    <div class="absolute bottom-8 right-8 lg:bottom-12 lg:right-12">
      <button
        onclick={handleApprove}
        disabled={selectedPayoutIds.length === 0}
        class="bg-[#6e56cf] hover:bg-[#5a46aa] text-white px-8 py-3 rounded-xl text-[14px] font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Approve
      </button>
    </div>

    <!-- Success Modal Overlay -->
    {#if showSuccessModal}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      >
        <div
          class="relative w-[320px] rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center border border-slate-100 ring-1 ring-black/5"
          onclick={(e) => e.stopPropagation()}
        >
          <h2 class="text-[17px] font-semibold text-[#3b2b73] mb-6 text-center">
            All Payments Approved
          </h2>
          <button
            class="w-full py-2.5 rounded-lg bg-[#5b4897] text-white text-[13px] font-semibold shadow-sm hover:bg-[#433177] transition-colors cursor-pointer"
            onclick={handleDone}
          >
            Done
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
