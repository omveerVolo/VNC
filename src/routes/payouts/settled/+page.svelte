<script lang="ts">
  import { Search, CheckCircle2 } from "lucide-svelte";

  import { dbStore } from "$lib/state/db.svelte.js";
  import { authState } from "$lib/state/auth.svelte.js";

  // Derive target identity securely
  let activeUser = $derived(
    authState.isAdminView ? authState.viewingAs : authState.user
  );

  let searchQuery = $state("");

  // Feed settled payouts from the reactive mock database
  let payouts = $derived(
    (activeUser?.role === "payer"
      ? [...dbStore.payouts].reverse()
      : [...dbStore.payouts]
    )
      .filter((p: any) => p.status === "Settled")
      .filter((p: any) =>
        activeUser?.role === "payee" ? p.userId === activeUser.id : true
      )
      .filter((p: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.providerName.toLowerCase().includes(q) ||
          p.claimNo.toLowerCase().includes(q)
        );
      })
      .map((p: any) => {
        // Find the payer name from the program
        const program = dbStore.programs.find(
          (prog: any) => prog.id === p.programId
        );
        const payerUser = dbStore.users.find(
          (u: any) => u.id === program?.payerId
        );
        const payerName = payerUser
          ? payerUser.businessName || payerUser.name
          : program?.createdBy ||
            program?.payerName ||
            p.payerName ||
            "Unknown Payer";

        return {
          id: p.claimNo,
          program: program?.name || "Medical Payouts 2026",
          provider: activeUser?.role === "payee" ? payerName : p.providerName,
          approvedAmount: `₹${p.amount}`,
          gst: "None",
          payableAmount: `₹${p.amount}`,
          status: p.status,
          utr: `HDFCR${Math.abs(hashString(p.claimNo)).toString().padStart(9, "0")}`
        };
      })
  );

  // Quick consistent hash function to keep UTR static per claim
  function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }
</script>

<svelte:head>
  <title>Manage Claims - HDFC Bank</title>
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
    class="mt-20 w-full rounded-2xl border border-slate-100 bg-white p-8 lg:p-12 shadow-sm flex flex-col overflow-hidden"
  >
    <h1 class="text-2xl tracking-tight text-slate-800 mb-8">
      <span class="text-[#3b2b73]">Track</span> your
      <span class="text-[#3b2b73]">settled</span> claims
    </h1>

    <div class="w-full overflow-x-auto pb-4">
      <div class="min-w-[1000px] flex flex-col">
        <!-- Grid Header -->
        <div
          class="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr] gap-4 rounded-xl bg-[#e6dbf3] px-6 py-4 text-[13px] text-[#5b4897] font-semibold"
        >
          <div class="col-span-1 whitespace-nowrap">Program</div>
          <div class="col-span-1 whitespace-nowrap">Payer</div>
          <div class="col-span-1 whitespace-nowrap">Transaction ID</div>
          <div class="col-span-1 text-center whitespace-nowrap">
            Approved Amount
          </div>
          <div class="col-span-1 text-center whitespace-nowrap">GST</div>
          <div class="col-span-1 text-center whitespace-nowrap">
            Payable Amount
          </div>
          <div class="col-span-1 text-center whitespace-nowrap">UTR</div>
          <div class="col-span-1 text-left whitespace-nowrap">Status</div>
        </div>

        <!-- Grid Rows -->
        <div class="mt-3 flex flex-col gap-3">
          {#each payouts as payout}
            <div
              class="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr] items-center gap-4 rounded-xl border border-transparent bg-slate-50 px-6 py-4 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-default"
            >
              <div
                class="col-span-1 text-[13px] font-semibold text-slate-600 truncate"
              >
                {payout.program}
              </div>

              <div class="col-span-1 flex flex-col items-start xl:truncate">
                <span class="text-[13px] font-semibold text-slate-700"
                  >{payout.provider}</span
                >
              </div>

              <div
                class="col-span-1 font-mono text-slate-500 text-[12px] whitespace-nowrap"
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
                class="col-span-1 text-center font-mono font-medium text-slate-700 text-[11px] whitespace-nowrap"
              >
                {payout.utr}
              </div>

              <div
                class="col-span-1 flex items-center justify-start whitespace-nowrap"
              >
                <div
                  class="bg-[#e8f8f5] text-[#1a7f71] px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1 border border-[#8cdccb] shrink-0"
                >
                  <CheckCircle2 class="h-3 w-3 stroke-[2.5]" />
                  Settled
                </div>
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
                  ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline
                    points="22 4 12 14.01 9 11.01"
                  /></svg
                >
              </div>
              <p class="text-[15px] font-semibold text-slate-700">
                No settled payouts
              </p>
              <p
                class="text-[13px] text-slate-500 mt-1 text-center max-w-[300px]"
              >
                There are currently no completed transactions reflecting in your
                account.
              </p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
