<script lang="ts">
  import { ArrowLeft, Search, Upload, Calendar } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";
  import TopBar from "$lib/components/dashboard/TopBar.svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import { dbStore, createPayout } from "$lib/state/db.svelte.js";
  import { authState } from "$lib/state/auth.svelte.js";

  const dispatch = createEventDispatcher();

  // Form State
  let accessiblePrograms = $derived(
    dbStore.programs.filter((p: any) => p.payerId === authState.user?.id)
  );
  let programOptions = $derived(
    accessiblePrograms.length > 0
      ? accessiblePrograms.map((p: any) => p.name)
      : ["No Active Programs"]
  );

  let selectedProgram = $state("");
  let realProgram = $derived(
    accessiblePrograms.find((p: any) => p.name === selectedProgram)
  );
  let payeeOptions = $derived(
    realProgram?.enrolledPayees
      ? (() => {
          const matchedOptions = dbStore.users
            .filter(
              (u: any) =>
                u.role === "payee" && realProgram.enrolledPayees.includes(u.id)
            )
            .map((u: any) => u.businessName || u.name);
          return matchedOptions.length > 0
            ? matchedOptions
            : ["No Payees Available"];
        })()
      : ["No Payees Available"]
  );

  let selectedPayee = $state("");

  // Automatically select the first payee if available
  $effect(() => {
    if (payeeOptions.length > 0 && !payeeOptions.includes(selectedPayee)) {
      selectedPayee = payeeOptions[0];
    }
  });
  let currency = $state("INR");
  let amount = $state("10,000");
  let payThroughCard = $state("HDFC pay");
  let dateRange = $state("");

  // Modal States
  let showPreview = $state(false);
  let showSuccess = $state(false);

  function handleCancel() {
    dispatch("cancel");
  }

  function handlePreview() {
    showPreview = true;
  }

  function handleSubmit() {
    showPreview = false;
    showSuccess = true;
  }

  function handleFinish() {
    // Generate the mocked payout record reacting globally on the Dashboard
    // Find the real program ID so it filters correctly
    const realProgram = accessiblePrograms.find(
      (p: any) => p.name === selectedProgram
    );
    const pid = realProgram ? realProgram.id : "prog_med_01";

    createPayout(amount, pid, selectedPayee);
    showSuccess = false;
    dispatch("cancel"); // returns to dashboard
  }
</script>

<div class="flex h-full w-full flex-col bg-slate-50 relative">
  <TopBar showSearch={false} />

  <div class="flex w-full flex-col p-8 pt-4">
    <!-- Main Card Body -->
    <div
      class="relative w-full rounded-2xl bg-white p-10 shadow-sm border border-slate-100 min-h-[600px]"
    >
      <!-- Header Row -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            onclick={handleCancel}
            class="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft class="h-4 w-4" />
          </button>
          <h2 class="text-xl font-semibold text-slate-900">Select Program</h2>
        </div>
        <button
          class="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Upload class="h-4 w-4" /> Upload CSV
        </button>
      </div>

      <!-- Virtual Card Presentation -->
      <div class="mt-8 flex w-full">
        <!-- Virtual Card Node (Widened to w-96 from w-80, ratio maintained) -->
        <div
          class="flex h-60 w-96 flex-col justify-between rounded-3xl bg-[#6a32fc] bg-gradient-to-br from-[#8a42fc] to-[#4a22dc] p-8 shadow-lg relative ring-2 ring-offset-2 ring-transparent"
        >
          <div class="flex justify-between w-full text-white/90">
            <span class="text-sm font-medium">Virtual card</span>
            <div
              class="h-8 w-12 flex text-white relative items-center justify-end"
            >
              <div
                class="h-8 w-8 rounded-full bg-red-500/80 mix-blend-screen absolute right-5"
              ></div>
              <div
                class="h-8 w-8 rounded-full bg-yellow-500/80 mix-blend-screen absolute right-0"
              ></div>
            </div>
          </div>
          <div
            class="flex justify-between w-full text-white/90 mt-auto items-end"
          >
            <span class="font-mono text-[15px] tracking-[0.3em]"
              >**** **** **** 1289</span
            >
            <span class="font-mono text-sm font-medium">09/25</span>
          </div>
        </div>
      </div>

      <hr class="mt-10 border-slate-200" />

      <!-- Form Section -->
      <div class="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <!-- Left Column: Payee & Date -->
        <div class="flex flex-col gap-10">
          <!-- 1. Payee Details -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                >1</span
              >
              <h3 class="text-sm font-semibold text-slate-900">
                Payee Details
              </h3>
            </div>
            <div class="flex gap-4 pl-7">
              <div class="w-1/2 relative flex flex-col gap-2">
                <label
                  for="selectProgram"
                  class="text-xs font-medium text-slate-600"
                  >Select Program</label
                >
                <CustomSelect
                  id="selectProgram"
                  bind:value={selectedProgram}
                  options={programOptions}
                />
              </div>
              <div class="w-1/2 relative flex flex-col gap-2">
                <label
                  for="selectPayee"
                  class="text-xs font-medium text-slate-600"
                  >Business receiving payment</label
                >
                <CustomSelect
                  id="selectPayee"
                  bind:value={selectedPayee}
                  options={payeeOptions}
                />
              </div>
            </div>
          </div>

          <!-- 3. Virtual Card Valid -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                >3</span
              >
              <h3 class="text-sm font-semibold text-slate-900">
                Virtual Card Valid
              </h3>
            </div>
            <div class="pl-7">
              <label
                for="dateRange"
                class="mb-2 block text-xs font-medium text-slate-600"
                >Select Date Range</label
              >
              <div class="relative w-[340px]">
                <Calendar
                  class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="dateRange"
                  type="text"
                  placeholder="Dec 26, 2025 (IST) - Jan 20, 2026 (IST)"
                  class="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-10 text-xs font-medium text-slate-700 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f] cursor-pointer"
                  readonly
                />
                <div
                  class="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Payment Details -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
              >2</span
            >
            <h3 class="text-sm font-semibold text-slate-900">
              Payment Details
            </h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 pl-7">
            <div class="sm:col-span-1 relative flex flex-col gap-2">
              <label
                for="currencyType"
                class="text-xs font-medium text-slate-600">Currency type</label
              >
              <CustomSelect
                id="currencyType"
                bind:value={currency}
                options={["INR", "USD", "EUR"]}
              />
            </div>
            <div class="sm:col-span-2 relative flex flex-col gap-2">
              <label
                for="payableAmount"
                class="text-xs font-medium text-slate-600">Payable Amount</label
              >
              <input
                id="payableAmount"
                type="text"
                bind:value={amount}
                class="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f]"
              />
            </div>
            <div class="sm:col-span-2 relative flex flex-col gap-2">
              <label
                for="payThrough"
                class="text-xs font-medium text-slate-600"
                >Pay through card</label
              >
              <div
                class="relative h-12 w-full rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors cursor-pointer flex items-center px-4 justify-between"
              >
                <div class="flex items-center gap-2">
                  <div class="flex -space-x-1.5 opacity-80 mix-blend-multiply">
                    <div class="h-4 w-4 rounded-full bg-red-500"></div>
                    <div class="h-4 w-4 rounded-full bg-yellow-400"></div>
                  </div>
                  <span class="text-sm font-medium text-slate-600"
                    >{payThroughCard}</span
                  >
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-slate-400"><path d="m6 9 6 6 6-6" /></svg
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="absolute bottom-10 right-10">
        <button
          onclick={handlePreview}
          class="rounded-xl bg-[#7d326f] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#68295c] active:scale-[0.98] cursor-pointer"
        >
          Preview Card
        </button>
      </div>
    </div>
  </div>

  <!-- Preview Modal Overlay -->
  {#if showPreview}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <div class="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <button
          onclick={() => (showPreview = false)}
          class="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer"
        >
          ✕
        </button>
        <p class="text-xs font-medium text-slate-500 mb-2">Paying to</p>
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 p-2 shadow-inner border border-slate-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-slate-700"
              ><rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                ry="2"
              /><line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
              /><line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              /><line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
              /><path d="M9 16h6" /><path d="M12 13v6" /></svg
            >
          </div>
          <h2 class="text-2xl font-semibold text-slate-900">{selectedPayee}</h2>
        </div>

        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1 text-[13px]">
            <span class="font-semibold text-slate-800">Card Validity</span>
            <span class="font-medium text-slate-500"
              >Dec 26, 2025 (IST) - Jan 20, 2026 (IST)</span
            >
          </div>

          <div class="flex flex-col gap-2 text-[13px]">
            <span class="font-semibold text-slate-800">Pay through card</span>
            <div
              class="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div class="flex -space-x-1.5 opacity-80 mix-blend-multiply">
                <div class="h-4 w-4 rounded-full bg-red-500"></div>
                <div class="h-4 w-4 rounded-full bg-yellow-400"></div>
              </div>
              <span class="font-semibold text-slate-700">{payThroughCard}</span>
            </div>
          </div>

          <div class="flex flex-col gap-1 mt-2">
            <span class="text-xs font-semibold text-slate-500"
              >Total Amount</span
            >
            <span class="text-3xl font-semibold text-slate-900"
              >{currency === "INR" ? "₹" : currency} {amount}</span
            >
          </div>
        </div>

        <button
          onclick={handleSubmit}
          class="mt-8 w-full rounded-2xl bg-[#0066cc] py-4 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
        >
          Submit
        </button>
      </div>
    </div>
  {/if}

  <!-- Success Modal Overlay -->
  {#if showSuccess}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-[400px] border border-slate-200 bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center"
      >
        <div class="flex flex-col items-center mt-4 text-center">
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-50 bg-[#0066cc] text-white shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 class="text-[26px] font-semibold tracking-tight text-[#0066cc]">
            Card Generated
          </h2>
        </div>

        <div class="mt-6 w-full rounded-xl border border-slate-200 p-4">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-slate-800"
                >{selectedPayee}</span
              >
              <span class="text-[9px] font-medium text-slate-400 mt-1"
                >Jan, 3rd, 2025, 13:30 PM</span
              >
              <span class="text-[9px] font-medium text-slate-400"
                >Transaction ID: <span class="text-slate-600 font-semibold"
                  >VAD60834B932</span
                ></span
              >
            </div>
            <span class="text-xl font-semibold text-slate-900">₹{amount}</span>
          </div>
        </div>

        <button
          onclick={handleFinish}
          class="mt-6 w-full rounded-xl bg-[#0066cc] py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  {/if}
</div>
