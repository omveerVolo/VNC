<script lang="ts">
  import { ArrowLeft, Search, Upload, Calendar } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";
  import TopBar from "$lib/components/dashboard/TopBar.svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import { apiCall, dbStore, createPayout } from "$lib/state/db.svelte.js";
  import { authState } from "$lib/state/auth.svelte.js";

  const dispatch = createEventDispatcher();

  // Contextual resolver
  let activeUser = $derived(
    authState.isAdminView ? authState.viewingAs : authState.user
  );

  // Form State
  let accessiblePrograms = $derived(
    dbStore.programs.filter((p: any) => p.payerId === activeUser?.id)
  );
  let programOptions = $derived(
    accessiblePrograms.length > 0
      ? accessiblePrograms.map((p: any) => p.name)
      : ["No Active Programs"]
  );

  let selectedProgram = $state("");

  // Automatically select the first program so the payee ladder opens correctly
  $effect(() => {
    if (
      programOptions.length > 0 &&
      !programOptions.includes(selectedProgram) &&
      programOptions[0] !== "No Active Programs"
    ) {
      selectedProgram = programOptions[0];
    }
  });

  let realProgram = $derived(
    accessiblePrograms.find((p: any) => p.name === selectedProgram)
  );
  let programPayees = $state<any[]>([]);
  let payeeOptions = $derived(
    programPayees.length > 0
      ? programPayees.map((p: any) => p.businessName || p.name || p.email)
      : ["No Payees Available"]
  );

  let selectedPayee = $state("");

  $effect(() => {
    if (payeeOptions.length > 0 && !payeeOptions.includes(selectedPayee)) {
      selectedPayee = payeeOptions[0];
    }
  });

  let selectedPayeeId = $derived.by(() => {
    const match = programPayees.find(
      (p: any) => (p.businessName || p.name || p.email) === selectedPayee
    );
    return match?.id || "";
  });

  $effect(() => {
    const programId = realProgram?.id;
    if (!programId) {
      programPayees = [];
      return;
    }
    apiCall(`/programs/payees?programId=${programId}`)
      .then((res) => {
        programPayees = res?.payees || [];
      })
      .catch(() => {
        programPayees = [];
      });
  });
  let currency = $state("INR");
  let amount = $state("10,000");
  let payThroughCard = $state("HDFC pay");
  let validityOptions = ["7 Days", "1 Month", "3 Months"];
  let selectedDateRange = $state("1 Month");
  let showDateDropdown = $state(false);
  let txId = $state("");

  let computedDateRangeText = $derived.by(() => {
    const start = new Date();
    const end = new Date();

    if (selectedDateRange === "7 Days") {
      end.setDate(start.getDate() + 7);
    } else if (selectedDateRange === "1 Month") {
      end.setMonth(start.getMonth() + 1);
    } else if (selectedDateRange === "3 Months") {
      end.setMonth(start.getMonth() + 3);
    }

    const formatOpts = { month: "short", day: "numeric", year: "numeric" };
    const startStr = start.toLocaleDateString("en-US", formatOpts);
    const endStr = end.toLocaleDateString("en-US", formatOpts);

    return `${startStr} (IST) - ${endStr} (IST)`;
  });

  // Modal States
  let showPreview = $state(false);
  let showSuccess = $state(false);
  let isPreviewLoading = $state(false);

  // CSV Upload State
  let fileInput: HTMLInputElement;
  let csvData = $state<any[]>([]);
  let showCsvModal = $state(false);
  let isUploadingCsv = $state(false);

  async function handleCsvUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    isUploadingCsv = true;

    const realProgram = accessiblePrograms.find(
      (p: any) => p.name === selectedProgram
    );
    const pid = realProgram ? realProgram.id : "prog_med_01";
    const payerId = activeUser?.id || "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("payerId", payerId);
    formData.append("programId", pid);

    try {
      const response = await apiCall("/bulk-upload", "POST", formData);

      if (response && response.rows) {
        // Map backend response format to frontend format
        csvData = response.rows.map((r: any, idx: number) => ({
          id: r.payeeId || `csv_${idx}`,
          selected: true,
          email: r.email,
          payeeId: r.payeeId,
          businessName: r.businessName,
          amount: r.amount.toString(),
          currency: currency || "INR",
          validity: r.validity,
        }));
        showCsvModal = true;
      } else {
        console.error("Invalid CSV format from server");
      }
    } catch (err) {
      console.error("Error bulk uploading CSV", err);
    } finally {
      isUploadingCsv = false;
      target.value = ""; // reset input
    }
  }

  function handleCsvDone() {
    showCsvModal = false;
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handlePreview() {
    if (csvData.length > 0) {
      isPreviewLoading = true;
      // Mocking an API call
      setTimeout(() => {
        isPreviewLoading = false;
        showPreview = true;
      }, 1500);
    } else {
      showPreview = true;
    }
  }

  function handleSubmit() {
    // Generate the mocked payout record reacting globally on the Dashboard
    // Find the real program ID so it filters correctly
    const realProgram = accessiblePrograms.find(
      (p: any) => p.name === selectedProgram
    );
    const pid = realProgram ? realProgram.id : "prog_med_01";

    if (csvData.length > 0) {
      const payloadArray = csvData.map((row) => {
        // Find if payee exists
        const match = programPayees.find(
          (p: any) =>
            (p.businessName || p.name || p.email) === (row.businessName || row.email)
        );
        const pidRow = match?.id || row.payeeId || "";
        return {
          amount: row.amount,
          programId: pid,
          payeeId: pidRow,
          payeeLabel: row.businessName || row.email,
          customTxId: row.txId
        };
      });
      createPayout(payloadArray);
    } else {
      createPayout({
        amount,
        programId: pid,
        payeeId: selectedPayeeId,
        payeeLabel: selectedPayee,
        customTxId: txId
      });
    }

    showPreview = false;
    showSuccess = true;
  }

  function handleFinish() {
    showSuccess = false;
    csvData = []; // clear csv after done
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
        <div class="flex gap-2 items-center">
          {#if csvData.length > 0}
            <button
              onclick={() => {
                csvData = [];
              }}
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              Remove CSV
            </button>
          {/if}
          <button
            onclick={() => fileInput?.click()}
            disabled={isUploadingCsv}
            class="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isUploadingCsv}
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"
              ></div>
              Uploading...
            {:else}
              <Upload class="h-4 w-4" /> Upload CSV
            {/if}
          </button>
          <input
            type="file"
            accept=".csv"
            class="hidden"
            bind:this={fileInput}
            onchange={handleCsvUpload}
          />
        </div>
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
                  disabled={csvData.length > 0}
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
              <h3 class="text-sm font-semibold text-slate-900">Validity</h3>
            </div>
            <div class="pl-7">
              <label
                for="dateRange"
                class="mb-2 block text-xs font-medium text-slate-600"
                >Select Expiry</label
              >
              <!-- Custom Date Range Dropdown -->
              <div class="relative w-[340px] mb-8">
                <button
                  type="button"
                  onclick={() => {
                    if (csvData.length === 0)
                      showDateDropdown = !showDateDropdown;
                  }}
                  disabled={csvData.length > 0}
                  class="relative flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[13px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f] transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:hover:border-slate-200"
                >
                  <Calendar
                    class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-800"
                    strokeWidth={2.5}
                  />
                  <span class="truncate">{computedDateRangeText}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-slate-800 transition-transform {showDateDropdown
                      ? 'rotate-180'
                      : ''}"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {#if showDateDropdown}
                  <div
                    class="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
                  >
                    {#each validityOptions as opt}
                      <button
                        type="button"
                        class="flex w-full items-center px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 hover:text-[#0066cc] {selectedDateRange ===
                        opt
                          ? 'bg-[#0066cc]/5 text-[#0066cc]'
                          : 'text-slate-600'}"
                        onclick={() => {
                          selectedDateRange = opt;
                          showDateDropdown = false;
                        }}
                      >
                        {opt}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Payment Details & Transaction ID -->
        <div class="flex flex-col gap-10">
          <!-- 2. Payment Details -->
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
                  class="text-xs font-medium text-slate-600"
                  >Currency type</label
                >
                <CustomSelect
                  id="currencyType"
                  bind:value={currency}
                  options={["INR", "USD", "EUR"]}
                  disabled={csvData.length > 0}
                />
              </div>
              <div class="sm:col-span-2 relative flex flex-col gap-2">
                <label
                  for="payableAmount"
                  class="text-xs font-medium text-slate-600"
                  >Payable Amount</label
                >
                <input
                  id="payableAmount"
                  type="text"
                  bind:value={amount}
                  disabled={csvData.length > 0}
                  class="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f] disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>
              <div class="sm:col-span-2 relative flex flex-col gap-2">
                <label
                  for="payThrough"
                  class="text-xs font-medium text-slate-600"
                  >Pay through card</label
                >
                <div
                  class="relative h-12 w-full rounded-xl border border-slate-200 bg-white transition-colors flex items-center px-4 justify-between"
                  class:hover:border-slate-300={csvData.length === 0}
                  class:cursor-pointer={csvData.length === 0}
                  class:opacity-50={csvData.length > 0}
                  class:bg-slate-50={csvData.length > 0}
                  class:cursor-not-allowed={csvData.length > 0}
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="flex -space-x-1.5 opacity-80 mix-blend-multiply"
                    >
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

          <!-- 4. Transaction ID -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                >4</span
              >
              <h3 class="text-sm font-semibold text-slate-900">
                Transaction ID (Optional)
              </h3>
            </div>
            <div class="pl-7">
              <label
                for="txId"
                class="mb-2 block text-xs font-medium text-slate-600"
                >Transaction ID</label
              >
              <input
                id="txId"
                type="text"
                placeholder="e.g. VAD455648"
                bind:value={txId}
                disabled={csvData.length > 0}
                class="h-12 w-[340px] rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#7d326f] focus:ring-1 focus:ring-[#7d326f] disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="mt-12 flex w-full justify-end">
        <button
          onclick={handlePreview}
          disabled={isUploadingCsv || showCsvModal || isPreviewLoading}
          class="rounded-xl bg-[#7d326f] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#68295c] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
        >
          {#if isPreviewLoading}
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            ></div>
            Loading Preview...
          {:else}
            Preview Card
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Preview Modal Overlay -->
  {#if showPreview}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    >
      <div
        class="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <button
          onclick={() => (showPreview = false)}
          class="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer"
        >
          ✕
        </button>
        <p class="text-sm font-semibold text-slate-600 mb-2">Paying from</p>
        <div class="flex items-center gap-4 mb-6 shrink-0">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 shadow-sm border border-slate-100"
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
            >
              <rect
                width="18"
                height="18"
                x="3"
                y="4"
                rx="2"
                ry="2"
              />
              <line
                x1="16"
                x2="16"
                y1="2"
                y2="6"
              />
              <line
                x1="8"
                x2="8"
                y1="2"
                y2="6"
              />
              <line
                x1="3"
                x2="21"
                y1="10"
                y2="10"
              />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
              <path d="M16 18h.01" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900">{selectedProgram}</h2>
        </div>

        <div class="flex flex-col gap-6 overflow-y-auto pr-2 pb-2 flex-1">
          <!-- CSV Flow -->
          {#if csvData.length > 0}
            <div class="flex flex-col gap-4">
              <div
                class="flex items-center justify-between border-b border-slate-100 pb-2"
              >
                <span class="text-sm font-semibold text-slate-800"
                  >CSV Payouts</span
                >
                <span
                  class="text-xs font-medium bg-blue-50 text-[#0066cc] px-2 py-1 rounded-md"
                  >{csvData.length} records</span
                >
              </div>

              <div class="flex flex-col gap-3">
                {#each csvData as row}
                  <div
                    class="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex flex-col">
                        <span class="font-semibold text-slate-900 text-sm truncate max-w-[150px]">{row.businessName}</span>
                        <span class="font-medium text-slate-500 text-xs mt-0.5">{row.email}</span>
                      </div>
                      <span class="font-bold text-[#0066cc] text-sm"
                        >{row.currency === "INR" ? "₹" : row.currency}
                        {row.amount}</span
                      >
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-medium text-slate-500"
                        >Validity: {row.validity}</span
                      >
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            <!-- Normal Flow -->
          {:else}
            <div class="flex flex-col gap-1 text-[13px]">
              <span class="font-semibold text-slate-800">Paying To</span>
              <span class="font-medium text-slate-700 text-base"
                >{selectedPayee}</span
              >
            </div>

            <div class="flex flex-col gap-1 text-[13px]">
              <span class="font-semibold text-slate-800">Card Validity</span>
              <span class="font-medium text-slate-500"
                >{computedDateRangeText}</span
              >
            </div>

            <div class="flex flex-col gap-1 mt-2">
              <span class="text-xs font-semibold text-slate-500"
                >Total Amount</span
              >
              <span class="text-3xl font-semibold text-slate-900">
                {currency === "INR" ? "₹" : currency}
                {amount}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold text-slate-500"
                >Transaction ID</span
              >
              <span class="font-medium text-slate-700">{txId ? txId : "-"}</span
              >
            </div>
          {/if}

          <!-- Common Bottom Element -->
          <div
            class="flex flex-col gap-2 text-[13px] pt-4 border-t border-slate-100 mt-2 shrink-0"
          >
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
        </div>

        <div class="mt-6 shrink-0 pt-2 bg-white sticky bottom-0">
          <button
            onclick={handleSubmit}
            class="w-full rounded-2xl bg-[#0066cc] py-4 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
          >
            Submit
          </button>
        </div>
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

        <div
          class="mt-6 w-full rounded-xl border border-slate-200 p-4 max-h-[300px] overflow-y-auto"
        >
          {#if csvData.length > 0}
            <div class="flex flex-col gap-4">
              <div
                class="flex justify-between items-center text-sm font-semibold text-slate-800 px-2"
              >
                <span>{csvData.length} Payouts Processed</span>
              </div>
              <div class="flex flex-col gap-3">
                {#each csvData as row}
                  <div
                    class="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-slate-800"
                        >{row.businessName}</span
                      >
                      <p class="text-[12px] font-medium text-slate-500 mt-0.5">
                        {row.email}
                      </p>
                      <span class="text-[10px] font-medium text-slate-400 mt-1"
                        >Validity: <span
                          class="text-slate-600 font-semibold">{row.validity}</span
                        ></span
                      >
                    </div>
                    <span class="text-md font-bold text-[#0066cc]"
                      >{row.currency === "INR" ? "₹" : row.currency}
                      {row.amount}</span
                    >
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <div class="flex items-start justify-between">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-slate-800"
                  >{selectedPayee}</span
                >
                <p class="text-[13px] font-semibold text-slate-900 mt-1">
                  {computedDateRangeText}
                </p>
                <span class="text-[9px] font-medium text-slate-400"
                  >Transaction ID: <span class="text-slate-600 font-semibold"
                    >{txId ? txId : "-"}</span
                  ></span
                >
              </div>
              <span class="text-xl font-semibold text-slate-900"
                >{currency === "INR" ? "₹" : currency}{amount}</span
              >
            </div>
          {/if}
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

  <!-- CSV Modal Overlay -->
  {#if showCsvModal}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        class="relative w-full max-w-5xl bg-white rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
      >
        <div
          class="flex items-center justify-between mb-8 border-b border-slate-100 pb-4"
        >
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Imported CSV Data</h2>
            <p class="text-sm text-slate-500 mt-1">
              Data extracted from the uploaded CSV file. Read-only preview.
            </p>
          </div>
          <button
            onclick={handleCsvDone}
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200"
          >
            ✕
          </button>
        </div>

        <div
          class="flex-1 overflow-auto border border-slate-200 rounded-2xl shadow-sm"
        >
          <table class="w-full text-left text-[13px] whitespace-nowrap">
            <thead
              class="bg-[#f8f9fa] text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm"
            >
              <tr>
                <th class="p-4 border-r border-slate-100">Business Name</th>
                <th class="p-4 border-r border-slate-100">Email</th>
                <th class="p-4 border-r border-slate-100">Amount</th>
                <th class="p-4">Validity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              {#each csvData as row (row.id)}
                <tr class="hover:bg-slate-50 transition-colors">
                  <td
                    class="p-4 font-semibold text-[#003366] border-r border-slate-100"
                    >{row.businessName}</td
                  >
                  <td
                    class="p-4 font-medium text-slate-600 border-r border-slate-100"
                    >{row.email}</td
                  >
                  <td
                    class="p-4 font-semibold text-slate-800 border-r border-slate-100"
                    >{row.amount} {row.currency}</td
                  >
                  <td
                    class="p-4 font-medium text-slate-600"
                    >{row.validity}</td
                  >
                </tr>
              {/each}
              {#if csvData.length === 0}
                <tr>
                  <td
                    colspan="4"
                    class="p-12 text-center text-sm font-medium text-slate-500"
                    >No valid records found in CSV.</td
                  >
                </tr>
              {/if}
            </tbody>
          </table>
        </div>

        <div
          class="mt-8 flex justify-end items-center bg-slate-50 p-5 rounded-2xl border border-slate-200"
        >
          <button
            onclick={handleCsvDone}
            class="rounded-xl bg-[#0066cc] px-8 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#0052a3] active:scale-[0.98] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
