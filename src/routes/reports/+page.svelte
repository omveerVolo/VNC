<script lang="ts">
  import TopBar from "$lib/components/dashboard/TopBar.svelte";
  import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
  import { RefreshCw, FileText } from "lucide-svelte";
  import { authState } from "$lib/state/auth.svelte.js";

  let activeUser = $derived(
    authState.isAdminView ? authState.viewingAs : authState.user
  );

  let entityTabName = $derived(
    activeUser?.role === "payee" ? "Payer" : "Payee"
  );
  let activeTab = $state("Entity");
  let timeFilter = $state("All Time");
  let reportType = $state("Report Type");

  const mockPayers = [
    { name: "Apollo Hospitals" },
    { name: "Fortis Healthcare" },
    { name: "Max Healthcare" },
    { name: "Manipal Hospitals" },
    { name: "Narayana Health" },
    { name: "Medanta - The Medicity" }
  ];
</script>

<svelte:head>
  <title>Manage Reports - HDFC Bank</title>
</svelte:head>

<div class="flex h-full w-full flex-col bg-slate-50">
  <TopBar />

  <div class="flex w-full flex-col p-8 pt-4 pb-20">
    <div
      class="mb-8 w-full rounded-lg bg-white shadow-sm border border-slate-200 min-h-[600px] flex flex-col overflow-hidden"
    >
      <!-- Header Row -->
      <div
        class="border-b border-slate-200 bg-[#f8f9fa] px-6 py-5 flex items-center justify-between"
      >
        <h2 class="text-[17px] font-semibold text-[#003366]">Manage Report</h2>
        <button
          class="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm cursor-pointer"
          aria-label="Manage Report Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            /><path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            /></svg
          >
          <span
            class="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500"
          ></span>
        </button>
      </div>

      <div class="px-6 pb-6 w-full">
        <!-- Filters & Action Row -->
        <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
          <!-- Tabs and Toggles -->
          <div class="flex items-center gap-4">
            <div class="flex rounded-lg bg-slate-100 p-1">
              <button
                onclick={() => (activeTab = "Entity")}
                class="rounded-md px-8 py-2 text-sm font-semibold transition-all shadow-sm {activeTab ===
                'Entity'
                  ? 'bg-white text-[#0066cc] ring-1 ring-slate-200 cursor-default'
                  : 'text-slate-500 hover:text-slate-700 cursor-pointer'}"
              >
                {entityTabName}
              </button>
              <button
                onclick={() => (activeTab = "Program")}
                class="rounded-md px-8 py-2 text-sm font-semibold transition-all {activeTab ===
                'Program'
                  ? 'bg-white text-[#0066cc] shadow-sm ring-1 ring-slate-200 cursor-default'
                  : 'text-slate-500 hover:text-slate-700 cursor-pointer'}"
              >
                Program
              </button>
            </div>

            <div class="w-[140px] relative">
              <CustomSelect
                id="timeFilter"
                bind:value={timeFilter}
                options={[
                  "All Time",
                  "Last 30 Days",
                  "Last 3 Months",
                  "This Year"
                ]}
              />
            </div>

            <div class="w-[180px] relative">
              <CustomSelect
                id="reportType"
                bind:value={reportType}
                options={[
                  "Report Type",
                  "Transaction Summary",
                  "Payout Statement"
                ]}
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3">
            <button
              class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer hover:-translate-y-0.5"
            >
              <RefreshCw class="h-4 w-4" />
            </button>
            <button
              class="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer hover:-translate-y-0.5"
            >
              <FileText class="h-4 w-4" />
              Report History
            </button>
          </div>
        </div>

        <!-- Data Table -->
        <div
          class="mt-8 w-full border border-slate-100 shadow-sm sm:rounded-2xl overflow-hidden"
        >
          <div
            class="grid grid-cols-4 bg-slate-100 p-4 border-b border-slate-200 text-xs font-semibold text-slate-800"
          >
            <div class="col-span-3">
              {activeTab === "Program" ? "Program" : entityTabName}
            </div>
          </div>

          <div class="flex flex-col">
            {#each mockPayers as payer, index}
              <div
                class="grid grid-cols-4 items-center border-b border-slate-100 bg-white p-4 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <div
                  class="col-span-3 text-sm font-semibold text-[#003366] mt-1"
                >
                  {payer.name}
                </div>
                <div class="col-span-1 flex justify-end">
                  <button
                    class="rounded-xl border border-slate-200 px-6 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-green-500 hover:text-green-600 focus:bg-green-50 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
